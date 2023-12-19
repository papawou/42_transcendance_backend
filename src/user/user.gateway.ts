import { Inject, NotFoundException, ParseIntPipe, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io"
import { UserService } from "./user.service";
import { isDef } from "@/technical/isDef";
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthSocket, WSAuthMiddleware } from "@/events/auth-socket.middleware";
import prisma from "@/database/prismaClient";


@WebSocketGateway({
	cors: {
		origin: true,
		credentials: true,
	}
})
export class UserGateway implements OnGatewayConnection {

	@WebSocketServer()
	server!: Server;

	constructor(@Inject(UserService) private userService: UserService,
		private jwtService: JwtService, private configService: ConfigService) { }

	afterInit(server: Server) {
		const middle = WSAuthMiddleware(this.jwtService, this.configService);
		server.use(middle)
	}

	@SubscribeMessage('connection')
	async handleConnection(@ConnectedSocket() client: AuthSocket, ...args: any[]) {
		client.join('user_' + client.user.userId.toString());
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('sendFriendRequest')
	async sendFriendRequest(@ConnectedSocket() connectSocket: AuthSocket, @MessageBody() body: { friendId: number }) {
		const viewerId = connectSocket.user.userId
		const targetId = body.friendId

		const viewer = await this.userService.getMetaUser(viewerId);
		if (!isDef(viewer)) {
			return
		}

		if (viewer.friends.some(p => p.id === targetId) //already friends
			|| [...viewer.blocked, ...viewer.blockedOf].some(p => p.id === targetId) //is blocked by viewer || target
			|| viewer.pending.some(p => p.id === targetId) //already pending request from viewer
		) {
			return
		}

		const sucess = viewer.pendingOf.some(p => p.id === targetId) ?
			await this.userService.acceptFriendRequest(viewerId, targetId) //already pending request from target
			: await this.userService.addFriendRequest(viewerId, targetId);
		if (!sucess) {
			return;
		}

		this.emitToUser(targetId, "friendRequestResponse");
		//return updatedUser; TODO what return in front ?
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('acceptFriendRequest')
	async acceptFriendRequest(@ConnectedSocket() connectSocket: AuthSocket, @MessageBody() body: { friendId: number }) {
		const viewerId = connectSocket.user.userId
		const senderId = body.friendId
		
		const success = await this.userService.acceptFriendRequest(viewerId, senderId);
		if (!success) {
			return;
		}

		this.emitToUser(viewerId, "friendRequestResponse")
		this.emitToUser(senderId, "friendRequestResponse")
		this.emitToUser(viewerId, "acceptFriendRequest")
		this.emitToUser(senderId, "acceptFriendRequest")
		//return updatedUser; TODO what return in front ?
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('refuseFriendRequest')
	async refuseFriendRequest(@ConnectedSocket() connectSocket: AuthSocket, @MessageBody() body: { friendId: number }) {
		const viewerId = connectSocket.user.userId
		const senderId = body.friendId

		const success = await this.userService.deleteFriendRequest(senderId, viewerId);
		if (!success) {
			return
		}

		this.emitToUser(viewerId, "friendRequestResponse")
		this.emitToUser(senderId, "friendRequestResponse")
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('deleteFriend')
	async deleteFriend(@ConnectedSocket() connectSocket: AuthSocket, @MessageBody() body: { friendId: number }) {
		const viewerId = connectSocket.user.userId
		const targetId = body.friendId

		const success = await this.userService.deleteFriend(viewerId, targetId);
		if (!success) {
			return;
		}

		this.emitToUser(viewerId, "acceptFriendRequest")
		this.emitToUser(targetId, "acceptFriendRequest")
		//return updatedUser; TODO what return in front ?
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('blockFriend')
	async blockFriend(@ConnectedSocket() connectSocket: AuthSocket, @MessageBody() body: { friendId: number }) {
		const viewerId = connectSocket.user.userId
		const targetId = body.friendId

		const success = await this.userService.blockUser(viewerId, targetId)
		if (!success) {
			return;
		}

		this.emitToUser(viewerId, "friendRequestResponse")
		this.emitToUser(targetId, "friendRequestResponse")
		this.emitToUser(viewerId, "acceptFriendRequest")
		this.emitToUser(targetId, "acceptFriendRequest")
		//return updatedUser; TODO what return in front ?
	}

	//helpers
	emitToUser(userId: number, eventName: string, payload?: any) {
		this.server?.in(`user:${userId}`).emit(eventName, payload)
	}
}
