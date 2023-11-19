
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { isDef } from 'src/technical/isDef';
import { ConfigService } from '@nestjs/config';
import { UserJWTPayload } from '@/shared/shared';
import { jwtValidate } from './utils';

export type UserJWT = {
    userId: number,
    name: string
}

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
        const tmp = jwtValidate(payload);
        if (!isDef(tmp)) {
            throw new UnauthorizedException()
        }
        return tmp
    }
}
