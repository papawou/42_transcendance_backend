import { BodyRigid } from "@/shared/pong/physics/rigid/BodyRigid";
import { GameEngineServer } from "./GameEngineServer";
import { GameObject } from "@/shared/pong/GameObject";

export class GameObjectServer<T extends BodyRigid = BodyRigid> extends GameObject<T> {
    onTriggerEnter?: (source: GameObjectServer, target: GameObjectServer, ge: GameEngineServer) => void
    idsTriggerEnter = new Set<GameObject["id"]>();
    idsColliding = new Set<GameObject["id"]>();

    constructor(body: T, id?: GameObject["id"], prevState?: T, onTriggerEnter?: GameObjectServer["onTriggerEnter"]) {
        super(body, id, prevState);
        this.onTriggerEnter = onTriggerEnter
    }

    registerTriggerEnter(target: GameObjectServer): boolean {
        this.idsColliding.add(target.id)
        if (this.idsTriggerEnter.has(target.id)) {
            return false;
        }
        this.idsTriggerEnter.add(target.id);
        return true;
    }

    cleanTriggersEnter() {
        this.idsTriggerEnter.forEach(v => {
            if (!this.idsColliding.has(v)) {
                this.idsTriggerEnter.delete(v);
            }
        })
    }

    clearCollidings() {
        this.idsColliding.clear();
    }
}