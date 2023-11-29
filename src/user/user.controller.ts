import { Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiTags } from '@nestjs/swagger';
import prisma from 'src/database/prismaClient';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { User } from '@prisma/client';
import { isDef } from '@/technical/isDef';

@ApiTags('users')
@Controller('users')
@UsePipes(new ValidationPipe())
export class UserController {
	constructor(private readonly userService: UserService) { }

	@Get()
	async getUsers(): Promise<User[]> {
		const users = await prisma.user.findMany();
		if (!isDef(users))
			throw new NotFoundException();
		return users;
	}

	@Get(':id/user')
	async getUser(@Param('id', ParseIntPipe) id: number): Promise<User> {

		const user = await this.userService.getUser(id);

		if(!isDef(user))
			throw new NotFoundException();
		return user;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-name/:newName')
	async changeName(
		@Req() req: AuthRequest,
		@Param('newName') newName: string): Promise<User> {
		const uid = Number(req.user.userId);

		const updatedUser = await this.userService.changeUsername(uid, newName);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/change-avatar')
	async changeAvatar(@Req() req: AuthRequest, @Body('image') image: string) {
		const userId = Number(req.user.userId);

		const updatedUser = await this.userService.changeAvatar(userId, image);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

/*------------------------------FRIENDS--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Get('/friends')
	async getFriends(@Req() req: AuthRequest): Promise<User[]> {
		const uid = Number(req.user.userId)

		const user = await this.userService.getUser(uid);

		if (!isDef(user))
			throw new NotFoundException();
		return user.friends;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/add-friend/:friendId')
	async addFriend(
		@Req() req: AuthRequest,
		@Param('friendId', ParseIntPipe) friendId: number): Promise<User> {
		const id1 = Number(req.user.userId);

		const updatedUser = await this.userService.addFriend(id1, friendId);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/delete-friend/:friendId')
	async deleteFriend(
		@Req() req: AuthRequest,
		@Param('friendId', ParseIntPipe) friendId: number): Promise<User> {
		const id1 = Number(req.user.userId);

		const updatedUser = await this.userService.deleteFriend(id1, friendId);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	/*------------------------------BLOCK--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Post('/block-user/:blockedUserId')
	async blockUser(
		@Req() req: AuthRequest,
		@Param('blockedUserId', ParseIntPipe) blockedUserId: number): Promise<User> {
		const id1 = Number(req.user.userId);

		if (id1 === blockedUserId)
			throw new ForbiddenException();

		const isPending = await this.userService.isPending(id1, blockedUserId);
		const isPendingOf = await this.userService.isPending(blockedUserId, id1);
		const isFriend = await this.userService.isFriend(id1, blockedUserId);

		if (isPendingOf === 1)
			await this.userService.refuseFriendRequest(blockedUserId, id1);
		if (isPending === 1)
			await this.userService.refuseFriendRequest(id1, blockedUserId);
		if (isFriend === 1)
			await this.userService.deleteFriend(id1, blockedUserId);

		const updatedUser = await this.userService.blockUser(id1, blockedUserId);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/unblock-user/:blockedUserId')
	async unblockUser(
		@Req() req: AuthRequest,
		@Param('blockedUserId', ParseIntPipe) blockedUserId: number): Promise<User> {
		const id1 = Number(req.user.userId);

		const updatedUser = await this.userService.unblockUser(id1, blockedUserId);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	/*------------------------------FRIEND-REQUEST--------------------------*/

	@UseGuards(JwtAuthGuard)
	@Post('/send-friend-request/:friendId')
	async sendFriendRequest(
		@Req() req: AuthRequest,
		@Param('friendId', ParseIntPipe) friendId: number): Promise<User> {
		
		const id1 = Number(req.user.userId);

		const isFriend = await prisma.user.findUnique({
			where: {id: id1},
			include: {
				pendingOf: {
					where: {id: friendId}
			}
		}});

		const isBlocked = await this.userService.isBlocked(id1, friendId);
		const isBlockedOf = await this.userService.isBlocked(friendId, id1);

		if (isBlocked === 1 || isBlockedOf === 1)
			throw new ForbiddenException();

		if (isFriend && isFriend.pendingOf && isFriend?.pendingOf.length > 0)
		{
			const updatedUser = await this.userService.addFriend(id1, friendId);
			await this.userService.addFriend(friendId, id1);

			if(!isDef(updatedUser))
				throw new NotFoundException();
			return updatedUser;
		}

		const updatedUser = await this.userService.sendFriendRequest(id1, friendId);

		if(!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Post('/refuse-friend-request/:friendId')
	async refuseFriendRequest(
		@Req() req: AuthRequest,
		@Param('friendId', ParseIntPipe) friendId: number): Promise<User> {
		const id1 = Number(req.user.userId);

		const updatedUser = await this.userService.refuseFriendRequest(id1, friendId);

		if (!isDef(updatedUser))
			throw new NotFoundException();
		return updatedUser;
	}

	@UseGuards(JwtAuthGuard)
	@Get('/pending')
	async getPending(@Req() req: AuthRequest): Promise<User[]> {
		const uid = Number(req.user.userId)
		const user = await prisma.user.findUnique({
			where: { id: uid },
			include: { pendingOf: true }
		});

		if (!isDef(user))
			throw new NotFoundException();
		return user.pendingOf;
	}
}
