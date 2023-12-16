import { Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import prisma from 'src/database/prismaClient';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { User } from '@prisma/client';
import { isDef } from '@/technical/isDef';
import { LeaderboardUserDTO, UserDTO, UserHistoryDTO } from './user.dto';

@ApiTags('users')
@Controller('users')
@UsePipes(new ValidationPipe())
export class UserController {
	constructor(private readonly userService: UserService) { }

	@Get()
	async getUsers(): Promise<UserDTO[]> {
		const users = await prisma.user.findMany();
		return users;
	}

	@Get(':id/user')
	async getUser(@Param('id', ParseIntPipe) id: number): Promise<UserDTO> {
		const user = await this.userService.getUser(id);

		if (!isDef(user))
			throw new NotFoundException();
		return user;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-name/:newName')
	async changeName(
		@Req() req: AuthRequest,
		@Param('newName') newName: string): Promise<UserDTO> { //TODO check IsString param && maxLength (rule enforced in frontend not backend)
		const viewerId = req.user.userId
		const updatedUser = await this.userService.changeUsername(viewerId, newName);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-avatar')
	async changeAvatar(@Req() req: AuthRequest, @Body('image') image: string): Promise<UserDTO> { //TODO check if image is a real image
		const viewerId = req.user.userId;
		const updatedUser = await this.userService.changeAvatar(viewerId, image);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	/*------------------------------FRIENDS--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Get('/friends')
	async getFriends(@Req() req: AuthRequest): Promise<UserDTO[]> {
		const viewerId = req.user.userId

		const user = await this.userService.getUser(viewerId);

		if (!isDef(user))
			throw new NotFoundException();
		return user.friends;
	}

	/*------------------------------BLOCK--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Post('/unblock-user/:blockedUserId')
	async unblockUser(
		@Req() req: AuthRequest,
		@Param('blockedUserId', ParseIntPipe) blockedUserId: number) {
		const viewerId = req.user.userId;

		const success = await this.userService.unblockUser(viewerId, blockedUserId);
		if (!success)
			throw new NotFoundException();
	}

	/*------------------------------FRIEND-REQUEST--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Get('/pending')
	async getPending(@Req() req: AuthRequest): Promise<UserDTO[]> {
		const uid = req.user.userId
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { pendingOf: true }
		});

		if (!isDef(user))
			throw new NotFoundException();
		return user.pendingOf;
	}

	@Get(':id/user/history')
	async getUserHistory(@Param('id', ParseIntPipe) id: number): Promise<UserHistoryDTO> {
		const user = await this.userService.getUserHistory(id);

		if (!isDef(user))
			throw new NotFoundException();
		return { userId: user.id, rank: user.rank, wins: user.winGames, loses: user.loseGames };
	}

	@Get('/leaderboard')
	async getLeaderboard(): Promise<LeaderboardUserDTO[]> {
		const leaderboard = await this.userService.getLeaderboard()

		if (!isDef(leaderboard)) {
			throw new NotFoundException()
		}
		return leaderboard
	}
}
