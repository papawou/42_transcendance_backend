import { Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { PrismaClient } from '@prisma/client'
import { ApiTags } from '@nestjs/swagger';
import prisma from 'src/database/prismaClient';

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

	@Post(':id/change-name/:newName')
	async changeName(
		@Param('id') id: string,
		@Param('newName') newName: string) {
		const uid = Number(id);

		const updatedUser = await this.userService.changeUsername(uid, newName);

		return updatedUser;
	}

/*------------------------------FRIENDS--------------------------*/

	@Get(':id/friends')
	async getFriends(@Param('id') userId: string) {
		const uid = Number(userId)
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { friends: true }
		});

		if (!user) {
			throw new Error(`Utilisateur avec l'ID ${userId} non trouvé.`);
		}
		return user.friends;
	}

	@Post(':id/add-friend/:friendId')
	async addFriend(
		@Param('id') userId: string,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(userId);
		const id2 = Number(friendId);

		const updatedUser = await this.userService.addFriend(id1, id2);

		return updatedUser;
	}

	@Post(':id/delete-friend/:friendId')
	async deleteFriend(
		@Param('id') userId: string,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(userId);
		const id2 = Number(friendId)

		const updatedUser = await this.userService.deleteFriend(id1, id2);

		return updatedUser;
	}

	/*------------------------------BLOCK--------------------------*/

	@Post(':id/block-user/:blockedUserId')
	async blockUser(
		@Param('id') userId: string,
		@Param('blockedUserId') blockedUserId: string,
	) {
		const id1 = Number(userId);
		const id2 = Number(blockedUserId);

		const updatedUser = await this.userService.blockUser(id1, id2);

		return updatedUser;
	}

	@Post(':id/unblock-user/:blockedUserId')
	async unblockUser(
		@Param('id') userId: string,
		@Param('blockedUserId') blockedUserId: string,
	) {
		const id1 = Number(userId);
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

	@Post(':id/send-friend-request/:friendId')
	async sendFriendRequest(
		@Param('id') userId: string,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(userId);
		const id2 = Number(friendId);

		const updatedUser = await this.userService.sendFriendRequest(id1, id2);

		return updatedUser;
	}

	@Post(':id/refuse-friend-request/:friendId')
	async refuseFriendRequest(
		@Param('id') userId: string,
		@Param('friendId') friendId: string,
	) {
		const id1 = Number(userId);
		const id2 = Number(friendId);

		const updatedUser = await this.userService.refuseFriendRequest(id1, id2);

		return updatedUser;
	}
}
