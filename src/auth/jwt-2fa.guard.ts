import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Calls the strategy jwt-2fa.
@Injectable()
export class JwtTwoFactAuthGuard extends AuthGuard('jwt-2fa') {}