import prisma from "@/database/prismaClient";
import { GameEngineServer } from "@/pong/GameEngineServer";
import { PhysicsServer } from "@/pong/PhysicsServer";
import Scene from "@/shared/pong/Scene";
import { GameEngineData } from "@/shared/pong/pong";
import { UserGame } from "@/shared/shared";
import { isDef } from "@/technical/isDef";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import dayjs from "dayjs";


type Duel = { createdAt: dayjs.Dayjs, targetId: number }

@Injectable()
export class GameService {
	games: Map<string, GameEngineServer> = new Map()
	userGame: Map<number, UserGame> = new Map()
	duels: Map<number, Duel> = new Map()

	async addHistoryMatch(game: GameEngineData) {
		const players = game.players.map(p => p.user).filter(isDef).map(p => ({ userId: p.userId, score: p.score }))
		await prisma.game.create({
			data: {
				id: game.gameId,
				type: "CASUAL",
				players: {
					createMany: {
						data: players
					}
				}
			}
		})
	}

	//GAMES
	createGame(users: number[]) {
		const id = randomUUID()
		const game = new GameEngineServer(id, 500, 500, new Scene(), new PhysicsServer())

		if (!game.joinPlayer(users[0]) || !game.joinPlayer(users[1])) {
			return null
		}
		this.games.set(game.gameId, game);
		return game;
	}

	getGame(gameId: string) {
		return this.games.get(gameId);
	}

	deleteGame(gameId: string) {
		this.games.delete(gameId)
	}

	getGames() {
		return this.games
	}

	//USERGAMES
	setUserGame(userId: number, userGame: UserGame) {
		this.userGame.set(userId, userGame)
	}

	getUserGame(userId: number) {
		return this.userGame.get(userId)
	}

	getUserGames() {
		return this.userGame
	}

	isFreeGame(userGame: UserGame) {
		return !isDef(userGame.gameId) || !userGame.search
	}

	//Duels
	createDuel(senderId: number, targetId: number) {
		if (senderId === targetId) {
			return false;
		}
		const sender = this.getUserGame(senderId)
		if (!isDef(sender) || isDef(sender.gameId) || sender.search) {
			return false;
		}
		const target = this.getUserGame(targetId)
		if (!isDef(target) || isDef(target.gameId) || target.search) {
			return false;
		}

		//sender has already a pending invitation
		const senderDuel = this.duels.get(senderId)
		if (isDef(senderDuel) && this.isDuelValid(senderDuel)) {
			return false;
		}

		//senderId is already invited by targetId //TODO turn into acceptDuel ?
		const targetDuel = this.duels.get(targetId)
		if (isDef(targetDuel) && targetDuel.targetId === senderId && this.isDuelValid(targetDuel)) {
			return false
		}

		this.duels.set(senderId, { createdAt: dayjs(), targetId: targetId })
		return true;
	}

	acceptDuel(targetId: number, senderId: number) {
		if (targetId === senderId) {
			return false;
		}

		const duel = this.duels.get(senderId)
		if (!isDef(duel) || duel.targetId !== targetId || !this.isDuelValid(duel)) {
			return false;
		}
		const target = this.getUserGame(targetId)
		if (!isDef(target) || !this.isFreeGame(target)) {
			return false;
		}
		const sender = this.getUserGame(senderId)
		if (!isDef(sender) || !this.isFreeGame(sender)) {
			return false;
		}

		this.duels.delete(senderId)
		return true;
	}

	isDuelValid(duel: Duel) {
		const timeoutInvitation = 5
		return dayjs().diff(duel.createdAt, "seconds") < timeoutInvitation
	}
}
