import { Body, Controller, Post, UnauthorizedException, NotFoundException, Res } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { FtCallbackDTO, LoginDTO } from "./auth.dto";
import { URLSearchParams } from "url";
import prisma from "@/database/prismaClient";
import axios from "axios";
import { isNumber, isString } from "class-validator";
import { Response } from "express";
import { UserService } from "@/user/user.service";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }

    @Post('login')
    async login(@Body() body: LoginDTO) {
        const user = await this.authService.validateUser(body.name);
        if (!isDef(user)) {
            throw new UnauthorizedException();
        }
        return this.authService.login(user);
    }

    @Post('ft/callback')
    async ftCallback(@Body() body: FtCallbackDTO, @Res() response: Response) {
        const code = body.code

        const params = new URLSearchParams()
        params.append('grant_type', 'authorization_code')
        params.append('client_id', process.env.FT_CLIENT_ID!)
        params.append('client_secret', process.env.FT_CLIENT_SECRET!)
        params.append('code', code)
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
        const intraName = get?.login
        const intraPic = get?.image?.link
        const intraId = get?.id

        if (!isString(intraName) || !isString(intraPic) || (!isString(intraId) && !isNumber(intraId))) {
            throw new NotFoundException()
        }

        const findUser = await prisma.user.findUnique({ where: { ft_id: intraId.toString() } });
        if (isDef(findUser)) {
            if (findUser.tfaValid) {
                response.cookie('2fa', this.authService.tfaJwtSign(findUser.id), {
                    httpOnly: true,
                    maxAge: 1000 * 60 * 5,
                });
                response.redirect("/2fa");
                return
            }
            response.status(200).json(this.authService.login(findUser))
            return;
        }
        const createdUser = await this.userService.createUser(intraName, intraId.toString(), intraPic);
        if (!isDef(createdUser))
            throw new NotFoundException();
        response.status(200).json(this.authService.login(createdUser))
    }
}