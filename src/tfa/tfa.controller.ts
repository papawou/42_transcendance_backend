import { Body, Controller, Post, Req, UseGuards, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard, AuthRequest } from '../auth/jwt-auth.guard';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { isDef } from '@/technical/isDef';
import { TfaService } from './tfa.service';
import { TfaDTO } from './tfa.dto';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('2FA')
@Controller('2fa')
export class TfaController {
  constructor(private tfaService: TfaService) { }

  @UseGuards(JwtAuthGuard)
  @Post('enable')
  async enable(@Req() req: AuthRequest) {
    const qrCodeImage = await this.tfaService.enable(req.user.userId);
    if (!isDef(qrCodeImage)) {
      throw new NotFoundException()
    }
    return qrCodeImage
  }

  @UseGuards(JwtAuthGuard)
  @Post('activate')
  async activate(@Req() req: AuthRequest, @Body() body: TfaDTO) {
    const success = this.tfaService.activate(req.user.userId, body.otp)
    if (!isDef(success) || !success) {
      return new NotFoundException()
    }
    return success
  }

  @UseGuards(JwtAuthGuard)
  @Post('disable')
  async disable(@Req() req: AuthRequest) {
    const success = await this.tfaService.disable(req.user.userId);
    if (!isDef(success) || !success) {
      throw new NotFoundException()
    }
    return success;
  }

  @UseGuards(JwtAuthGuard)
  @Post('verify')
  async verify(@Req() req: AuthRequest, @Body() body: TfaDTO) {
    const success = await this.tfaService.verify(req.user.userId, body.otp);
    if (!isDef(success) || !success) {
      throw new NotFoundException()
    }
    return success;
  }

  @UseGuards(JwtAuthGuard)
  @Post('isEnable')
  async isEnable(@Req() req: AuthRequest) {
    const isTfa = await this.tfaService.hasTfa(req.user.userId)
    if (!isDef(isTfa)) {
      throw new NotFoundException();
    }
    return isTfa;
  }
}