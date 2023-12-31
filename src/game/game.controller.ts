import { Body, Controller, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthRequest, JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { DuelAcceptDTO, DuelInviteDTO } from './game.dto';
import { GameGateway } from './game.gateway';
import { isDef } from '@/technical/isDef';
import { WsGame } from '@/shared/ws-game';

@ApiTags('games')
@Controller('games')
@UsePipes(new ValidationPipe())
export class GameController {
	constructor(private readonly gameService: GameService, private readonly gameGateway: GameGateway) { }

	@UseGuards(JwtAuthGuard)
	@Post("/duel/invite")
	async duelInvite(@Req() req: AuthRequest, @Body() body: DuelInviteDTO) {
		const senderId = req.user.userId
		const targetId = body.targetId
		const duel = this.gameService.createDuel(senderId, targetId, body.type)
		if (!isDef(duel)) {
			return false;
		}
		this.gameGateway.emitToUser<WsGame.duelInvite>(targetId, WsGame.duelInvite, { senderId, createdAt: duel.createdAt.toISOString(), type: duel.type })
		return true;
	}

	@UseGuards(JwtAuthGuard)
	@Post("/duel/accept")
	async duelAccept(@Req() req: AuthRequest, @Body() body: DuelAcceptDTO) {
		const targetId = req.user.userId
		const senderId = body.senderId
		const duel = this.gameService.acceptDuel(targetId, senderId)

		if (!isDef(duel)) {
			return false
		}

		const game = this.gameGateway.createGame([req.user.userId, body.senderId], duel.type);
		if (!isDef(game)) {
			return false;
		}

		this.gameGateway.emitToUser<WsGame.duelStart>(targetId, WsGame.duelStart, game.gameId)
		this.gameGateway.emitToUser<WsGame.duelStart>(senderId, WsGame.duelStart, game.gameId)
		return true;
	}

	@UseGuards(JwtAuthGuard)
	@Post("/search/start")
	async search(@Req() req: AuthRequest) {
		const viewerId = req.user.userId

		const user = this.gameService.getUserGame(viewerId)
		if (!isDef(user) || isDef(user.gameId)) {
			return false;
		}
		this.gameGateway.setUserGame(viewerId, { search: true })
		return true;
	}

	@UseGuards(JwtAuthGuard)
	@Post("/search/cancel")
	async searchCancel(@Req() req: AuthRequest) {
		const viewerId = req.user.userId

		const user = this.gameService.getUserGame(viewerId)
		if (!isDef(user) || isDef(user.gameId) || !isDef(user.search)) {
			return false;
		}
		this.gameGateway.setUserGame(viewerId, { search: false })
		return true;
	}
}
