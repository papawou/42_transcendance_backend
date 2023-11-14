import { isDef } from "@/technical/isDef";
import { GameEngine } from "../base/GameEngine";
import Scene from "../base/Scene";
import { getBodyLine } from "../base/physics/rigid/Line";
import { GameObjectServer } from "./GameObjectServer";
import { PhysicsServer } from "./PhysicsServer";
import { getBodyCircle } from "../base/physics/rigid/Circle";
import { getBodyBox } from "../base/physics/rigid/Box";
import { getRandomBool } from "@/technical/randFunc";

export class GameEngineServer extends GameEngine<GameObjectServer> {

    triggerCallbacks: Array<() => void> = [];
    postLoopCb?: () => void;

    constructor(roomId: string, width: number, height: number, scene: Scene<GameObjectServer>, physics: PhysicsServer) {
        super(roomId, width, height, scene, physics);

        this.players.set("left", undefined)
        // this.players.set("right", undefined)
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
                    y: this.height / 5
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
                    y: this.height / 5
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

    stop() {
        super.stop()
        this.postLoopCb = undefined;
    }

    reset(cb?: GameEngineServer["postLoopCb"]) {
        this.stop()
        this.start(cb)
    }

    registerColliding(source: GameObjectServer, target: GameObjectServer) {
        if (source.registerTriggerEnter(target)) {
            if (isDef(source.onTriggerEnter)) {
                this.triggerCallbacks.push(() => source.onTriggerEnter?.(source, target, this))
            }
        }
    }

    loop() {
        super.loop()
        this.triggerCallbacks.forEach(cb => cb())
        this.triggerCallbacks = []
        this.sc.objs.forEach(o => o.cleanTriggersEnter())
        this.postLoopCb?.();
    }
}
