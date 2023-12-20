import {
	MessageBody,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	ConnectedSocket,
	OnGatewayConnection,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { ChatService, MessageDto, RoomDto, RoomReturnDto, UserDto } from './chat.service';
import { Inject } from '@nestjs/common';
import { comparePwd } from 'src/password/bcrypt';
import { WsJwtAuthGuard } from "@/auth/ws-jwt-auth.guard";
import { UseGuards } from "@nestjs/common";
import { AuthSocket, WSAuthMiddleware } from '@/events/auth-socket.middleware';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { isBoolean, isNumber, isString } from 'class-validator';
import { isDef } from '@/technical/isDef';

@WebSocketGateway({ cors: true })
export class ChatGateway implements OnGatewayConnection {

	@WebSocketServer()
	server!: Server;

	constructor(@Inject(ChatService) private chatService: ChatService,
		private jwtService: JwtService, private configService: ConfigService) { }

	afterInit(server: Server) {
		const middle = WSAuthMiddleware(this.jwtService, this.configService);
		server.use(middle)
	}

	@SubscribeMessage('connection')
	async handleConnection(@ConnectedSocket() client: AuthSocket, ...args: any[]) {

		this.chatService.createUser(client); //testing USER
		this.chatService.addSocketToRooms(client);
		this.server.in('user_' + client.user.userId.toString())
	}

	/*********************** CREATE ROOM  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('createRoom')
	async createRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, password: string, privacy: boolean }) {
		if (!body || !isString(body.roomName) || !isString(body.password) || !isBoolean(body.privacy))
			return;
		if (this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'Room name already taken' });
			return;
		}
		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		if (!userDto)
			return;

		const newRoom: RoomDto = await this.chatService.createRoom(body.roomName, body.password, body.privacy, userDto);

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(newRoom);

		this.server.to('user_' + userDto.id.toString()).emit('addRoom', { room: roomReturn });
		this.server.to(socket.id).emit('chatNotif', { notif: `Room ${body.roomName} created successfully!` });
		if (body.privacy)
			this.server.emit('roomCreated', { roomName: body.roomName })
	}

	/*********************** JOIN ROOM  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('joinRoom')
	async joinRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, password: string }) {
		if (!body || !isString(body.roomName) || !isString(body.password))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room does not exist.' });
			return;
		}

		let roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!roomDto)
			return;

		if (this.chatService.isUserIdInRoom(socket.user.userId, roomDto)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You are already in this room.' });
			return;
		}

		if (roomDto.password !== '' && body.password === '') {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room is locked by a password.' });
			return;
		}

		if (roomDto.password !== '' && await comparePwd(body.password, roomDto.password) === false) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'Wrong password.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		if (!userDto)
			return;

		if (this.chatService.isBanned(roomDto, userDto.id)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You are banned from this room.' });
			return;
		}

		this.chatService.addToRoom(userDto, roomDto);

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to('user_' + userDto.id.toString()).emit('addRoom', { room: roomReturn });
		this.server.to(socket.id).emit('chatNotif', { notif: 'Room joined successfully!' });
		this.server.to(roomDto.roomName).except('user_' + userDto.id.toString()).emit('roomChanged', { newRoom: roomReturn });
	};

	/*********************** ROOM MESSAGES ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('roomMessage')
	async roomMessage(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, message: string }) {
		if (!body || !isString(body.roomName) || !isString(body.message))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId)
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (this.chatService.isMuted(roomDto, userDto.id)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You are muted from this room.' });
			return;
		}

		const messageDto: MessageDto = this.chatService.addNewRoomMessage(roomDto, userDto, body.message);
		this.server.to(body.roomName).emit('newRoomMessage', { roomName: body.roomName, messageDto: messageDto });
	};

	/*********************** PRIVATE MESSAGE  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('newPrivateMessage')
	async privateMessage(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { userId: number, message: string }) {
		if (!body || !isNumber(body.userId) || !isString(body.message))
			return;
		const sender: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const receiver: UserDto | null = await this.chatService.getUserFromId(body.userId);
		if (!sender || !receiver)
			return;

		const message = this.chatService.addPrivateMessage(sender, receiver, body.message);

		this.server.to('user_' + sender.id.toString()).emit('receivePrivateMsg', { userId: receiver.id, messageDto: message });
		this.server.to('user_' + receiver.id.toString()).emit('receivePrivateMsg', { userId: sender.id, messageDto: message });
		this.server.to('user_' + receiver.id.toString()).emit('chatNotif', { notif: `New message from ${sender.name}` });
	};

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('sendPM')
	async newPMRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { userId: number }) {
		if (!body || !isNumber(body.userId))
			return;
		const sender: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const receiver: UserDto | null = await this.chatService.getUserFromId(body.userId);
		if (!sender || !receiver)
			return;


		if (socket.user.userId === body.userId) {
			this.server.to(socket.id).emit('chatNotif', { notif: "You can't PM yourself." });
			return;
		}

		const allSenderMsgs = this.chatService.PrivateMsgList.get(sender.id);
		const allReceiverMsgs = this.chatService.PrivateMsgList.get(receiver.id);

		if (isDef(allSenderMsgs) && isDef(allReceiverMsgs)) {
			const senderHasReceiver = allSenderMsgs.some(entry => entry.userDto.id === receiver.id);
			const receiverHasSender = allReceiverMsgs.some(entry => entry.userDto.id === sender.id);
			if (senderHasReceiver && receiverHasSender) {
				this.server.to(socket.id).emit('chatNotif', { notif: `Already in a discussion with ${receiver.name}` });
				return;
			}
		}

		this.chatService.addToPmList(sender, receiver);

		this.server.to('user_' + sender.id.toString()).emit('newPrivateMsgUser', { userDto: receiver });
		this.server.to('user_' + receiver.id.toString()).emit('newPrivateMsgUser', { userDto: sender });
	};

	/*********************** LEAVE EVENT ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('leaveRoom')
	async leaveCurrentRoom(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string }) {
		if (!body || !isString(body.roomName))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}
		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;


		if (roomDto.owner === userDto.id) {
			this.chatService.destroyRoom(roomDto);
			this.server.emit('deleteRoom', { roomName: body.roomName });
			this.server.to(body.roomName).emit('chatNotif', { notif: `Room ${body.roomName} has been deleted.` });
			this.server.socketsLeave(body.roomName);
			return;
		}

		this.chatService.leaveRoom(userDto.id, roomDto);
		this.server.to('user_' + userDto.id.toString()).emit('deleteRoom', { roomName: body.roomName });
		this.server.to(socket.id).emit('chatNotif', { notif: `You left ${body.roomName}!` });
		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to(roomDto.roomName).emit('roomChanged', { newRoom: roomReturn });
	};

	/*********************** CHANGE PASSWORD  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('changePassword')
	async changePassword(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, password: string }) {
		if (!body || !isString(body.roomName) || !isString(body.password))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (roomDto.owner !== userDto.id) {
			this.server.to(socket.id).emit('chatNotif', { notif: `An error has occured.` });
			return;
		}

		await this.chatService.changePassword(roomDto, body.password);
		this.server.to(socket.id).emit('chatNotif', { notif: `Password changed successfully.` });
	};


	/*********************** KICK EVENT ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('kickUser')
	async kickUser(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, userId: number }) {
		if (!body || !isString(body.roomName) || !isNumber(body.userId))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;


		if (!this.chatService.isAdminFromRoom(userDto.id, roomDto)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You need to be Admin.' });
			return;
		}

		if (roomDto.owner === body.userId || userDto.id === body.userId) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'An error has occured.' });
			return;
		}

		if (!roomDto.users.find(({ id }) => id === body.userId)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This user is no longer in the room.' });
			return;
		}

		this.chatService.leaveRoom(body.userId, roomDto);
		this.server.to('user_' + body.userId.toString()).emit('deleteRoom', { roomName: body.roomName });
		this.server.to('user_' + body.userId.toString()).emit('chatNotif', {
			notif: `You got kicked from ${body.roomName}!`
		});

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to(roomDto.roomName).emit('roomChanged', { newRoom: roomReturn });
	};

	/*********************** SET ADMIN EVENT  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('setAdmin')
	async setAdmin(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, userId: number }) {
		if (!body || !isString(body.roomName) || !isNumber(body.userId))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (roomDto.owner !== userDto.id) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'An error has occured.' });
			return;
		}

		if (!roomDto.users.find(({ id }) => id === userDto.id)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This user is no longer in the room.' });
			return;
		}

		this.chatService.setAdmin(roomDto, body.userId);

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to('user_' + body.userId).to('user_' + userDto.id).emit('roomChanged', { newRoom: roomReturn });

		const newAdmin: UserDto | null = await this.chatService.getUserFromId(body.userId);
		if (!newAdmin)
			return;
		this.server.to(socket.id).emit('chatNotif', { notif: `${newAdmin.name} is now admin!` });
	};

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('unsetAdmin')
	async unsetAdmin(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, userId: number }) {
		if (!body || !isString(body.roomName) || !isNumber(body.userId))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (roomDto.owner !== userDto.id) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'An error has occured.' });
			return;
		}

		if (!roomDto.users.find(({ id }) => id === userDto.id)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This user is no longer in the room.' });
			return;
		}

		this.chatService.unsetAdmin(roomDto, body.userId);

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to('user_' + body.userId).to('user_' + userDto.id).emit('roomChanged', { newRoom: roomReturn });

		const newAdmin: UserDto | null = await this.chatService.getUserFromId(body.userId);
		if (!newAdmin)
			return;
		this.server.to(socket.id).emit('chatNotif', { notif: `${newAdmin.name} is no longer admin!` });
	};

	/*********************** BAN EVENT  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('banUser')
	async banUser(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, userId: number, time: number }) {
		if (!body || !isString(body.roomName) || !isNumber(body.userId) || !isNumber(body.time))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (!this.chatService.isAdminFromRoom(userDto.id, roomDto)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You need to be Admin.' });
			return;
		}

		if (roomDto.owner === body.userId || userDto.id === body.userId) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'An error has occured.' });
			return;
		}

		if (roomDto.users.find(({ id }) => id === body.userId) && body.time >= 0) {
			this.chatService.leaveRoom(body.userId, roomDto);
			this.server.to('user_' + body.userId.toString()).emit('deleteRoom', { roomName: body.roomName });
			this.server.to('user_' + body.userId.toString()).emit('chatNotif', {
				notif: `You got banned from ${body.roomName} for ${body.time} minutes.`
			});
		}

		this.chatService.setBanTime(roomDto, body.userId, body.time);

		const roomReturn: RoomReturnDto = this.chatService.getReturnRoom(roomDto);
		this.server.to(roomDto.roomName).emit('roomChanged', { newRoom: roomReturn });
	};

	/*********************** MUTE EVENT  ************************/

	@UseGuards(WsJwtAuthGuard)
	@SubscribeMessage('muteUser')
	async muteUser(@ConnectedSocket() socket: AuthSocket, @MessageBody() body: { roomName: string, userId: number, time: number }) {
		if (!body || !isString(body.roomName) || !isNumber(body.userId) || !isNumber(body.time))
			return;
		if (!this.chatService.roomExist(body.roomName)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'This room no longer exists.' });
			return;
		}

		const userDto: UserDto | null = await this.chatService.getUserFromId(socket.user.userId);
		const roomDto: RoomDto | undefined = this.chatService.getRoomFromName(body.roomName);
		if (!userDto || !roomDto)
			return;

		if (!this.chatService.isAdminFromRoom(userDto.id, roomDto)) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'You need to be Admin.' });
			return;
		}

		if (roomDto.owner === body.userId || userDto.id === body.userId) {
			this.server.to(socket.id).emit('chatNotif', { notif: 'An error has occured.' });
			return;
		}

		if (roomDto.users.find(({ id }) => id === body.userId) && body.time >= 0) {
			this.server.to('user_' + body.userId.toString()).emit('chatNotif', {
				notif: `You got muted from ${body.roomName} for ${body.time} minutes.`
			});
		}

		this.chatService.setMuteTime(roomDto, body.userId, body.time);
	};
}