import prisma from "@/database/prismaClient";
import { GameEngineServer } from "@/pong/GameEngineServer";
import { PhysicsServer } from "@/pong/PhysicsServer";
import Scene from "@/shared/pong/Scene";
import { GameEngineData } from "@/shared/pong/pong";
import { UserGame } from "@/shared/shared";
import { isDef } from "@/technical/isDef";
import { UserWithStatusDTO } from "@/user/user.dto";
import { UserService } from "@/user/user.service";
import { Injectable } from "@nestjs/common";
import { GameType } from "@prisma/client";
import { randomUUID } from "crypto";
import dayjs from "dayjs";

type Duel = { createdAt: dayjs.Dayjs, targetId: number, type: "TROLL" | "CASUAL" }

@Injectable()
export class GameService {
	games: Map<string, GameEngineServer> = new Map()
	userGame: Map<number, UserGame> = new Map()
	duels: Map<number, Duel> = new Map()

	constructor(private readonly userService: UserService) { }

	async addHistoryMatch(game: GameEngineData) {
		const players = game.players.map(p => p.user).filter(isDef).map(p => ({ userId: p.userId, score: p.score }))
		const winner = players.reduce((prev, curr) => curr.score > prev.score ? curr : prev)
		const loser = players.reduce((prev, curr) => curr.score < prev.score ? curr : prev)

		const userW = await this.userService.getUser(winner.userId)
		const userL = await this.userService.getUser(loser.userId)

		if (!isDef(userW) || !isDef(userL)) {
			return
		}

		await prisma.game.create({
			data: {
				id: game.gameId,
				type: game.type,
				winnerScore: winner.score,
				winnerId: winner.userId,
				loserScore: loser.score,
				loserId: loser.userId,
				createdAt: dayjs().toISOString()
			}
		})
		
		if (game.type !== "RANKED") {
			return;
		}

		await prisma.user.update({
			where: { id: winner.userId },
			data: { elo: this.getNewRating(userW.elo, userL.elo, true) }
		})
		await prisma.user.update({
			where: { id: loser.userId },
			data: { elo: this.getNewRating(userL.elo, userW.elo, false) }
		})
	}

	//GAMES
	createGame(users: number[], type: GameType) {
		const id = randomUUID()
		const game = new GameEngineServer(id, 500, 500, type, new Scene(), new PhysicsServer())

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
	createDuel(senderId: number, targetId: number, duelType: Duel["type"]): Duel | undefined {
		if (senderId === targetId) {
			return undefined;
		}
		const sender = this.getUserGame(senderId)
		if (!isDef(sender) || isDef(sender.gameId) || sender.search) {
			return undefined;
		}
		const target = this.getUserGame(targetId)
		if (!isDef(target) || isDef(target.gameId) || target.search) {
			return undefined;
		}

		const senderDuel = this.duels.get(senderId)
		if (isDef(senderDuel) && this.isDuelValid(senderDuel)) {
			return undefined;
		}

		const targetDuel = this.duels.get(targetId)
		if (isDef(targetDuel) && targetDuel.targetId === senderId && this.isDuelValid(targetDuel)) {
			return undefined
		}
		const duel = { createdAt: dayjs(), targetId: targetId, type: duelType }
		this.duels.set(senderId, duel)
		return duel;
	}

	acceptDuel(targetId: number, senderId: number) {
		if (targetId === senderId) {
			return undefined;
		}

		const duel = this.duels.get(senderId)
		if (!isDef(duel) || duel.targetId !== targetId || !this.isDuelValid(duel)) {
			return undefined;
		}
		const target = this.getUserGame(targetId)
		if (!isDef(target) || !this.isFreeGame(target)) {
			return undefined;
		}
		const sender = this.getUserGame(senderId)
		if (!isDef(sender) || !this.isFreeGame(sender)) {
			return undefined;
		}

		this.duels.delete(senderId)
		return duel;
	}

	isDuelValid(duel: Duel) {
		const timeoutInvitation = 60
		return dayjs().diff(duel.createdAt, "seconds") < timeoutInvitation
	}

	getNewRating(viewerRating: number, opponentRating: number, isWin: boolean, kFactor: number = 30): number {
		const actualScore = isWin ? 1 : 0
		const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - viewerRating) / 400));
		return viewerRating + kFactor * (actualScore - expectedScore);
	}

	getUserStatus(userId: number): UserWithStatusDTO["status"] {
		const userGame = this.getUserGame(userId);

		if (!isDef(userGame)) {
			return "OFFLINE"
		}
		if (isDef(userGame.gameId)) {
			return "INGAME"
		}
		if (isDef(userGame.search)) {
			return "SEARCH"
		}
		return "ONLINE"
	}
}
