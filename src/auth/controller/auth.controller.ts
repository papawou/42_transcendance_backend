/*import { Controller, Get, UseGuards, Req, Post, Body } from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { TwoFactorService } from '../../user/two-factor.service';
import { AuthGuard } from "@nestjs/passport";
import { Public } from '@prisma/client/runtime/library';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService
  ) { }

  // @Public()
  // @Get('auth/ft/callback')
  // @UseGuards(FtOauthGuard)
  // async ftAuthCallback(@Req() req: any, @Res() res: Response): Promise<void> {
  //   await this.authService.ftAuthCallback(req, res);
  // }

  @Get('auth/ft/callback')
  @UseGuards(AuthGuard('ft'))
  ftAuthRedirect(@Req() req: Request) {
    return this.authService.ftLogin(req);
  }

    // Endpoint to enable 2FA
    @Post('auth/2fa/enable')
    @UseGuards(AuthGuard('ft'))
    async enable2FA(@Req() req: Request) {
      // Call TwoFactorService to enable 2FA for the authenticated user
      const userId = req.user.id;
      const secret = await this.twoFactorService.enableTwoFactor(userId);
      return { secret };
    }

      // Endpoint to verify 2FA
    @Post('auth/2fa/verify')
    @UseGuards(AuthGuard('ft'))
    async verify2FA(@Req() req: Request, @Body() data: { token: string }) {
      // Call TwoFactorService to verify the 2FA code for the authenticated user
      const userId = req.user.id;
      const isVerified = await this.twoFactorService.verifyTwoFactor(userId, data.token);
    
      if (isVerified) {
       return { message: '2FA verified and user is authenticated' };
      } else {
        return { message: '2FA verification failed' };
      }
    }

    @Get('auth/2fa/generate-qr-code')
    @UseGuards(AuthGuard('ft'))
    async generateQRCodeFor2FA(@Req() req: Request) {
      // Call TwoFactorService to generate the QR code for the authenticated user
      const userId = req.user.id;
      const qrCodeUrl = await this.twoFactorService.generateQRCodeUrlForUser(userId);
  
      return { qrCodeUrl };
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
  async ftAuth(@Req() req: Request) {
  }
}
*/