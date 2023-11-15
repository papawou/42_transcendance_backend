import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class WsJwtAuthGuard extends AuthGuard('wsjwt') implements CanActivate {
    constructor() {
        super();
    }

    getRequest(context: ExecutionContext) {
        return context.switchToWs().getClient().handshake;
    }
}
