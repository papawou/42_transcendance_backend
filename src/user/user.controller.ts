import { Controller, Delete, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import prisma from 'src/database/prismaClient';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { AuthRequest } from '@/auth/jwt.strategy';

@ApiTags('users')
@Controller('users')
export class UserController {
	constructor(private readonly userService: UserService) { }

	@Get()
	async getUsers() {
		const users = (await prisma.user.findMany());
		return users;
	}

	@Get(':id/user')
	async getUser(@Param('id') id: string) {
		const uid = Number(id);

		const user = prisma.user.findUnique({
			where: { id: uid },
		})

		return user;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-name/:newName')
	async changeName(
		@Req() req: AuthRequest,
		@Param('newName') newName: string) {
		const uid = Number(req.user.userId);

		const updatedUser = await this.userService.changeUsername(uid, newName);

		return updatedUser;
	}

/*------------------------------FRIENDS--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Get('/friends')
	async getFriends(@Req() req: AuthRequest) {
		const uid = Number(req.user.userId)
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { friends: true }
		});

		if (!user) {
			throw new Error(`Utilisateur avec l'ID ${req.user.userId} non trouvé.`);
		}
		return user.friends;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/add-friend/:friendId')
	async addFriend(
		@Req() req: AuthRequest,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(friendId);

		const updatedUser = await this.userService.addFriend(id1, id2);

		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/delete-friend/:friendId')
	async deleteFriend(
		@Req() req: AuthRequest,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(friendId)

		const updatedUser = await this.userService.deleteFriend(id1, id2);

		return updatedUser;
	}

	/*------------------------------BLOCK--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Post('/block-user/:blockedUserId')
	async blockUser(
		@Req() req: AuthRequest,
		@Param('blockedUserId') blockedUserId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(blockedUserId);

		const updatedUser = await this.userService.blockUser(id1, id2);

		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/unblock-user/:blockedUserId')
	async unblockUser(
		@Req() req: AuthRequest,
		@Param('blockedUserId') blockedUserId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(blockedUserId);

		const updatedUser = await this.userService.unblockUser(id1, id2);

		return updatedUser;
	}

	@Get(':id/blocked')
	async getBlocked(@Param('id') userId: string) {
		const uid = Number(userId)
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { blocked: true }
		});

		if (!user) {
			throw new Error(`Utilisateur avec l'ID ${userId} non trouvé.`);
		}
		return user.blocked;
	}

	/*------------------------------FRIEND-REQUEST--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Post('/send-friend-request/:friendId')
	async sendFriendRequest(
		@Req() req: AuthRequest,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(friendId);

		const updatedUser = await this.userService.sendFriendRequest(id1, id2);

		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/refuse-friend-request/:friendId')
	async refuseFriendRequest(
		@Req() req: AuthRequest,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(req.user.userId);
		const id2 = Number(friendId);
		console.log(id2);
		const updatedUser = await this.userService.refuseFriendRequest(id1, id2);

		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Get('/pending')
	async getPending(@Req() req: AuthRequest) {
		const uid = Number(req.user.userId)
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { pendingOf: true }
		});

		if (!user) {
			throw new Error(`Utilisateur avec l'ID ${req.user.userId} non trouvé.`);
		}
		return user.pendingOf;
	}
}
