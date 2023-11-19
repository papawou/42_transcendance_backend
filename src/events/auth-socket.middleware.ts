import { UserJWT } from '@/auth/jwt.strategy';
import { jwtValidate } from '@/auth/utils';
import { UserJWTPayload } from '@/shared/shared';
import { isDef } from '@/technical/isDef';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

export type AuthSocket = Socket & { user: UserJWT }

export type SocketMiddleware = (socket: Socket, next: (err?: Error) => void) => void

export const WSAuthMiddleware = (jwtService: JwtService, configService: ConfigService): SocketMiddleware => {
    return (socket: any, next) => {
        try {
            const jwtPayload = jwtService.verify(socket.handshake.auth.token ?? "") as UserJWTPayload
            const payload = jwtValidate(jwtPayload);
            if (!isDef(payload)) {
                throw new WsException("unauth");
            }
            socket.user = payload;
            next();
        }
        catch (error) {
            next({ name: 'UNAUTHORIZED', message: 'UNAUTHORIZED' });
        }
    }
}