import Scene from "./Scene";
import { Physics } from "./physics/Physics";
import { isDef } from "@/technical/isDef";
import { GameEngineData, GameEngineStatus, GameObjectSide, PlayerData } from "./pong";
import { Player } from "./Player";

export class GameEngine<T extends GameObjectSide> {
    sc: Scene<T>;
    physics: Physics<T>
    intervalId: NodeJS.Timeout | null = null

    roomId: string
    width: number
    height: number

    status: GameEngineStatus = "PENDING"

    //playerId, userId
    players = new Map<string, Player | undefined>()
    //playerId, barId
    playersBar = new Map<string, string>()

    constructor(roomId: string, width: number, height: number, scene: Scene<T>, physics: Physics<T>) {
        this.sc = scene
        this.physics = physics

        this.roomId = roomId
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

    stop() {
        this.status = "PENDING"
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

    getPlayer(userId: string) {
        for (const [playerId, player] of this.players) {
            if (player?.userId === userId) {
                return { playerId, player, barId: this.playersBar.get(playerId) }
            }
        }
        return undefined
    }

    //input
    handleKeyDown(key: KeyboardEvent["key"], userId: string) {
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

    handleKeyUp(key: KeyboardEvent["key"], userId: string) {
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
    }
    //

    //playerManager
    getNextSlot() {
        for (const [key, value] of this.players) {
            if (!isDef(value)) {
                return key;
            }
        }
        return undefined;
    }

    joinPlayer(userId: string): boolean {
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

    setReadyPlayer(userId: string): boolean {
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

            width: this.width,
            height: this.height,
            roomId: this.roomId,
            players: Array.from(this.players).map(([key, p]) => ({
                playerId: key,
                barId: this.playersBar.get(key),
                user: p?.toData()
            })),
            status: this.status
        })
    }
}