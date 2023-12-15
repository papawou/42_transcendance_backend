import Scene from "./Scene";
import { Physics } from "./physics/Physics";
import { isDef } from "@/technical/isDef";
import { GameEngineData, GameEngineStatus, GameObjectSide, GameType, PlayerData } from "./pong";
import { Player } from "./Player";

export class GameEngine<T extends GameObjectSide> {
    sc: Scene<T>;
    physics: Physics<T>
    intervalId: NodeJS.Timeout | null = null


    type: GameType
    gameId: string
    width: number
    height: number

    status: GameEngineStatus = "PENDING"
    closed_reason?: string

    //playerId, userId
    players = new Map<string, Player | undefined | null>()
    //playerId, barId
    playersBar = new Map<string, string>()

    constructor(gameId: string, width: number, height: number, type: GameType, scene: Scene<T>, physics: Physics<T>) {
        this.sc = scene
        this.physics = physics
        this.type = type
        this.gameId = gameId
        this.width = width
        this.height = height
    }

    start() {
        if (this.status == "RUNNING") {
            console.warn("game already running")
            return;
        }
        this.status = "RUNNING"
        this.intervalId = setInterval(() => this.loop(), 1000 * this.physics.PHYSICS_FPS);
    }

    stop(reason?: string) {
        this.closed_reason = reason ?? this.closed_reason
        this.status = "CLOSED"
        if (!isDef(this.intervalId)) {
            return;
        }
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    reset() {
        this.stop()
        this.start()
    }

    init() {
        this.physics.init();
    }

    loop() {
        this.physics.loop(this)
    }

    getPlayer(userId: number) {
        for (const [playerId, player] of this.players) {
            if (player?.userId === userId) {
                return { playerId, player, barId: this.playersBar.get(playerId) }
            }
        }
        return undefined
    }

    //input
    handleKeyDown(key: KeyboardEvent["key"], userId: number) {
        const player = this.getPlayer(userId)
        if (!isDef(player) || !isDef(player.barId)) {
            return;
        }
        const bar = this.sc.getObj(player.barId);
        if (!isDef(bar)) {
            return;
        }
        switch (key) {
            case "w":
                bar.body.v.y = -100;
                break;
            case "s":
                bar.body.v.y = 100;
                break;
        }
    }

    handleKeyUp(key: KeyboardEvent["key"], userId: number) {
        const player = this.getPlayer(userId)
        if (!isDef(player) || !isDef(player.barId)) {
            return;
        }
        const bar = this.sc.getObj(player.barId);
        if (!isDef(bar)) {
            return;
        }
        switch (key) {
            case "w":
                bar.body.v.y = 0;
                break;
            case "s":
                bar.body.v.y = 0;
                break;
        }
    }
    //

    //game logic
    incrScore(playerId: string) {
        const player = this.players.get(playerId)
        if (!isDef(player)) {
            return;
        }
        ++player.score
        if (player.score >= 5) {
            this.stop(`Player ${player.userId} has won`)
        }
    }

    //playerManager
    getNextSlot() {
        for (const [key, value] of this.players) {
            if (!isDef(value)) {
                return key;
            }
        }
        return undefined;
    }

    joinPlayer(userId: number): boolean {
        if (isDef(this.getPlayer(userId))) {
            return true;
        }
        const playerId = this.getNextSlot()
        if (!isDef(playerId)) {
            return false;
        }
        this.players.set(playerId, new Player(userId))
        return true;
    }

    leavePlayer(userId: number): boolean {
        const player = this.getPlayer(userId);
        if (!isDef(player)) {
            return false;
        }
        this.players.set(player.playerId, null);
        return true;
    }

    setReadyPlayer(userId: number): boolean {
        const player = this.getPlayer(userId);
        if (!isDef(player)) {
            return false;
        }
        player.player.isReady = true;
        return true;
    }

    isReady(): boolean {
        return Array.from(this.players.values()).every(p => p?.isReady ?? false)
    }

    toData(): GameEngineData {
        const playersData: PlayerData[] = [];
        this.players.forEach((p, key) => {
            playersData.push({
                playerId: key,
                barId: this.playersBar.get(key),
                user: p?.toData()
            })
        })
        return ({
            sc: this.sc.toData(),
            physics: this.physics.toData(),

            type: this.type,
            width: this.width,
            height: this.height,
            gameId: this.gameId,
            players: Array.from(this.players).map(([key, p]) => ({
                playerId: key,
                barId: this.playersBar.get(key),
                user: p?.toData()
            })),
            status: this.status,
            closed_reason: this.closed_reason
        })
    }
}