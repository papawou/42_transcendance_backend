import { GameEngineServer } from "@/pong/GameEngineServer";
import { isDef } from "@/technical/isDef";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server } from "socket.io";
import { AuthSocket, WSAuthMiddleware } from "./auth-socket.middleware";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UseGuards } from "@nestjs/common";
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { WsGameDTO } from "./game.dto";
import { WS_FAIL, WsGame, WsGameOut } from "@/shared/ws-game";

type UserGame = {
	gameId?: string,
	search: boolean
}

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection, OnGatewayInit {
	private games: Map<string, GameEngineServer> = new Map()
	private userGame: Map<number, UserGame> = new Map()

	@WebSocketServer()
	private server?: Server;

	cbIntervalSearch?: () => void;

	constructor(private jwtService: JwtService, private configService: ConfigService) {

	}

	cronSearchGame() {
		const match: number[] = []
		for (const user of this.userGame) {
			if (user[1].search) {
				match.push(user[0])
			}
			if (user.length == 2) {
				break;
			}
		}
		//create room
	}

	afterInit(server: Server) {
		const middle = WSAuthMiddleware(this.jwtService, this.configService);
		server.use(middle)
	}

	@SubscribeMessage('connection')
	handleConnection(@ConnectedSocket() client: AuthSocket) {
		client.join(`user:${client.user.userId}`);
		this.setUserGame(client.user.userId, { search: false }, false)
		client.once("disconnecting", () => this.handleDisconnecting(client))
	}

	handleDisconnecting(client: AuthSocket) {
		const roomId = this.getClientGame(client);
		if (!isDef(roomId)) {
			return;
		}
		const game = this.games.get(roomId);
		if (!isDef(game)) {
			return;
		}
		this.leavePlayer(game, client);
	}

	//---------------MAIN
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.joinRoom)
	handleJoinRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameDTO[WsGame.joinRoom]): WsGameOut<WsGame.joinRoom> {
		console.log(WsGame.joinRoom)

		//userGame q
		const user = this.getUserGame(client.user.userId);
		if (isDef(user?.gameId) && user?.gameId !== msg.roomId) {
			return WS_FAIL;
		}

		//game
		const game = this.getGame(msg.roomId);
		if (!isDef(game)) {
			return WS_FAIL;
		}
		if (!game.joinPlayer(client.user.userId)) {
			return WS_FAIL;
		}

		//userGame u
		this.setUserGame(client.user.userId, { gameId: game.roomId, search: false })
		client.join(game.roomId);

		this.updateGame(game, client);
		return game.toData()
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.setReady)
	handleReady(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameDTO[WsGame.setReady]): WsGameOut<WsGame.setReady> {
		console.log(WsGame.setReady)

		const game = this.getGame(msg.roomId);
		if (!isDef(game)) {
			return WS_FAIL;
		}
		if (!game.setReadyPlayer(client.user.userId)) {
			return WS_FAIL;
		}

		if (game.isReady()) {
			this.startGame(game);
		}
		return game.toData();
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.leaveRoom)
	handleLeaveRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameDTO[WsGame.leaveRoom]): WsGameOut<WsGame.leaveRoom> {
		console.log(WsGame.leaveRoom)
		const game = this.games.get(msg.roomId)
		if (!isDef(game)) {
			return;
		}
		this.leavePlayer(game, client);
	}

	//---------------RUNNING GAME
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.sendKey)
	handleKey(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameDTO[WsGame.sendKey]): WsGameOut<WsGame.sendKey> {
		console.log(WsGame.sendKey)
		const game = this.getGame(msg.roomId)
		if (!isDef(game)) {
			return;
		}

		if (msg.isUp) {
			game.handleKeyUp(msg.key, client.user.userId)
		}
		else {
			game.handleKeyDown(msg.key, client.user.userId)
		}
	}

	//---------------
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.search)
	handleSearch(@ConnectedSocket() client: AuthSocket): WsGameOut<WsGame.search> {
		const user = this.getUserGame(client.user.userId)
		if (!isDef(user) || isDef(user.gameId)) {
			return WS_FAIL;
		}
		this.setUserGame(client.user.userId, { search: true })
		return true;
	}

	//---------------OUT
	updateGame(game: GameEngineServer, client?: AuthSocket) {
		const state: WsGameOut<WsGame.update> = game.toData();
		if (isDef(client)) {
			client.to(game.roomId).emit(WsGame.update, state);
		}
		else {
			this.server?.in(game.roomId).emit(WsGame.update, state);
		}
	}

	checkCloseGame(game: GameEngineServer): boolean {
		if (!game.isClosed()) {
			return false;
		}
		this.server?.in(game.roomId).emit(WsGame.close);
		this.games.delete(game.roomId)
		return true;
	}

	//utils
	leavePlayer(game: GameEngineServer, client: AuthSocket): boolean {
		if (!game.leavePlayer(client.user.userId)) {
			return false;
		}
		client.leave(game.roomId);
		this.setUserGame(client.user.userId, { search: false })
		if (!this.checkCloseGame(game)) {
			this.updateGame(game)
		}
		return true;
	}

	//---------------GAME
	startGame(game: GameEngineServer) {
		game.init()
		game.start(() => this.updateGame(game))
	}

	getGame(roomId: string) {
		return this.games.get(roomId);
	}

	getClientGame(client: AuthSocket) {
		return Array.from(client.rooms.values()).find(v => v.includes("game:"));
	}

	getUserGame(userId: number) {
		return this.userGame.get(userId)
	}

	setUserGame(userId: number, userGame: UserGame, force: boolean = true) {
		if (!force && this.userGame.has(userId)) {
			return;
		}
		this.userGame.set(userId, userGame)
	}
}
