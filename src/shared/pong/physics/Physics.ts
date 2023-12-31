import { interVec } from "../utils/Vector";
import { GameEngine } from "../GameEngine";
import { GameObject, isGameObjectBox } from "../GameObject";
import { CollisionManifold, collisionDetection, collisionResolve } from "./collision";
import { GameObjectSide, PhysicsData } from "../pong";
import { isDef } from "@/technical/isDef";
import { BodyBox } from "./rigid/Box";

export class Physics<T extends GameObjectSide> {
    PHYSICS_FPS: number = 1 / 60;
    currentTime: number = Date.now();
    accumulator: number = 0.0;

    constructor(fps?: number, currentTime?: number, accumulator?: number) {
        this.PHYSICS_FPS = fps ?? this.PHYSICS_FPS;
        this.currentTime = currentTime ?? this.currentTime
        this.accumulator = accumulator ?? this.accumulator
    }

    init() {
        this.currentTime = Date.now();
        this.accumulator = 0;
    }

    loop(game: GameEngine<T>) {
        const { sc } = game;
        const newTime = Date.now();

        let frameTime = (newTime - this.currentTime) / 1000;
        if (frameTime > 0.25)
            frameTime = 0.25;

        this.currentTime = newTime;
        this.accumulator += frameTime;
        while (this.accumulator >= this.PHYSICS_FPS) {
            sc.objs.forEach((o) => this.preLoop(o))

            //prevent players go outside of game
            for (const [key, value] of game.playersBar) {
                const bar: GameObject | undefined = game.sc.getObj(value)
                if (!isDef(bar) || !isGameObjectBox(bar)) {
                    continue;
                }
                const top = bar.body.p.y - bar.body.g.halfDim.y
                if (top < 0) {
                    bar.body.p.y -= top
                }
                const bot = bar.body.p.y + bar.body.g.halfDim.y
                if (bot > game.height)
                {
                    bar.body.p.y -= (bot - game.height)
                }
            }

            const manifolds = collisionDetection(sc.objs)
            for (const manifold of manifolds) {
                this.preCollisionResolve(manifold, game)
            }

            this.accumulator -= this.PHYSICS_FPS;
        }

        const alpha = this.accumulator / this.PHYSICS_FPS;
        return this.interpolateRender(sc.objs, alpha);
    }

    preLoop(o: T) {
        o.savePrevState();
        o.integrate(this.PHYSICS_FPS)
    }

    preCollisionResolve(manifold: CollisionManifold<GameObject>, game?: GameEngine<T>) {
        if (manifold.bodyA.body.isTrigger === true || manifold.bodyB.body.isTrigger === true) {
            return;
        }
        collisionResolve(manifold);
    }

    private interpolateRender(objs: T[], alpha: number) {
        objs.forEach(o => {
            o.prevState = {
                ...o.prevState,
                p: interVec(o.prevState.p, o.body.p, alpha)
            }
        })
    }

    toData(): PhysicsData {
        return {
            PHYSICS_FPS: this.PHYSICS_FPS,
            currentTime: this.currentTime,
            accumulator: this.accumulator
        }
    }
}