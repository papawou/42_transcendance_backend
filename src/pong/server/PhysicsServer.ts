import { isDef } from "@/technical/isDef";
import { Physics } from "../base/physics/Physics";
import { CollisionManifold } from "../base/physics/collision";
import { GameEngineServer } from "./GameEngineServer";
import { GameObjectServer } from "./GameObjectServer";

export class PhysicsServer extends Physics<GameObjectServer> {

    preLoop(o: GameObjectServer) {
        super.preLoop(o);
        o.clearCollidings()
    }

    preCollisionResolve(manifold: CollisionManifold<GameObjectServer>, game?: GameEngineServer) {
        if (!isDef(game)) {
            return;
        }
        game.registerColliding(manifold.bodyA, manifold.bodyB);
        game.registerColliding(manifold.bodyB, manifold.bodyA);
        super.preCollisionResolve(manifold, game)
    }
}