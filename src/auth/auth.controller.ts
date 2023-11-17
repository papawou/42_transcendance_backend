import { Body, Controller, Post, Get, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { LoginDTO } from "./auth.dto";
import { from, lastValueFrom, map } from "rxjs";
import { Request } from 'express';
import { HttpService } from "@nestjs/axios";
import { URLSearchParams } from "url";
import { ConfigModule } from "@nestjs/config";

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

        const endpoint = "https://api.intra.42.fr/oauth/token?" + params.toString();
        console.log({
            where: 'prepost',
        });
        const resp = await lastValueFrom(this.httpService.post(endpoint).pipe(
            map((resp) => {
                // can read resp.data.access_token here
                return resp.data;
            }),
        ));

        // try to log access_token here
        // then get user info
        // then save user info in db
        // then return user info
        console.log({
            where: 'auth.controller.ts@Post/ft/callback',
            endpoint: endpoint,
            access_token: resp.data.access_token, // keep resp.data.access_token in db
        });

        // if (resp.data.access_token) {
            // const resp2 = await lastValueFrom(this.httpService.get('https://api.intra.42.fr/v2/me',{
            //     headers: { Authorization: `Bearer ${resp.data.access_token}`,},
            // }).pipe(
            //     map((resp) => {
            //         console.log({
            //             where: 'auth.controller.ts@Post/ft/callback',
            //             user: resp.data,
            //         });
            //         return resp.data;
            //     }),
            // ));
        // }
        return resp.data;
    }
}