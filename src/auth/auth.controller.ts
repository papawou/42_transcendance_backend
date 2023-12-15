import { Body, Controller, Post, Get, Req, Put, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO, EnableTwoFactorDTO, ValidateTwoFactorDTO, DisableTwoFactorDTO} from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";
import prisma from "@/database/prismaClient";
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';

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
    
    @Post('2fa/enable')
    async enableTwoFactor(@Body() enableTwoFactorDTO: EnableTwoFactorDTO) {
        return await this.authService.enableTwoFactor(enableTwoFactorDTO);
    }

    // POST auth/2fa/validate
    @Post('2fa/validate')
    async validateTwoFactor(@Body() validateTwoFactorDTO: ValidateTwoFactorDTO) {
        return await this.authService.validateTwoFactor(validateTwoFactorDTO);
    }

    // POST auth/2fa/disable
    @Post('2fa/disable')
    async disableTwoFactor(@Body() disableTwoFactorDTO: DisableTwoFactorDTO) {
        return await this.authService.disableTwoFactor(disableTwoFactorDTO);
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
        if ( findUser && !findUser.twoFactorEnabled) {
            const secretKey = speakeasy.generateSecret({ length: 20 }).base32;

            const otpAuthUrl = speakeasy.otpauthURL({
                secret: secretKey,
                label: findUser.name,
                issuer: process.env.FT_CLIENT_ID,
            });
            const qrCodeImage = await qrcode.toDataURL(otpAuthUrl);
            console.log(">>> user already in db");
            await prisma.user.update({ // prevent duplicate
                where: { name: get.login },
                data: { 
                    ft_id: '' + get.id,
                    pic: get.image.link,
                    twoFactorEnabled: true,
                    secretKey: secretKey,
                    qrCodeImage: qrCodeImage,
            }, });
            return { qrCodeImage };
        } else {
            console.log(">>> user not in db");
            await prisma.user.create({ // save user info in db
                data: { 
                    name: get.login,
                    ft_id: '' + get.id,
                    pic: get.image.link,
                    twoFactorEnabled: false,
                    secretKey: null,
             }, });
        }
        // kenneth : TODO what about access_token and refresh_token and cookie?
        return get;
    }
}