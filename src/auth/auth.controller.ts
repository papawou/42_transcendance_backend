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
import axios from "axios";
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
    
    @Put('2fa/enable')
    async enableTwoFactor(@Body() enableTwoFactorDTO: EnableTwoFactorDTO) {
        return await this.authService.enableTwoFactor(enableTwoFactorDTO);
    }

    // POST auth/2fa/validate
    @Post('2fa/validate')
    async validateTwoFactor(@Body() validateTwoFactorDTO: ValidateTwoFactorDTO) {
        return await this.authService.validateTwoFactor(validateTwoFactorDTO);
    }

    // POST auth/ft/callback
    @Post('ft/callback')
    async ftCallback(@Req() req: Request) {
        console.log("@post auth/ft/callback");
        if(!isDef(req.body.code)) {
            console.log(">>> no code in body");
            throw new UnauthorizedException(">>> no code in body");
        }
        const params = new URLSearchParams([
            ['grant_type', 'authorization_code'],
            ['client_id', process.env.FT_CLIENT_ID],
            ['client_secret', process.env.FT_CLIENT_SECRET],
            ['code', req.body.code],
            ['redirect_uri', process.env.FT_REDIRECT_URI],
        ]);

        // Exchange your code for an access token
        const endpoint_post = "https://api.intra.42.fr/oauth/token?" + params.toString();
        const post = await axios
            .post(endpoint_post)
            .then((resp) => {
                return resp.data;
            })
            .catch((err) => {
                console.log({
                    where: "auth.controller.ts@post.catch",
                    status: err.response.status,
                    statusText: err.response.statusText,
                    data: err.response.data,
                });
            });
        if (!isDef(post)) {
            console.log({
                where: "auth.controller.ts > if (!isDef(post))",
                status: "STRANGE BEHAVIOR",
                what: ">>> no access_token in post",
                warning: "This error message can be triggered by the first useEffect hook run which has no repercussion whatsoever for the second run, see AuthFtCallback.tsx l.15"
            });
            return ;
        }

        // Make API requests with your token
        const get = await axios
            .get('https://api.intra.42.fr/v2/me', {
                headers: { 'Authorization': `Bearer ${post.access_token}` }
            })
            .then((resp) => {
                if (isDef(post.access_token)) return resp.data;
            })
            .catch((err) => {
                console.log({
                    where: "auth.controller.ts@get.catch",
                    status: err.response.status,
                    statusText: err.response.statusText,
                    data: err.response.data,
                });
            });
        
        // Save user in db
        // || Check user in db + if tfa is enabled
        const findUser = await prisma.user.findUnique({ where: { name: get.login } });
        if ( isDef(findUser) ) {
            console.log(">>> user already in db");
            // MATT : TFA HERE
            // if (hasEnabledTFA(get.login)) {
            // then send email with tfa code
            // then return tfa code
            // }
            // if (!findUser.twoFactorEnabled) {
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
            // } else {
            //     console.log(">>> user not in db");
            //     await prisma.user.create({ // save user info in db
            //         data: { 
            //             name: get.login,
            //             ft_id: '' + get.id,
            //             pic: get.image.link,
            //      }, });
            return this.authService.login(findUser); // return jwt
        }
        console.log(">>> user not in db");
        const createUser = await prisma.user.create({ // save user info in db
            data: {
                name: get.login, // ex. krioja
                ft_id: '' + get.id, // ex. 123456
                pic: get.image.link, // ex. https://cdn.intra.42.fr/users/krioja.jpg
//             twoFactorEnabled: false,
//             secretKey: null,
            },
        });
        if (!isDef(createUser))
            throw new UnauthorizedException(">>> error while creating user in db");
        return this.authService.login(createUser); // return jwt
    }
}