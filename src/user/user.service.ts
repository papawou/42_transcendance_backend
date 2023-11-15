import { isDef } from '@/technical/isDef';
import { Injectable, NotFoundException } from '@nestjs/common';
import { NotFoundError } from 'rxjs';
import prisma from 'src/database/prismaClient';

@Injectable()
export class UserService {


	getUser = async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: {id: userId},
			include: {blocked: true}
		});

		return user;
	}

	sendFriendRequest = async (id1: number, id2: number) => {
		if (id1 === id2) {
			throw new Error(`Utilisateur ${id1} ne peut pas ajouter l'utilisateur ${id2}`);
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
			include: {blocked: {where: {id: id2}}}
		});
		return isblocked?.blocked.length;
	}

	changeUsername = async (id: number, newName: string) => {

		console.log(newName);
		const updatedUser = await prisma.user.update({
			where: { id: id },
			data: {
				name: newName,
			},
		});

		return updatedUser;
	}
}
