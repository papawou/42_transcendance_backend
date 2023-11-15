import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserJWT } from './jwt.strategy';

export type AuthRequest = Request & { user: UserJWT }

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') { }
