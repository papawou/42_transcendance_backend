
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isDef } from 'src/technical/isDef';
import { ConfigService } from '@nestjs/config';
import { UserJWTPayload } from '@/shared/shared';

export type UserJWT = {
    userId: number,
    name: string
}

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

    async validate(payload: UserJWTPayload | undefined): Promise<UserJWT> {
        if (!isDef(payload)) {
            throw new UnauthorizedException()
        }
        return { userId: payload.sub, name: payload.name };
    }
}
