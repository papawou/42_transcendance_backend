import { IsString, IsBoolean, IsNumber } from 'class-validator';

export class CreateRoomDto {
	@IsString()
	roomName!: string;

	@IsString()
	password!: string;

	@IsBoolean()
	privacy!: boolean;
}

export class JoinRoomDto {
	@IsString()
	roomName!: string;

	@IsString()
	password!: string;
}

export class RoomMessageDto {
	@IsString()
	roomName!: string;

	@IsString()
	message!: string;
}

export class PrivateMessageDto {
	@IsNumber()
	userId!: number;

	@IsString()
	message!: string;
}

export class NewPMRoomDto {
	@IsNumber()
	userId!: number;
}

export class LeaveCurrentRoomDto {
	@IsString()
	roomName!: string;
}

export class ChangePasswordDto {
	@IsString()
	roomName!: string;

	@IsString()
	password!: string;
}

export class KickUserDto {
	@IsString()
	roomName!: string;

	@IsNumber()
	userId!: number;
}

export class SetAdminDto {
	@IsString()
	roomName!: string;

	@IsNumber()
	userId!: number;
}

export class UnsetAdminDto {
	@IsString()
	roomName!: string;

	@IsNumber()
	userId!: number;
}

export class BanUserDto {
	@IsString()
	roomName!: string;

	@IsNumber()
	userId!: number;

	@IsNumber()
	time!: number;
}

export class MuteUserDto {
	@IsString()
	roomName!: string;

	@IsNumber()
	userId!: number;

	@IsNumber()
	time!: number;
}
