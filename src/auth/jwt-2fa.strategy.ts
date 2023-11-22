import { Strategy, ExtractJwt } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { ConfigService } from '@nestjs/config';
import { UserJWTPayload } from '@/shared/shared';
import { jwtValidate } from './utils';
import { UserJWT } from './jwt.strategy';
import { isDef } from 'src/technical/isDef';

@Injectable()
export class JwtTwoFactAuthStrategy extends PassportStrategy(Strategy, 'jwt-2fa') {
  constructor(private readonly userService: UserService,
    private configService: ConfigService) {
    super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: configService.get<string>("JWT_SECRET"),
    });
  }

  async validate(payload: UserJWTPayload | undefined): Promise<UserJWT | undefined> {
    const tmp = jwtValidate(payload);
    if (!isDef(tmp)) {
        throw new UnauthorizedException()
    }
    return tmp
  }
}

