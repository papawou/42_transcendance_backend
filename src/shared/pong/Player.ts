import { PlayerData } from "./pong"
export class Player {
	userId: number
	score: number
	isReady: boolean

	constructor(userId: number, score: number = 0, isReady: boolean = false) {
		this.userId = userId
		this.score = score
		this.isReady = isReady
	}

	toData(): Required<PlayerData["user"]> {
		return { userId: this.userId, score: this.score, isReady: this.isReady }
	}
}