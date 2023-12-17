import { Body, Controller, Post, Get, Req, UnauthorizedException, UseGuards, NotFoundException, ConsoleLogger } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { DisableTwoFactorDTO, EnableTwoFactorDTO, LoginDTO, ValidateTwoFactorDTO } from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";
import prisma from "@/database/prismaClient";
import axios from "axios";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) { }

    @Post('login')
    async login(@Body() body: LoginDTO) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user)) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    // @Post('2fa/enable')
    // async enableTwoFactor(@Body() enableTwoFactorDTO: EnableTwoFactorDTO) {
    //     return await this.authService.enableTwoFactor(enableTwoFactorDTO);
    // }

    // // POST auth/2fa/validate
    // @Post('2fa/validate')
    // async validateTwoFactor(@Body() validateTwoFactorDTO: ValidateTwoFactorDTO) {
    //     return await this.authService.validateTwoFactor(validateTwoFactorDTO);
    // }

    // // POST auth/2fa/disable
    // @Post('2fa/disable')
    // async disableTwoFactor(@Body() disableTwoFactorDTO: DisableTwoFactorDTO) {
    //     return await this.authService.disableTwoFactor(disableTwoFactorDTO);
    // }

    // POST auth/ft/callback
    @Post('ft/callback')
    async ftCallback(@Req() req: Request) {
        if (!isDef(req.body.code)) {
            throw new NotFoundException();
        }

        const params = new URLSearchParams()
        params.append('grant_type', 'authorization_code')
        params.append('client_id', process.env.FT_CLIENT_ID!)
        params.append('client_secret', process.env.FT_CLIENT_SECRET!)
        params.append('code', req.body.code)
        params.append('redirect_uri', process.env.FT_REDIRECT_URI!)

        const post = await axios
            .post("https://api.intra.42.fr/oauth/token", params)
            .then((resp) => resp.data)
            .catch((err) => {
                throw new NotFoundException()
            });

        if (!isDef(post)) {
            throw new NotFoundException()
        }

        const get = await axios
            .get('https://api.intra.42.fr/v2/me', {
                headers: { 'Authorization': `Bearer ${post.access_token}` }
            })
            .then((resp) => resp.data)
            .catch((err) => {
                throw new NotFoundException()
            });

        const findUser = await prisma.user.findUnique({ where: { name: get.login } });
        if (isDef(findUser)) {
            // MATT : TFA HERE
            // if (hasEnabledTFA(get.login)) {
            // then send email with tfa code
            // then return tfa code
            // }
            // if ( findUser && !findUser.twoFactorEnabled) {
            //     const secretKey = speakeasy.generateSecret({ length: 20 }).base32;

            //     const otpAuthUrl = speakeasy.otpauthURL({
            //         secret: secretKey,
            //         label: 'Transcendence',
            //         issuer: 'Transcendence',
            //     });
            //     const qrCodeImage = await qrcode.toDataURL(otpAuthUrl);
            //     console.log(">>> user already in db");
            //     await prisma.user.update({ // prevent duplicate
            //         where: { name: get.login },
            //         data: { 
            //             ft_id: '' + get.id,
            //             pic: get.image.link,
            //             twoFactorEnabled: true,
            //             secretKey: secretKey,
            //     }, });
            //     return { qrCodeImage };
            return await this.authService.login(findUser); // return jwt
        }

        const createUser = await prisma.user.create({
            data: {
                name: get.login,
                ft_id: '' + get.id,
                pic: get.image.link,
            },
        });
        if (!isDef(createUser))
            throw new NotFoundException();

        return await this.authService.login(createUser);
    }
}