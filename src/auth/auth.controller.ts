import { Body, Controller, Post, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO, TwoFactorAuthDTO } from "./auth.dto";
import { Request } from 'express';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: LoginDTO, @Req() req: Request) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user)) {
            throw new UnauthorizedException();
        }
        if (user.twoFactorEnabled) {
            req.session.tempUser = user; 
            return { challenge: true };
        }
        return this.authService.login(user);
    }

    @Post('2fa')
    async verifyTwoFactorAuth(@Body() body: TwoFactorAuthDTO, @Req() req: Request) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user) || !user.twoFactorEnabled) {
            throw new UnauthorizedException();
        }
        const isValid = await this.authService.validateTwoFactorAuth(user, body.twoFactorCode);
        if (!isValid) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    // auth/ft/callback
    @Get('ft/callback')
    handleFtCallback() {
      return { msg: 'ft callback' };
    }
}