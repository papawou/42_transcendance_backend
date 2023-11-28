import { Body, Controller, Post, Get, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";
import prisma from "@/database/prismaClient";
import { JwtTwoFactorAuthGuard } from './jwt-2fa.guard';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Writable } from 'stream';
import { TwoFactorAuthDTO } from './auth.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService, 
        private httpService: HttpService) { }

    @Post('login')
    async login(@Body() body: LoginDTO) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user)) {
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
            // MATT : TFA HERE
            // if (hasEnabledTFA(get.login)) {
            // then send email with tfa code
            // then return tfa code
            // }
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

    @UseGuards(JwtTwoFactorAuthGuard)
    @Get('2fa/generate')
    async generate(@Req() req: Request, @Res() res: Writable) {
      //  Generate a new token // To change so it can verify if the setup is ok
      const user: any = req.user;
      //  Generate the secret for the user and the qrCode
      const otpauthUrl = await this.authService.generateTwoFactAuthSecret(user);
      const qrCode = await this.authService.pipeQrCodeStream(res, otpauthUrl);
      return qrCode;
    }

    @Post('2fa/enable')
    @UseGuards(JwtTwoFactorAuthGuard)
    async enable2FA(@Req() req: Request) {
      const user: any = req.user;
      const secret = await this.authService.turnOnTfa(user);
      return { secret };
    }

    
    // Qr code auth verification
    @UseGuards(JwtTwoFactorAuthGuard)
    @Post('2fa/validate')
    async verifyTwoFactAuth(
      @Req() req: Request, 
      @Body() body: TwoFactorAuthDTO,
      @Res({ passthrough: true }) res: Response
      ) {
      const user: any = req.user;
      const isCodeValid = await this.authService.verifyTwoFactAuth(body.code, user);

      if (!isCodeValid) {
        if (user.twoFactorAuth === false) {
          return {valid: false};
        }
        throw new UnauthorizedException('Wrong authentication code');
      }
      
      if (user.twoFactorAuth == false) {
        await this.authService.turnOnTfa(user);
      }

      //  Create and store jwt token to enable connection
      const accessToken = await this.authService.generateToken({
        sub: user.id,
        isTwoFactorAuth: true,
      });
    }
}