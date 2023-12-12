import { GameEngineData } from "./pong/pong"
import { UserGame } from "./shared"

export enum WsGame {
    //in client -> server
    joinRoom = "joinRoomGame",
    leaveRoom = "leaveRoomGame",
    sendKey = "sendKeyGame",
    setReady = "setReadyGame",
    search = "searchGame",

    //out server -> client
    close = "closeGame",
    duelInvite = "duelInvite",
    duelStart = "duelStart",

    //meta in trigger out
    metaGetUser = "metaGetUserGame",
    metaGetGame = "metaGetGameGame",

    //debug
    debug = "debugGame"
}

export interface WsGameRoom {
    gameId: string
}

export interface WsGameJoinRoom extends WsGameRoom { }
export interface WsGameLeaveRoom extends WsGameRoom { }
export interface WsGameSendKey extends WsGameRoom {
    key: string,
    isUp: boolean
}

export interface WsGameSetReady extends WsGameRoom { }

export interface WsGameDebug {
    userId?: string
    gameId?: string
}

export type WsGameEvents = {
    [WsGame.joinRoom]: {
        in: WsGameJoinRoom,
        out: true | false
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
        out: true | WS_NULL
    },
    [WsGame.search]: {
        in: undefined,
        out: true | false
    },    
    //out
    [WsGame.close]: {
        in: undefined,
        out: undefined
    },
    [WsGame.duelStart]: {
        in: undefined,
        out: string //gameId
    },
    [WsGame.duelInvite]: {
        in: undefined,
        out: number //senderId
    }

    //meta
    [WsGame.metaGetUser]: {
        in: undefined,
        out: UserGame | WS_NULL
    },
    [WsGame.metaGetGame]: {
        in?: string, //gameId
        out: GameEngineData | WS_NULL
    },
    [WsGame.debug]: {
        in?: { userId?: number, gameId?: string },
        out: null
    }
}

type WS_NULL = "1IUo4omW4oC/4omW1IUpMTliOWZkMzItNjA5OS00YzEwLWI4YTAtNmRkYzEzOTA1NDFm"

export const WS_FAIL: WS_NULL = "1IUo4omW4oC/4omW1IUpMTliOWZkMzItNjA5OS00YzEwLWI4YTAtNmRkYzEzOTA1NDFm"

export type WsGameIn<T extends keyof WsGameEvents> = WsGameEvents[T]["in"]
export type WsGameOut<T extends keyof WsGameEvents> = WsGameEvents[T]["out"]