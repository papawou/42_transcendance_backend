import { WsGameJoinRoom, WsGameRoom, WsGameSendKey, WsGameSetReady } from "@/shared/ws-game";
import { ApiProperty } from "@nestjs/swagger";
import { GameType } from "@prisma/client";
import { IsBoolean, IsNumber, IsString } from "class-validator";

export class WsGameRoomDTO implements WsGameRoom {
    @IsString()
    gameId!: string
}

export class WsGameJoinRoomDTO extends WsGameRoomDTO implements WsGameJoinRoom { }

export class WsGameSendKeyDTO extends WsGameRoomDTO implements WsGameSendKey {
    @IsString()
    key!: string
    @IsBoolean()
    isUp!: boolean
}

export class WsGameSetReadyDTO extends WsGameRoomDTO implements WsGameSetReady { }

export class DuelInviteDTO {
    @IsNumber()
    targetId!: number

    @ApiProperty({ enum: [GameType.CASUAL, GameType.TROLL] })
    type!: "CASUAL" | "TROLL"
}

export class DuelAcceptDTO {
    @IsNumber()
    senderId!: number
}