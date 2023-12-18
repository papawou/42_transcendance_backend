import { Module, forwardRef } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserGateway } from './user.gateway';
import { AuthModule } from '@/auth/auth.module';
import { GameModule } from '@/game/game.module';
@Module({
  imports: [forwardRef(() => AuthModule), forwardRef(() => GameModule)],
  controllers: [UserController],
  providers: [UserService, UserGateway],
  exports: [UserService]
})
export class UserModule { }
