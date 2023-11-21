import { Body, Controller, Post, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";
import prisma from "@/database/prismaClient";

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
        if(!isDef(req.body.code))
            throw new UnauthorizedException(">>> no code in body");
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
        if ( isDef(findUser) ) {
            console.log(">>> user already in db");
            // MATT : TFA HERE
            // if (hasEnabledTFA(get.login)) {
            // then send email with tfa code
            // then return tfa code
            // }
            return this.authService.login(findUser); // return jwt
        } 
        console.log(">>> user not in db");
        const createUser = await prisma.user.create({ // save user info in db
            data: { 
                name: get.login, // ex. krioja
                ft_id: '' + get.id, // ex. 123456
                pic: get.image.link, // ex. https://cdn.intra.42.fr/users/krioja.jpg
            },
        });
        if (!isDef(createUser)) 
            throw new UnauthorizedException(">>> error while creating user in db");
        return this.authService.login(createUser); // return jwt
        // kenneth : TODO what about access_token and refresh_token and cookie?

        // return get;
    }
}