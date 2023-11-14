
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { isDef } from 'src/technical/isDef';
import { ConfigService } from '@nestjs/config';
import { UserJWTPayload } from '@/shared/shared';
import { WsException } from '@nestjs/websockets';

export type UserJWT = {
    userId: number,
    name: string
}

const wsExtractor = (request: any): string | null => {
    return request?.auth?.token ?? null;
};

@Injectable()
export class WsJwtStrategy extends PassportStrategy(Strategy, 'wsjwt') {
    constructor(private configService: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromExtractors([wsExtractor]),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>("JWT_SECRET"),
        });
    }

    async validate(payload: UserJWTPayload | undefined): Promise<UserJWT> {
        console.log("validate")
        if (!isDef(payload)) {
            throw new WsException("unauthorized")
        }
        return { userId: payload.sub, name: payload.name };
    }
}
