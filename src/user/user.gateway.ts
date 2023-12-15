import { Inject, NotFoundException, UseGuards } from "@nestjs/common";
import { ConnectedSocket, MessageBody, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io"
import { UserService } from "./user.service";
import { isDef } from "@/technical/isDef";
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { AuthSocket, WSAuthMiddleware } from "@/events/auth-socket.middleware";


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
	}

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('sendFriendRequest')
	async sendFriendRequest(@ConnectedSocket() connectSocket: Socket, @MessageBody() body: {id: number}){

		const updatedUser = await this.userService.sendFriendRequest(1, 2);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}
}
