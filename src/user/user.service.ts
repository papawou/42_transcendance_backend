import { isDef } from '@/technical/isDef';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import prisma from 'src/database/prismaClient';

@Injectable()
export class UserService {

	getUser = async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { blocked: true, friends: true },
		});
		return user;
	}

	sendFriendRequest = async (id1: number, id2: number) => {
		if (id1 === id2) {
			throw new ForbiddenException();
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					pending: {
						connect: { id: id2 },
					},
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					pendingOf: {
						connect: { id: id1 },
					},
				},
			}),
		]);
		return await prisma.user.findUnique({ where: { id: id1 } });
	}

	refuseFriendRequest = async (id1: number, id2: number) => {

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					pendingOf: {
						disconnect: { id: id2 },
					},
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					pending: {
						disconnect: { id: id1 },
					},
				},
			}),
		]);
		return await prisma.user.findUnique({ where: { id: id1 } });
	}


	addFriend = async (id1: number, id2: number) => {

		this.refuseFriendRequest(id1, id2);

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					friends: { connect: { id: id2 } }
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					friends: { connect: { id: id1 } }
				},
			}),
		]);

		return await prisma.user.findUnique({ where: { id: id1 } });
	}

	deleteFriend = async (id1: number, id2: number) => {

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					friends: {
						disconnect: { id: id2 }
					},
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					friends: {
						disconnect: { id: id1 }
					},
				},
			}),
		]);
		return await prisma.user.findUnique({ where: { id: id1 } });
	}

	blockUser = async (id1: number, id2: number) => {

		const areFriends = await prisma.user.findUnique({
			where: { id: id1 },
			select: { friends: { where: { id: id2 } } }
		});

		if (areFriends) {
			this.deleteFriend(id1, id2);
		}

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					blocked: {
						connect: { id: id2 }
					},
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					blockedOf: {
						connect: { id: id1 }
					},
				},
			}),
		]);
		return await prisma.user.findUnique({ where: { id: id1 } });
	}

	unblockUser = async (id1: number, id2: number) => {

		await prisma.$transaction([
			prisma.user.update({
				where: { id: id1 },
				data: {
					blocked: {
						disconnect: { id: id2 }
					},
				},
			}),
			prisma.user.update({
				where: { id: id2 },
				data: {
					blockedOf: {
						disconnect: { id: id1 }
					},
				},
			}),
		]);
		return await prisma.user.findUnique({ where: { id: id1 } });
	}

	isBlocked = async (id1: number, id2: number) => {

		const isblocked = await prisma.user.findUnique({
			where: { id: id1 },
			include: { blockedOf: { where: { id: id2 } } }
		});
		return isblocked?.blockedOf.length;
	}

	isPending = async (id1: number, id2: number) => {
		const isPending = await prisma.user.findUnique({
			where: { id: id1 },
			include: { pendingOf: { where: { id: id2 } } }
		});
		return isPending?.pendingOf.length;
	}

	isFriend = async (id1: number, id2: number) => {
		const isFriend = await prisma.user.findUnique({
			where: { id: id1 },
			include: { friends: { where: { id: id2 } } }
		});
		return isFriend?.friends.length;
	}

	changeUsername = async (id: number, newName: string) => {

		const updatedUser = await prisma.user.update({
			where: { id: id },
			data: {
				name: newName,
			},
		});

		return updatedUser;
	}

	changeAvatar = async (userId: number, image: string) => {

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				pic: image,
			}
		});

		return updatedUser;
	}
}
