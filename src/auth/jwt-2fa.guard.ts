import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserJWT } from './jwt.strategy';

export type AuthRequest = Request & { user: UserJWT }
// Calls the strategy jwt-2fa.
@Injectable()
export class JwtTwoFactAuthGuard extends AuthGuard('jwt-2fa') {}