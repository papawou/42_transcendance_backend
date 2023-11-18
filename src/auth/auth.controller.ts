import { Body, Controller, Post, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO, TwoFactorAuthDTO } from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";
import prisma from "@/database/prismaClient";
import speakeasy from "speakeasy";
import QRCode from "qrcode";
import { JwtTwoFactAuthGuard } from './jwt-2fa.guard';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService, 
        private httpService: HttpService) { }

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

    @UseGuards(JwtTwoFactAuthGuard)
    @Post('enable-2fa')
    async enableTwoFactorAuth(@Req() req: Request): Promise<any> {
      const user = await this.authService.validateUser(req.body.name);
  
      if (!isDef(user)) {
        return { message: 'User not found or unauthorized' };
      }
  
      const secret = await this.authService.enableTwoFactorAuth(user);
      return { secret };
    }
    
    @UseGuards(JwtTwoFactAuthGuard)
    @Post('disable-2fa')
    async disableTwoFactorAuth(@Req() req: Request): Promise<any> {
      const user  = await this.authService.validateUser(req.body.name);
  
      if (!isDef(user)) {
        return { message: 'User not found or unauthorized' };
      }
  
      const result = await this.authService.disableTwoFactorAuth(user);
      return { message: result };
    }

    @Post('2fa')
    async verifyTwoFactorAuth(@Body() body: TwoFactorAuthDTO, @Req() req: Request) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user) || !user.twoFactorEnabled) {
            throw new UnauthorizedException();
        }
        const isValid = await this.authService.validateTwoFactorCode(user, body.twoFactorCode);
        if (!isValid) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    // GET auth/ft/callback
    @Get('ft/callback')
    async handleFtCallback() {
      return { msg: 'ft callback' };
    }

    // POST auth/ft/callback
    @Post('ft/callback')
    async ftCallback(@Req() req: Request) {
        const params = new URLSearchParams([
            ['grant_type', 'authorization_code'],
            ['client_id', process.env.FT_CLIENT_ID],
            ['client_secret', process.env.FT_CLIENT_SECRET],
            ['code', req.body.code],
            ['redirect_uri', process.env.FT_REDIRECT_URI],
        ]);

        // Exchange your code for an access token
        const endpoint_post = "https://api.intra.42.fr/oauth/token?" + params.toString();
        const post = await lastValueFrom(this.httpService.post(endpoint_post).pipe(
            map((resp) => {
                return resp.data;
            }),
        ));

        // Make API requests with your token
        const get = await lastValueFrom(this.httpService.get('https://api.intra.42.fr/v2/me',{
            headers: { Authorization: `Bearer ${post.access_token}`,},
        }).pipe(
            map((resp) => {
                if (post.access_token) return resp.data;
            }),
        ));

        // Save user in db
        // || Check user in db + if tfa is enabled
        const findUser = await prisma.user.findUnique({ where: { name: get.login } });
        if ( findUser ) {
            console.log(">>> user already in db");
            await prisma.user.update({ // prevent duplicate
                where: { name: get.login },
                data: { 
                    ft_id: '' + get.id,
                    pic: get.image.link,
            }, });
            if (findUser.twoFactorEnabled) {
                // Generate 2FA token
                const token = speakeasy.totp({
                    secret: findUser.twoFactorSecret!,
                    encoding: 'base32',
                });

                // Generate QR Code URL for 2FA
                const otpauthURL = speakeasy.otpauthURL({
                    secret: findUser.twoFactorSecret!,
                    label: `${findUser.name}@transcendence`,
                    issuer: 'transcendence',
                });
                const qrCodeUrl = await QRCode.toDataURL(otpauthURL);
                // Return necessary data or response
                return { qrCodeUrl, token };
            }
        } else {
            console.log(">>> user not in db");
            await prisma.user.create({ // save user info in db
                data: { 
                    name: get.login,
                    ft_id: '' + get.id,
                    pic: get.image.link,
             }, });
        }
        // kenneth : TODO what about access_token and refresh_token and cookie?
        return get;
    }
}