import { AuthModule } from "@/auth/auth.module";
import { Module, forwardRef } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";
import { UserModule } from "@/user/user.module";

@Module({
  imports: [AuthModule, forwardRef(() => UserModule)],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService]
})
export class GameModule { }
