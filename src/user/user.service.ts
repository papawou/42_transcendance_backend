import { isDef } from '@/technical/isDef';
import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import prisma from 'src/database/prismaClient';

@Injectable()
export class UserService {
	//GETTERS
	getUser = async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { blocked: true, friends: true },
		});

		return user;
	}

	getLeaderboard = async () => {
		const ranks = await prisma.$queryRaw<Array<{ id: number, name: string, rank: number, elo: number }> | null>`SELECT id, name, elo, (RANK() OVER (ORDER BY "User".elo DESC))::int as rank FROM "User"`;
		return ranks
	}

	getUserHistory = async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: {
				winGames: { include: { winner: true, loser: true } },
				loseGames: { include: { winner: true, loser: true } },
			}
		})

		if (!isDef(user)) {
			return undefined
		}

		const rank = await prisma.$queryRaw<{ rank: number } | null>`SELECT ranks.rank::int FROM (SELECT id, RANK() OVER (ORDER BY "User".elo DESC) as rank FROM "User") as ranks WHERE id=${userId}`;
		if (!isDef(rank)) {
			return undefined
		}

		return { ...user, rank: rank.rank }
	}

	getMetaUser = async (userId: number) => {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			include: { blocked: true, blockedOf: true, pending: true, pendingOf: true, friends: true },
		})
		return user
	}

	//FRIENDS
	addFriendRequest = async (senderId: number, targetId: number) => {
		if (senderId === targetId) {
			return false;
		}
		try {
			await prisma.user.update({
				where: {
					id: senderId,
					friends: { none: { id: targetId } },
					blocked: { none: { id: targetId } },
					blockedOf: { none: { id: targetId } },
					pendingOf: { none: { id: targetId } }
				},
				data: {
					pending: { connect: { id: targetId } },
				},
			})
		}
		catch {
			return false;
		}
		return true;
	}

	deleteFriendRequest = async (senderId: number, targetId: number) => {
		if (senderId === targetId) {
			return false;
		}
		try {
			await prisma.user.update({
				where: { id: senderId },
				data: {
					pending: { disconnect: { id: targetId } },
				},
			})
		}
		catch {
			return false;
		}
		return true;
	}


	acceptFriendRequest = async (targetId: number, senderId: number) => {
		if (targetId === senderId) {
			return false;
		}
		try {
			await prisma.$transaction([
				prisma.user.update({
					where: {
						id: targetId,
						pendingOf: { some: { id: senderId } },
						blocked: { none: { id: senderId } },
						blockedOf: { none: { id: senderId } },
					},
					data: {
						friends: { connect: { id: senderId } },
						pending: { disconnect: { id: senderId } }
					},
				}),
				prisma.user.update({
					where: {
						id: senderId,
						pending: { some: { id: targetId } },
						blocked: { none: { id: targetId } },
						blockedOf: { none: { id: targetId } }
					},
					data: {
						friends: { connect: { id: targetId } },
						pending: { disconnect: { id: targetId } }
					},
				})
			])

		}
		catch (e) {
			console.error(e)
			return false;
		}
		return true;
	}

	deleteFriend = async (idUserA: number, idUserB: number) => {
		if (idUserA === idUserB) {
			return false;
		}
		try {
			await prisma.$transaction([
				prisma.user.update({
					where: { id: idUserA },
					data: {
						friends: { disconnect: { id: idUserB } },
					},
				}),
				prisma.user.update({
					where: { id: idUserB },
					data: {
						friends: { disconnect: { id: idUserA } },
					},
				}),
			]);
		}
		catch {
			return false;
		}
		return true;
	}

	blockUser = async (viewerId: number, targetId: number) => {
		if (viewerId === targetId) {
			return false;
		}
		try {
			await prisma.$transaction([
				prisma.user.update({
					where: { id: viewerId },
					data: {
						blocked: { connect: { id: targetId } },
						friends: { disconnect: { id: targetId } },
						pending: { disconnect: { id: targetId } }
					},
				}),
				prisma.user.update({
					where: { id: targetId },
					data: {
						friends: { disconnect: { id: viewerId } },
						pending: { disconnect: { id: viewerId } }
					},
				}),
			]);
		}
		catch {
			return false;
		}
		return true;
	}

	unblockUser = async (viewerId: number, targetId: number) => {
		if (viewerId === targetId) {
			return false;
		}
		try {
			await prisma.user.update({
				where: { id: viewerId },
				data: {
					blocked: { disconnect: { id: targetId } },
				},
			})
		}
		catch {
			return false
		}
		return true
	}

	//SETTERS
	changeUsername = async (userId: number, newName: string) => {
		try {
			return await prisma.user.update({
				where: { id: userId },
				data: {
					name: newName,
				},
			});
		}
		catch { }
		return undefined;
	}

	changeAvatar = async (userId: number, image: string) => {
		try {
			return await prisma.user.update({
				where: { id: userId },
				data: {
					pic: image,
				}
			});
		}
		catch { }

		return undefined;
	}
}
