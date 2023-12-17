import { AuthModule } from "@/auth/auth.module";
import { Module } from "@nestjs/common";
import { GameController } from "./game.controller";
import { GameService } from "./game.service";
import { GameGateway } from "./game.gateway";

@Module({
  imports: [AuthModule],
  controllers: [GameController],
  providers: [GameService, GameGateway],
  exports: [GameService]
})
export class GameModule {}
