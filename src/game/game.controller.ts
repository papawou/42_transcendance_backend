import { Body, Controller, Delete, ForbiddenException, Get, HttpException, HttpStatus, NotFoundException, Param, ParseIntPipe, Post, Req, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GameService } from './game.service';
import { ApiTags } from '@nestjs/swagger';
import { AuthRequest } from '@/auth/jwt-auth.guard';
import { DuelAcceptDTO, DuelInviteDTO } from './game.dto';
import { GameGateway } from './game.gateway';
import { isDef } from '@/technical/isDef';
import { WsGame } from '@/shared/ws-game';

@ApiTags('games')
@Controller('games')
@UsePipes(new ValidationPipe())
export class GameController {
	constructor(private readonly gameService: GameService, private readonly gameGateway: GameGateway) { }

	@Post("/duel/invite")
	async duelInvite(@Req() req: AuthRequest, @Body() body: DuelInviteDTO) {
		const ret = this.gameService.createDuel(req.user.userId, body.targetId)
		return ret;
	}

	@Post("/duel/accept")
	async duelAccept(@Req() req: AuthRequest, @Body() body: DuelAcceptDTO) {
		const ret = this.gameService.acceptDuel(req.user.userId, body.senderId)
		if (!ret) {
			return false
		}

		const game = this.gameGateway.createGame([req.user.userId, body.senderId]);
		if (!isDef(game)) {
			return false;
		}

		this.gameGateway.emitToUser<WsGame.duelStart>(req.user.userId, WsGame.duelStart, game.gameId)
		this.gameGateway.emitToUser<WsGame.duelStart>(body.senderId, WsGame.duelStart, game.gameId)
		return true;
	}
}
