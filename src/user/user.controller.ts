import { Body, Controller, FileTypeValidator, Get, MaxFileSizeValidator, NotFoundException, Param, ParseFilePipe, ParseIntPipe, Post, Req, UploadedFile, UseGuards, UseInterceptors, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import prisma from 'src/database/prismaClient';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { isDef } from '@/technical/isDef';
import { CancelFriendRequestDTO, ChangeUsernameDTO, LeaderboardUserDTO, UserDTO, UserExpandedDTO, UserHistoryDTO, UserStatusDTO } from './user.dto';
import { GameService } from '@/game/game.service';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('users')
@Controller('users')
@UsePipes(new ValidationPipe())
export class UserController {
	constructor(private readonly userService: UserService, private readonly gameService: GameService) { }

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
	@Get("/me")
	async getMe(@Req() req: AuthRequest,): Promise<UserExpandedDTO> {
		const user = await this.userService.getUser(req.user.userId)
		if (!isDef(user)) {
			throw new NotFoundException()
		}
		const { ft_id, tfaSecret, ...payload } = user

		return payload;
	}

	@UseGuards(JwtAuthGuard)
	@Get(':id/user/status')
	async getUserStatus(
		@Req() req: AuthRequest,
		@Param('id', ParseIntPipe) id: number
	): Promise<UserStatusDTO> {
		const viewerId = req.user.userId

		const viewer = await this.userService.getUser(viewerId)
		if (!isDef(viewer) || viewer.friends.filter(p => p.id === id).length === 0) {
			return { status: "null" }
		}

		const userStatus = this.gameService.getUserGame(id)
		if (!isDef(userStatus)) {
			return { status: "OFFLINE" }
		}
		if (userStatus.search) {
			return { status: "SEARCH" }
		}
		return { status: isDef(userStatus.gameId) ? "INGAME" : "ONLINE" };
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-name')
	async changeName(
		@Req() req: AuthRequest,
		@Body() body: ChangeUsernameDTO): Promise<UserDTO> {
		const viewerId = req.user.userId
		const updatedUser = await this.userService.changeUsername(viewerId, body.username.trim());

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	// @UseGuards(JwtAuthGuard)
	// @UseInterceptors(FileInterceptor('file'))
	// @Post('/change-avatar')
	// async changeAvatar(
	// 	@Req() req: AuthRequest,
	// 	@UploadedFile(
	// 		new ParseFilePipe({
	// 			validators: [
	// 				new MaxFileSizeValidator({ maxSize: 1000 }),
	// 				new FileTypeValidator({ fileType: 'image/jpeg' }),
	// 				new FileTypeValidator({ fileType: 'image/png' })
	// 			],
	// 		}),
	// 	) file: Express.Multer.File
	// ): Promise<UserDTO> {
	// 	const viewerId = req.user.userId;

	// 	const formData = new FormData();
	//     formData.append('file', Buffer.from(file.buffer), {
	//         filename: file.originalname,
	//         contentType: file.mimetype,
	//     });

	// 	const updatedUser = await this.userService.changeAvatar(viewerId, formData);

	// 	if (!isDef(updatedUser))
	// 		throw new NotFoundException();
	// 	return updatedUser;
	// }

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
		return { ...user, rank: user.rank, wins: user.winGames, loses: user.loseGames };
	}

	@Get('/leaderboard')
	async getLeaderboard(): Promise<LeaderboardUserDTO[]> {
		const leaderboard = await this.userService.getLeaderboard()

		if (!isDef(leaderboard)) {
			throw new NotFoundException()
		}
		return leaderboard
	}


	@UseGuards(JwtAuthGuard)
	@Post('/friendRequest/cancel')
	async cancelFriendRequest(@Req() req: AuthRequest, @Body() body: CancelFriendRequestDTO) {
		const viewerId = req.user.userId
		const taregtId = body.userId

		const success = await this.userService.deleteFriendRequest(viewerId, taregtId)
		if (!success) {
			throw new NotFoundException()
		}
	}
}
