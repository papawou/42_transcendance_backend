import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { TwoFactorService } from './two-factor.service'; 

@Module({
  imports: [],
  controllers: [UserController],
  providers: [UserService, TwoFactorService],
})
export class UserModule {}  