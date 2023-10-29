import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { AuthService } from '../service/auth.service';

import { AuthGuard } from "@nestjs/passport";
import { Public } from '@prisma/client/runtime/library';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  // @Public()
  // @Get('auth/ft/callback')
  // @UseGuards(FtOauthGuard)
  // async ftAuthCallback(@Req() req: any, @Res() res: Response): Promise<void> {
  //   await this.authService.ftAuthCallback(req, res);
  // }

  @Get('auth/ft/callback')
  @UseGuards(AuthGuard('ft'))
  ftAuthRedirect(@Req() req) {
    return this.authService.ftLogin(req);
  }

  // @Patch('logout')
  // async logout(@Req() req: any, @Res() res: Response): Promise<void> {
  //   await this.authService.logout(req.user.ftLogin, res);
  //   res.status(HttpStatus.OK).send();
  // }

  // @Public()
  // @Get('guest')
  // async guestAuth(@Res() res: Response): Promise<void> {
  //   await this.authService.guestAuth(res);
  // }

  @Get()
  @UseGuards(AuthGuard('ft'))
  async ftAuth(@Req() req) {
  }
}