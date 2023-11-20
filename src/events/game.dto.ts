import { WsGame, WsGameJoinRoom, WsGameLeaveRoom, WsGameRoom, WsGameSendKey, WsGameSetReady } from "@/shared/ws-game";
import { IsBoolean, IsNotEmpty, IsString } from "class-validator";

class WsGameRoomDTO implements WsGameRoom {
    @IsString()
    roomId!: string
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

export type WsGameDTO = {
    [WsGame.joinRoom]: WsGameJoinRoomDTO,
    [WsGame.leaveRoom]: WsGameLeaveRoomDTO,
    [WsGame.sendKey]: WsGameSendKeyDTO,
    [WsGame.setReady]: WsGameSetReadyDTO
}