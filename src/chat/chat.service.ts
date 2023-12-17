import { Injectable } from '@nestjs/common';
import { hashPwd } from 'src/password/bcrypt';
import { Socket } from 'socket.io';
import { UserService } from 'src/user/user.service';
import { DefaultEventsMap } from 'socket.io/dist/typed-events';
import { AuthSocket } from '@/events/auth-socket.middleware';
import { User } from '@prisma/client';

export interface UserDto {
	id: number;
	name: string;
}
export interface MessageDto {
	userId: number;
	userName: string;
	message: string;
};

export interface PrivateMsgsDto {
	userDto: UserDto;
	messages: Array<MessageDto>;
};

export interface RoomDto {
	roomName: string;
	owner: number;
	admins: Array<number>;
	users: Array<UserDto>;
	messages: Array<MessageDto>;
	password: string;
	privacyPublic: boolean,
	mutedMap: Map<number, number>;
	banMap: Map<number, number>;
};

export interface RoomReturnDto {
	roomName: string;
	owner: number;
	admins: Array<number>;
	users: Array<UserDto>;
	messages: Array<MessageDto>;
};

@Injectable()
export class ChatService {

	constructor(
		private userService: UserService,
	) {
		this.RoomList = new Map();
		this.PrivateMsgList = new Map();
		this.UserSockets = new Map();

	}

	public RoomList: Map<string, RoomDto>;
	public PrivateMsgList: Map<number, PrivateMsgsDto[]>;
	public UserSockets: Map<number, Socket[]>;


	/*********************** CREATE ROOM  ************************/


	async createRoom(roomName: string, password: string, privacyPublic: boolean, userDto: UserDto): Promise<RoomDto> {
		const roomDto: RoomDto = {
			roomName: roomName,
			owner: userDto.id,
			admins: [userDto.id],
			users: [],
			messages: [],
			privacyPublic: privacyPublic ? true : false,
			password: password && password !== '' ? await hashPwd(password) : password,
			mutedMap: new Map(),
			banMap: new Map(),
		};

		this.RoomList.set(roomName.toUpperCase(), roomDto);
		this.addToRoom(userDto, roomDto);
		return roomDto;
	}

	/*********************** JOIN ROOM  ************************/


	addToRoom(userDto: UserDto, room: RoomDto) {
		if (room.users.find(({ id }) => id === userDto.id)) {
			return;
		}
		room.users.push(userDto);
		this.RoomList.set(room.roomName.toUpperCase(), room);

		const sockets: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>[] | undefined = this.getSocketsFromUser(userDto.id);

		if (sockets) {
			sockets.forEach(socket => socket.join(room.roomName));
		}
	}

	/*********************** SEND MESSAGE ROOM && PRIVATE MESSAGE ************************/

	addNewRoomMessage(room: RoomDto, user: UserDto, message: string): MessageDto {
		const messageDto: MessageDto = {
			message: message,
			userId: user.id,
			userName: user.name,
		};

		room.messages.push(messageDto);
		this.RoomList.set(room.roomName.toUpperCase(), room);
		return messageDto;
	}

	addToPmList(sender: UserDto, receiver: UserDto) {
		let allSenderMsgs = this.PrivateMsgList.get(sender.id);
		let allReceiverMsgs = this.PrivateMsgList.get(receiver.id);

		if (!allSenderMsgs) {
			allSenderMsgs = [{ userDto: receiver, messages: [] }]
		}
		else {
			const userMessagesIdx = allSenderMsgs.findIndex(({ userDto }) => userDto.id === receiver.id);

			if (userMessagesIdx < 0) {
				allSenderMsgs.push({ userDto: receiver, messages: [] });
			}
		}

		if (!allReceiverMsgs) {
			allReceiverMsgs = [{ userDto: sender, messages: [] }]
		}
		else {
			const userMessagesIdx = allReceiverMsgs.findIndex(({ userDto }) => userDto.id === sender.id);

			if (userMessagesIdx < 0) {
				allReceiverMsgs.push({ userDto: sender, messages: [] });
			}
		}
		this.PrivateMsgList.set(sender.id, allSenderMsgs);
		this.PrivateMsgList.set(receiver.id, allReceiverMsgs);
	}

	addPrivateMessage(sender: UserDto, receiver: UserDto, message: string): MessageDto {
		let allSenderMsgs = this.PrivateMsgList.get(sender.id);
		let allReceiverMsgs = this.PrivateMsgList.get(receiver.id);

		if (!allSenderMsgs || !allReceiverMsgs) {
			allSenderMsgs = [];
			allReceiverMsgs = [];
			this.PrivateMsgList.set(sender.id, allSenderMsgs);
			this.PrivateMsgList.set(receiver.id, allReceiverMsgs);
		}

		const senderMsgs = allSenderMsgs.find(({ userDto }) => userDto.id === receiver.id);
		const receiverMsgs = allReceiverMsgs.find(({ userDto }) => userDto.id === sender.id);

		if (senderMsgs && receiverMsgs) {
			const messageDto: MessageDto = {
				message: message,
				userId: sender.id,
				userName: sender.name,
			};

			senderMsgs.messages.push(messageDto);
			receiverMsgs.messages.push(messageDto);

			this.PrivateMsgList.set(sender.id, allSenderMsgs);
			this.PrivateMsgList.set(receiver.id, allReceiverMsgs);

			return messageDto;
		} else {
			throw new Error("Sender or receiver not found in PrivateMsgList");
		}
	}

	/*********************** LEAVE ROOM  ************************/

	leaveRoom(userId: number, room: RoomDto) {
		const userIndex = room.users.findIndex(({ id }) => id === userId);

		if (userIndex > -1) {
			room.users.splice(userIndex, 1);
		}

		const adminIndex = room.admins.indexOf(userId);

		if (adminIndex > -1) {
			room.admins.splice(adminIndex, 1);
		}

		this.RoomList.set(room.roomName.toUpperCase(), room);

		const sockets: Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, any>[] | undefined = this.getSocketsFromUser(userId);

		if (sockets) {
			sockets.forEach((socket) => {
				socket.leave(room.roomName);
			});
		}
	}

	destroyRoom(room: RoomDto) {
		this.RoomList.delete(room.roomName.toUpperCase());
	}

	/*********************** CHANGE PW ************************/

	async changePassword(roomDto: RoomDto, password: string) {
		if (password === '') {
			roomDto.password = '';
		}
		else {
			roomDto.password = await hashPwd(password);
		}
		this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
	}


	/*********************** Set Events  ************************/

	setAdmin(roomDto: RoomDto, userId: number) {
		if (!this.isAdminFromRoom(userId, roomDto)) {
			roomDto.admins.push(userId);
			this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
		}
	}

	unsetAdmin(roomDto: RoomDto, userId: number) {
		const adminIndex = roomDto.admins.indexOf(userId);

		if (adminIndex > -1) {
			roomDto.admins.splice(adminIndex, 1);
		}

		this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);

	}

	setBanTime(roomDto: RoomDto, userId: number, time: number) {
		if (time <= 0) {
			roomDto.banMap.delete(userId);
		}
		else {
			roomDto.banMap.set(userId, time * 60 * 1000 + Date.now());
		}
		this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
	}

	setMuteTime(roomDto: RoomDto, userId: number, time: number) {
		if (time === 0) {
			roomDto.mutedMap.delete(userId);
		}
		else {
			roomDto.mutedMap.set(userId, time * 60 * 1000 + Date.now());
		}
		this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
	}

	/*********************** CONTROLLER ************************/

	getAllRoomsFromUser(userId: number): RoomDto[] {
		const userRooms: RoomDto[] = []
		this.RoomList.forEach((value) => {
			if (value.users.some(({ id }) => id === userId))
				userRooms.push(value);
		})
		return userRooms;
	}

	getAllPublicRooms(): string[] {
		const roomNames: string[] = []

		this.RoomList.forEach(element => {
			if (element.privacyPublic) {
				roomNames.push(element.roomName);
			}
		})
		return roomNames;
	}

	getUserPrivateMsgs(userId: number) {
		return this.PrivateMsgList.get(userId);
	}

	async getUserBlockedUsers(userId: number) { // blocked not found in User schema .....
		const user = await this.userService.getUser(userId);
		if (user === null) {
			return null;
		}
		const blockedUsers: number[] = (user as unknown as { blocked: User[] }).blocked.map(
			(blockedUser) => blockedUser.id
		);
		
		return blockedUsers;
	}

	/*********************** UTILS ************************/

	getRoomFromName(name: string): RoomDto | undefined {
		return (this.RoomList.get(name.toUpperCase()));
	}

	isBanned(roomDto: RoomDto, userId: number): boolean {
		const time: number | undefined = roomDto.banMap.get(userId);
		if (!time) {
			return false;
		}
		if (time <= Date.now()) {
			roomDto.banMap.delete(userId);
			this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
			return false;
		}
		return true;
	}

	isMuted(roomDto: RoomDto, userId: number): boolean {
		const time: number | undefined = roomDto.mutedMap.get(userId);
		if (!time) {
			return false;
		}
		if (time <= Date.now()) {
			roomDto.mutedMap.delete(userId);
			this.RoomList.set(roomDto.roomName.toUpperCase(), roomDto);
			return false;
		}
		return true;
	}

	isUserIdInRoom(userId: number, roomDto: RoomDto): boolean {
		return roomDto.users.some(user => user.id === userId);
	}

	roomExist(roomName: string): boolean {
		return (this.RoomList.has(roomName.toUpperCase()));
	}

	getReturnRoom(roomDto: RoomDto): RoomReturnDto {
		const roomReturnDto: RoomReturnDto = {
			roomName: roomDto.roomName,
			owner: roomDto.owner,
			admins: roomDto.admins,
			users: roomDto.users,
			messages: roomDto.messages,
		};

		return roomReturnDto;
	}

	async getUserFromId(id: number): Promise<UserDto | null> {
		const user = await this.userService.getUser(id);
		if (user === null) {
			return null;
		}
		const userDto: UserDto = {
			id: user.id,
			name: user.name,
		};
		return userDto;
	}

	async addSocketToRooms(socket: AuthSocket) {
		const userDto: UserDto | null = await this.getUserFromId(socket.user.userId); //auth?
		if (!userDto) {
			return;
		}
		this.RoomList.forEach((value) => { value.users.find(({ id }) => id === userDto.id) && socket.join(value.roomName); });
	}

	isAdminFromRoom(userId: number, roomDto: RoomDto): boolean {
		return (roomDto.admins.find(id => id === userId) ? true : false);
	}

	//TEST USER
	async createUser(socket: AuthSocket) {
		const userSockets = this.UserSockets.get(socket.user.userId) ?? []
		this.UserSockets.set(socket.user.userId, [...userSockets, socket]);
		socket.join('user_' + socket.user.userId.toString());
	}

	getSocketsFromUser(userId: number): Socket[] | undefined {
		if (this.UserSockets.has(userId)) {
			return this.UserSockets.get(userId);
		}
		return undefined;
	}
}
