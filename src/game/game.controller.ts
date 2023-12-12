import { Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
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
		const ret = this.gameService.createDuel(senderId, targetId)
		if (ret) {
			this.gameGateway.emitToUser<WsGame.duelInvite>(targetId, WsGame.duelInvite, senderId)
		}
		return ret;
	}

	@UseGuards(JwtAuthGuard)
	@Post("/duel/accept")
	async duelAccept(@Req() req: AuthRequest, @Body() body: DuelAcceptDTO) {
		const targetId = req.user.userId
		const senderId = body.senderId
		const ret = this.gameService.acceptDuel(targetId, senderId)
		if (!ret) {
			return false
		}

		const game = this.gameGateway.createGame([req.user.userId, body.senderId]);
		if (!isDef(game)) {
			return false;
		}

		this.gameGateway.emitToUser<WsGame.duelStart>(targetId, WsGame.duelStart, game.gameId)
		this.gameGateway.emitToUser<WsGame.duelStart>(senderId, WsGame.duelStart, game.gameId)
		return true;
	}
}
