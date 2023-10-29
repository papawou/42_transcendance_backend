import { addVec, multVec } from "../utils/Vector";
import { BodyRigid } from "./physics/rigid/BodyRigid";
import { BodyBox } from "./physics/rigid/Box";
import { BodyCircle } from "./physics/rigid/Circle";
import { BodyLine } from "./physics/rigid/Line";
import { GameObjectData } from "./pong";

export class GameObject<T extends BodyRigid = BodyRigid> {
    id: string = crypto.randomUUID()
    body: T
    prevState: T;

    constructor(body: T, id?: GameObject["id"], prevState?: T) {
        this.body = body;
        this.id = id ?? this.id;
        this.prevState = JSON.parse(JSON.stringify(prevState ?? this.body))
    }

    integrate(dt: number) {
        this.body.v = addVec(this.body.v, multVec(this.body.a, dt))
        this.body.p = addVec(this.body.p, multVec(this.body.v, dt))
    }

    savePrevState() {
        this.prevState = JSON.parse(JSON.stringify(this.body))
    }

    isKinematic() {
        return this.body.isStatic && (this.body.v.x !== 0 || this.body.v.y !== 0)
    }

    toData(): GameObjectData {
        return {
            id: this.id,
            body: this.body,
            prevState: this.prevState
        }
    }
}

export function isGameObjectBox(obj: GameObject<BodyRigid>): obj is GameObject<BodyBox> {
    return obj.body.shape === "box";
}

export function isGameObjectCircle(obj: GameObject<BodyRigid>): obj is GameObject<BodyCircle> {
    return obj.body.shape === "circle";
}

export function isGameObjectLine(obj: GameObject<BodyRigid>): obj is GameObject<BodyLine> {
    return obj.body.shape === "line";
}