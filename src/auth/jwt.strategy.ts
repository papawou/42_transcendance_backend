
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { isDef } from 'src/technical/isDef';
import { ConfigService } from '@nestjs/config';
import { UserJWTPayload } from '@/shared/shared';

export type UserJWT = {
    userId: number,
    name: string
} | null

export type AuthRequest = Request & { user: UserJWT }

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET"),
        });
    }

    //client -> jwtStrategy -> validate (reformat jwt payload) -> @UseGuard
    async validate(payload: UserJWTPayload): Promise<UserJWT> {
        if (!isDef(payload)) {
            return null;
        }
        return { userId: payload.sub, name: payload.name };
    }
}
