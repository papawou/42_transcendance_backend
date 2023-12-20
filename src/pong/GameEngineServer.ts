import { isDef } from "@/technical/isDef";
import { GameObjectServer } from "./GameObjectServer";
import { PhysicsServer } from "./PhysicsServer";
import { getRandomBool } from "@/technical/randFunc";
import { GameEngine } from "@/shared/pong/GameEngine";
import Scene from "@/shared/pong/Scene";
import { getBodyLine } from "@/shared/pong/physics/rigid/Line";
import { getBodyBox } from "@/shared/pong/physics/rigid/Box";
import { getBodyCircle } from "@/shared/pong/physics/rigid/Circle";
import { GameType } from "@/shared/pong/pong";
import dayjs from "dayjs";

export class GameEngineServer extends GameEngine<GameObjectServer> {

    triggerCallbacks: Array<() => void> = [];
    postLoopCb?: () => void;


    trollLoop?: dayjs.Dayjs

    constructor(gameId: string, width: number, height: number, type: GameType, scene: Scene<GameObjectServer>, physics: PhysicsServer) {
        super(gameId, width, height, type, scene, physics);
        this.players.set("left", undefined)
        this.players.set("right", undefined)
        this.playersBar.set("left", "leftBar")
        this.playersBar.set("right", "rightBar")

        //lines
        this.sc.addObjs(([
            new GameObjectServer({
                ...getBodyLine(), //top
                p: { x: 0, y: 0 },
                g: { norm: { x: 1, y: 0 } }
            }, "top"),
            new GameObjectServer({
                ...getBodyLine(), //right
                p: { x: this.width, y: 0 },
                g: { norm: { x: 0, y: 1 } },
                isTrigger: true
            }, "right", undefined, (source, target, ge) => {
                ge.incrScore("left")
                ge.sc.removeObj(target.id)
                ge.addBall()
            }),
            new GameObjectServer({
                ...getBodyLine(), //bot
                p: { x: 0, y: this.height },
                g: { norm: { x: -1, y: 0 } }
            }, "bot"),
            new GameObjectServer({
                ...getBodyLine(), //left
                p: { x: 0, y: 0 },
                g: { norm: { x: 0, y: -1 } },
                isTrigger: true
            }, "left", undefined, (source, target, ge) => {
                ge.incrScore("right")
                ge.sc.removeObj(target.id)
                ge.addBall()
            }),
        ]))

        const leftBar = new GameObjectServer({
            ...getBodyBox(),
            isStatic: true,
            g: {
                halfDim: {
                    x: 5,
                    y: this.height / 5 / 2
                }
            },
            p: { x: 0, y: this.height / 2 }
        }, "leftBar")
        leftBar.body.p.x = leftBar.body.p.x + leftBar.body.g.halfDim.x * 2 + 10;

        const rightBar = new GameObjectServer({
            ...getBodyBox(),
            g: {
                halfDim: {
                    x: 5,
                    y: this.height / 5 / 2
                }
            },
            p: { x: 0, y: this.height / 2 },
            isStatic: true,
        }, "rightBar")
        rightBar.body.p.x = this.width - rightBar.body.g.halfDim.x * 2 - 10

        this.sc.addObj(leftBar)
        this.sc.addObj(rightBar)

        this.addBall()
    }

    start(cb?: GameEngineServer["postLoopCb"]) {
        this.postLoopCb = cb;
        super.start()
    }

    addBall() {
        const maxMagn = 400
        const balance = Math.random();

        const a = maxMagn * balance;
        const b = maxMagn * (1 - balance);

        const vel = {
            x: Math.max(a, b) * (getRandomBool() ? -1 : 1),
            y: Math.min(a, b) * (getRandomBool() ? -1 : 1)
        }
        const ball = new GameObjectServer({
            ...getBodyCircle(),
            p: { x: this.width / 2, y: this.height / 2 },
            v: vel
        })
        this.sc.addObj(ball);
    }

    registerColliding(source: GameObjectServer, target: GameObjectServer) {
        if (source.registerTriggerEnter(target)) {
            if (isDef(source.onTriggerEnter)) {
                this.triggerCallbacks.push(() => source.onTriggerEnter?.(source, target, this))
            }
        }
    }

    callCb(cb: () => void) {
        if (this.status === "CLOSED") {
            return;
        }
        cb()
    }

    loop() {
        if (this.type === "TROLL") {
            if (!isDef(this.trollLoop)) {
                this.trollLoop = dayjs()
            }
            else if (dayjs().diff(this.trollLoop, "second") >= 2) {
                this.addBall()
                this.trollLoop = dayjs()
            }
        }
        super.loop()
        this.triggerCallbacks.forEach(cb => this.callCb(cb))
        this.triggerCallbacks = []
        this.sc.objs.forEach(o => o.cleanTriggersEnter())
        this.postLoopCb?.();
    }
}
