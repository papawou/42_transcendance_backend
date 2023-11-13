import { Module } from '@nestjs/common';
import { AuthController } from './controller/auth.controller';
import { AuthService } from './service/auth.service';
import { PassportModule } from '@nestjs/passport';
import { TwoFactorService } from '../user/two-factor.service';
// import { JwtModule } from '@nestjs/jwt';
import { FtStrategy } from './strategies/ft.strategy';
// import { JwtStrategy } from './strategies/jwt.strategy';
import { UserModule } from '../user/user.module';
// import { AvatarModule } from '../avatar/avatar.module';
// import { TFAStrategy } from './strategies/tfa.strategy';

@Module({
  imports: [UserModule, PassportModule],
  providers: [TwoFactorService, AuthService],
  controllers: [AuthController],
  exports: [AuthService]
})
export class AuthModule {}
