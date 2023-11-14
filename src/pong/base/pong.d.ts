import { GameObjectServer } from "../server/GameObjectServer";

export type GameEngineStatus = "RUNNING" | "PENDING"

export type PlayerData = {
    playerId: string,
    barId?: string,
    user?: {
        userId: string,
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

    width: number,
    height: number,
    roomId: string,
    players: PlayerData[],
    status: GameEngineStatus
}

export type GameObjectSide = GameObjectServer