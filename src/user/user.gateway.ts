import { NotFoundException, UseGuards } from "@nestjs/common";
import { ConnectedSocket, OnGatewayConnection, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import {Server, Socket} from "socket.io"
import { UserService } from "./user.service";
import { isDef } from "@/technical/isDef";
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { User } from ".prisma/client";


@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
    }
})
export class UserGateway implements OnGatewayConnection {

	constructor(private readonly userService: UserService) { }

    @WebSocketServer()
        server?: Server;

    async handleConnection(@ConnectedSocket() client: Socket, ...args: any[]) {
        
    }

	@UseGuards(WsJwtAuthGuard)
    @SubscribeMessage('changeUsername')
	async changeUsername (@ConnectedSocket() connectSocket: Socket, newName: string) {
		
		const updatedUser = await this.userService.changeUsername(1 , newName);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}
}
