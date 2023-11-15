import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import Scene from "@/pong/base/Scene";
import { GameEngineData } from "@/pong/base/pong";
import { GameEngineServer } from "@/pong/server/GameEngineServer";
import { PhysicsServer } from "@/pong/server/PhysicsServer";
import { isDef } from "@/technical/isDef";
import { UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";

const userId = 'a'

@WebSocketGateway({ cors: true })
export class EventsGateway implements OnGatewayConnection {
	@WebSocketServer()
	private server?: Server;

	private games: Map<string, GameEngineServer> = new Map()

	@SubscribeMessage('connection')
	handleConnection(@ConnectedSocket() client: Socket) {
		console.log("connect")
	}

	@SubscribeMessage('joinRoom')
	handleJoinRoom(client: Socket, roomId: string) {
		if (!this.games.has(roomId)) {
			this.games.set(roomId, new GameEngineServer(roomId, 500, 500, new Scene(), new PhysicsServer()))
		}
		const game = this.getGame(roomId)
		if (!isDef(game)) {
			return;
		}
		if (!game.joinPlayer(userId)) {
			return false;
		}
		client.join(roomId);
		return game.toData()
	}

	@SubscribeMessage('leaveRoom')
	handleLeaveRoom(client: Socket, roomId: string): void {
		client.leave(roomId);
		const game = this.getGame(roomId)
		if (!isDef(game)) {
			return;
		}
		game.stop();
		this.games.delete(roomId)
	}

	@SubscribeMessage('sendKey')
	handleKey(client: Socket, { roomId, event }: { roomId: string, event: { key: string, isUp: boolean } }) {
		const game = this.getGame(roomId)
		if (!isDef(game)) {
			return;
		}
		if (event.isUp) {
			game.handleKeyUp(event.key, userId)
		}
		else {
			game.handleKeyDown(event.key, userId)
		}
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('setReady')
	handleReady(client: Socket, roomId: string): GameEngineData | undefined {
		console.log(client.handshake)
		const game = this.getGame(roomId);
		if (!isDef(game)) {
			return;
		}
		game.setReadyPlayer(userId)
		if (game.isReady()) {
			this.startGame(game);
		}
		return game.toData();
	}

	startGame(game: GameEngineServer) {
		game.init()
		game.start(() => this.updateGame(game.toData(), game.roomId))
	}

	updateGame(state: GameEngineData, roomId: string) {
		this.server?.in(roomId).emit('updateGame', state);
	}

	getGameData(roomId: string) {
		return this.getGame(roomId)?.toData()
	}

	getGame(roomId: string) {
		return this.games.get(roomId);
	}
}
