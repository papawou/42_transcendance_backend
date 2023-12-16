import { WsGame, WsGameDebug, WsGameJoinRoom, WsGameLeaveRoom, WsGameRoom, WsGameSendKey, WsGameSetReady } from "@/shared/ws-game";
import { IsBoolean, IsNumber, IsString, isString } from "class-validator";

class WsGameRoomDTO implements WsGameRoom {
    @IsString()
    gameId!: string
}

class WsGameJoinRoomDTO extends WsGameRoomDTO implements WsGameJoinRoom { }

class WsGameLeaveRoomDTO extends WsGameRoomDTO implements WsGameLeaveRoom { }

class WsGameSendKeyDTO extends WsGameRoomDTO implements WsGameSendKey {
    @IsString()
    key!: string
    @IsBoolean()
    isUp!: boolean
}

class WsGameSetReadyDTO extends WsGameRoomDTO implements WsGameSetReady { }

class WsGameDebugDTO implements WsGameDebug {
    @IsString()
    userId?: string
    @IsString()
    gameId?: string
}


export type WsGameDTO = {
    [WsGame.joinRoom]: WsGameJoinRoomDTO,
    [WsGame.leaveRoom]: WsGameLeaveRoomDTO,
    [WsGame.sendKey]: WsGameSendKeyDTO,
    [WsGame.setReady]: WsGameSetReadyDTO,
    [WsGame.debug]: WsGameDebugDTO
}

export class DuelInviteDTO {
    @IsNumber()
    targetId!: number
}

export class DuelAcceptDTO {
    @IsNumber()
    senderId!: number
}