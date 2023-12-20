import { GameObjectServer } from "../server/GameObjectServer";

export type GameEngineStatus = "RUNNING" | "PENDING" | "CLOSED"

export type GameType = "CASUAL" | "RANKED" | "TROLL"

export type PlayerData = {
    playerId: string,
    barId?: string,
    user?: {
        userId: number,
        score: number,
        isReady: boolean
    },
}

export type GameObjectData = {
    id: string;
    body: BodyRigid;
    prevState: BodyRigid;
}

export type SceneData = {
    objs: GameObjectData[];
}


export type PhysicsData = {
    PHYSICS_FPS: number;
    currentTime: number;
    accumulator: number;
}

export type GameEngineData = {
    sc: SceneData,
    physics: PhysicsData,

    type: GameType,
    width: number,
    height: number,
    gameId: string,
    players: PlayerData[],
    status: GameEngineStatus,
    closed_reason?: string
}

export type GameObjectSide = GameObjectServer