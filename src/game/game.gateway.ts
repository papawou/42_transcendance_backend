import { GameEngineServer } from "@/pong/GameEngineServer";
import { isDef } from "@/technical/isDef";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer, WsResponse } from "@nestjs/websockets";
import { Server } from "socket.io";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { WsGameJoinRoomDTO, WsGameLeaveRoomDTO, WsGameSendKeyDTO, WsGameSetReadyDTO } from "./game.dto";
import { WS_FAIL, WsGame, WsGameIn, WsGameOut } from "@/shared/ws-game";
import { UserGame } from "@/shared/shared";
import { AuthSocket, WSAuthMiddleware } from "@/events/auth-socket.middleware";
import { GameService } from "./game.service";
import { GameType } from "@/shared/pong/pong";

@WebSocketGateway({ cors: true })
@UsePipes(new ValidationPipe())
export class GameGateway implements OnGatewayConnection, OnGatewayInit {
	private cbIntervalSearch: NodeJS.Timeout;

	@WebSocketServer()
	private server?: Server;

	constructor(private jwtService: JwtService, private configService: ConfigService, private gameService: GameService) {
		this.cbIntervalSearch = setInterval(() => this.cronSearchGame(), 1000);
	}

	cronSearchGame() {
		const match: number[] = []
		for (const user of this.gameService.getUserGames()) {
			if (user[1].search) {
				match.push(user[0])
			}
			if (match.length == 2) {
				break;
			}
		}
		if (match.length != 2) {
			return;
		}
		this.createGame(match, "RANKED")
	}

	afterInit(server: Server) {
		const middle = WSAuthMiddleware(this.jwtService, this.configService);
		server.use(middle)
	}

	@SubscribeMessage('connection')
	handleConnection(@ConnectedSocket() client: AuthSocket) {
		client.join(this.getUserRoom(client.user.userId));
		this.setUserGame(client.user.userId, { search: false }, false)
		client.once("disconnecting", () => this.handleDisconnecting(client))
	}

	handleDisconnecting(client: AuthSocket) {
		const user = this.gameService.getUserGame(client.user.userId);
		this.gameService.userGame.delete(client.user.userId)
		if (!isDef(user) || !isDef(user.gameId)) {
			return;
		}
		const game = this.gameService.getGame(user.gameId);
		if (!isDef(game)) {
			return;
		}
		this.leavePlayer(game, client);
	}

	//meta
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.metaGetUser)
	handleMetaGetUser(@ConnectedSocket() client: AuthSocket) {
		const userId = client.user.userId
		this.emitUserGameToUser(userId)
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.metaGetGame)
	handleMetaGetGame(@ConnectedSocket() client: AuthSocket) {
		const userGame = this.gameService.getUserGame(client.user.userId)
		if (!isDef(userGame) || !isDef(userGame.gameId)) {
			return WS_FAIL;
		}
		const game = this.gameService.getGame(userGame.gameId)
		this.emitToUser(client.user.userId, WsGame.metaGetGame, game?.toData() ?? WS_FAIL)
	}

	//---------------MAIN


	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.joinRoom)
	handleJoinRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameJoinRoomDTO): WsGameOut<WsGame.joinRoom> {
		//userGame q
		const user = this.gameService.getUserGame(client.user.userId);
		if (isDef(user?.gameId) && user?.gameId !== msg.gameId) {
			return false;
		}

		//game
		const game = this.gameService.getGame(msg.gameId);
		if (!isDef(game)) {
			return false;
		}
		if (!game.joinPlayer(client.user.userId)) {
			return false;
		}

		//userGame u
		client.join(this.getGameRoom(game.gameId));
		this.setUserGame(client.user.userId, { gameId: game.gameId, search: false })
		this.emitGameDataToRoom(game, client);
		return true;
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.setReady)
	handleReady(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameSetReadyDTO): WsGameOut<WsGame.setReady> {
		const game = this.gameService.getGame(msg.gameId);
		if (!isDef(game)) {
			return WS_FAIL;
		}
		if (!game.setReadyPlayer(client.user.userId)) {
			return WS_FAIL;
		}
		this.emitGameDataToRoom(game)
		if (game.isReady()) {
			this.startGame(game);
		}
		return true;
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.leaveRoom)
	handleLeaveRoom(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameLeaveRoomDTO): WsGameOut<WsGame.leaveRoom> {
		const game = this.gameService.getGame(msg.gameId)
		if (!isDef(game)) {
			return;
		}
		this.leavePlayer(game, client);
	}

	//---------------RUNNING GAME
	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage(WsGame.sendKey)
	handleKey(@ConnectedSocket() client: AuthSocket, @MessageBody() msg: WsGameSendKeyDTO): WsGameOut<WsGame.sendKey> {
		const game = this.gameService.getGame(msg.gameId)
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

	//---------------EMIT
	//helpers
	emitToUser<T extends WsGame>(userId: number, eventName: T, payload: WsGameOut<T>) {
		this.emitToRoom(this.getUserRoom(userId), eventName, payload)
	}
	emitToRoom<T extends WsGame>(roomName: string, eventName: T, payload: WsGameOut<T>, client?: AuthSocket) {
		if (isDef(client)) {
			client.to(roomName).emit(eventName, payload);
		}
		else {
			this.server?.in(roomName).emit(eventName, payload);
		}
	}

	//USER	
	emitUserGameToUser(userId: number) {
		const payload = this.gameService.getUserGame(userId);
		if (!isDef(payload)) {
			console.warn("emitUserUpdate - inconsistent")
		}
		this.emitToUser(userId, WsGame.metaGetUser, payload ?? WS_FAIL)
	}

	//GAME
	emitGameDataToRoom(game: GameEngineServer, client?: AuthSocket) {
		this.emitToRoom(this.getGameRoom(game.gameId), WsGame.metaGetGame, game.toData(), client)
	}

	postLoop(gameId: string) {
		const game = this.gameService.getGame(gameId);
		if (!isDef(game)) {
			console.warn("postLoop - inconsistent")
			return;
		}
		if (game.status === "CLOSED") {
			this.closeGame(game)
			this.gameService.addHistoryMatch(game.toData())
			return;
		}
		this.emitGameDataToRoom(game)
	}

	//UTILS
	leavePlayer(game: GameEngineServer, client: AuthSocket): boolean {
		if (!isDef(game.getPlayer(client.user.userId))) {
			return false;
		}

		if (game.status === "PENDING") {
			this.closeGame(game, `${client.user.name} leaved the game`)
		}
		return true;
	}

	//---------------GAME
	createGame(match: number[], type: GameType) {
		const game = this.gameService.createGame(match, type);
		if (!isDef(game)) {
			console.warn("error creating game")
			return;
		}

		this.setUserGame(match[0], { gameId: game.gameId, search: false })
		this.setUserGame(match[1], { gameId: game.gameId, search: false })
		return game
	}

	startGame(game: GameEngineServer) {
		game.init()
		game.start(() => this.postLoop(game.gameId))
	}

	closeGame(game: GameEngineServer, reason?: string) {
		game.stop(reason)
		this.emitGameDataToRoom(game)
		this.server?.socketsLeave(this.getGameRoom(game.gameId))
		this.gameService.deleteGame(game.gameId)
		for (const player of game.players.values()) {
			if (isDef(player)) {
				this.setUserGame(player.userId, { search: false })
			}
		}
	}

	//getters
	getUserRoom(userId: number) {
		return `user:${userId}`
	}

	getGameRoom(gameId: string) {
		return `game:${gameId}`
	}

	//setters
	setUserGame(userId: number, userGame: UserGame, force: boolean = true) {
		if (!force && isDef(this.gameService.getUserGame(userId))) {
			this.emitUserGameToUser(userId)
			return;
		}
		this.gameService.setUserGame(userId, userGame)
		this.emitUserGameToUser(userId)
	}
}
