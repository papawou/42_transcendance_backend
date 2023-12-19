import { Body, Controller, Post, UnauthorizedException, NotFoundException, Res, UseGuards, Req } from "@nestjs/common";
import { isDef } from "src/technical/isDef";
import { AuthService } from "./auth.service";
import { AccessTokenDTO, FtCallbackDTO, TfaDTO, TfaRedirectDTO } from "./auth.dto";
import { URLSearchParams } from "url";
import prisma from "@/database/prismaClient";
import axios from "axios";
import { isNumber, isString } from "class-validator";
import { UserService } from "@/user/user.service";
import { AuthRequest, JwtAuthGuard } from "./jwt-auth.guard";

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService, private userService: UserService) { }

    @Post('ft/callback')
    async ftCallback(@Body() body: FtCallbackDTO): Promise<AccessTokenDTO | TfaRedirectDTO> {
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
                return { userId: findUser.id }
            }
            return this.authService.login(findUser)
        }

        const createdUser = await this.userService.createUser(intraName, intraId.toString(), intraPic);
        if (!isDef(createdUser))
            throw new NotFoundException();
        return this.authService.login(createdUser)
    }

    ///2fa
    @UseGuards(JwtAuthGuard)
    @Post('tfa/enable')
    async enable(@Req() req: AuthRequest): Promise<string> {
        const qrCodeImage = await this.authService.tfaEnable(req.user.userId);
        if (!isDef(qrCodeImage)) {
            throw new NotFoundException()
        }
        return qrCodeImage
    }

    @UseGuards(JwtAuthGuard)
    @Post('tfa/activate')
    async activate(@Req() req: AuthRequest, @Body() body: TfaDTO): Promise<true> {
        const success = await this.authService.tfaActivate(req.user.userId, body.otp)
        if (!isDef(success) || !success) {
            throw new NotFoundException()
        }
        return success
    }

    @UseGuards(JwtAuthGuard)
    @Post('tfa/disable')
    async disable(@Req() req: AuthRequest): Promise<true> {
        const success = await this.authService.tfaDisable(req.user.userId);
        if (!isDef(success) || !success) {
            throw new NotFoundException()
        }
        return success;
    }

    @Post('tfa/verify')
    async verify(@Body() body: TfaDTO): Promise<AccessTokenDTO> {

        const user = await this.authService.tfaVerify(body.userId, body.otp);
        if (!isDef(user)) {
            throw new NotFoundException()
        }
        return this.authService.login(user);
    }

    @UseGuards(JwtAuthGuard)
    @Post('tfa/isActive')
    async isEnable(@Req() req: AuthRequest): Promise<boolean> {
        const isTfa = await this.authService.hasTfa(req.user.userId)
        if (!isDef(isTfa)) {
            throw new NotFoundException();
        }
        return isTfa;
    }
}