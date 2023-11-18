import { isDef } from "@/technical/isDef";
import { GameEngineServer } from "./GameEngineServer";
import { GameObjectServer } from "./GameObjectServer";
import { CollisionManifold } from "@/shared/pong/physics/collision";
import { Physics } from "@/shared/pong/physics/Physics";

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