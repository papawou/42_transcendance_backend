import { GameEngineData } from "./pong/pong"

export enum WsGame {
    joinRoom = "joinRoomGame",
    leaveRoom = "leaveRoomGame",
    sendKey = "sendKeyGame",
    setReady = "setReadyGame",
    update = "updateGame",
    close = "closeGame",
    search = "searchGame"
}

export interface WsGameRoom {
    roomId: string
}

export interface WsGameJoinRoom extends WsGameRoom { }
export interface WsGameLeaveRoom extends WsGameRoom { }
export interface WsGameSendKey extends WsGameRoom {
    key: string,
    isUp: boolean
}
export interface WsGameSetReady extends WsGameRoom { }

export type WsGameEvents = {
    [WsGame.joinRoom]: {
        in: WsGameJoinRoom,
        out: GameEngineData | WS_NULL
    },
    [WsGame.leaveRoom]: {
        in: WsGameLeaveRoom,
        out: undefined
    },
    [WsGame.sendKey]: {
        in: WsGameSendKey,
        out: undefined
    },
    [WsGame.setReady]: {
        in: WsGameSetReady,
        out: GameEngineData | WS_NULL
    },

    //out
    [WsGame.update]: {
        in: undefined,
        out: GameEngineData
    },
    [WsGame.close]: {
        in: undefined,
        out: undefined
    },
    [WsGame.search]: {
        in: undefined,
        out: true | WS_NULL
    }
}

type WS_NULL = "1IUo4omW4oC/4omW1IUpMTliOWZkMzItNjA5OS00YzEwLWI4YTAtNmRkYzEzOTA1NDFm"

export const WS_FAIL: WS_NULL = "1IUo4omW4oC/4omW1IUpMTliOWZkMzItNjA5OS00YzEwLWI4YTAtNmRkYzEzOTA1NDFm"

export type WsGameIn<T extends keyof WsGameEvents> = WsGameEvents[T]["in"]
export type WsGameOut<T extends keyof WsGameEvents> = WsGameEvents[T]["out"]