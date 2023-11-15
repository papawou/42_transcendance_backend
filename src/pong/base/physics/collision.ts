
import { isDef } from "@/technical/isDef";
import { BodyCircle } from "./rigid/Circle";
import { Vector, addVec, clampVec, dotVec, invVec, magnVec, multVec, normVec, subVec } from "@/pong/utils/Vector";
import { BodyBox } from "./rigid/Box";
import { BodyLine } from "./rigid/Line";
import { GameObject, isGameObjectBox, isGameObjectCircle, isGameObjectLine } from "../GameObject";

export type CollisionManifold<T extends GameObject = GameObject> = {
    bodyA: T,
    bodyB: T,

    point: {
        normal: Vector,
        depth: number,
        localA?: Vector,
        localB?: Vector
    }
}

export function collisionDetection(objs: GameObject[]): CollisionManifold[] {
    const manifolds: CollisionManifold[] = [];

    for (let i = 0; i < objs.length - 1; ++i) {
        const a = objs[i];
        for (let j = i + 1; j < objs.length; ++j) {
            const b = objs[j];
            const manifold = generateManifold(a, b);
            if (!isDef(manifold)) {
                continue;
            }
            manifolds.push(manifold);
        }
    }
    return manifolds;
}

export function collisionResolve({ bodyA: a, bodyB: b, point }: CollisionManifold) {
    //separate
    const a_mass = a.body.mass
    const b_mass = b.body.mass
    const totalMass = a_mass + b_mass

    if (!a.body.isStatic) {
        a.body.p = subVec(a.body.p, multVec(point.normal, point.depth * (b.body.isStatic ? 1 : (b_mass / totalMass))));
    }
    if (!b.body.isStatic) {
        b.body.p = addVec(b.body.p, multVec(point.normal, point.depth * (a.body.isStatic ? 1 : (a_mass / totalMass))));
    }

    //impulse
    const relV = subVec(b.body.v, a.body.v);
    const dotRel = dotVec(relV, point.normal)
    const e = 1;
    // (a.isKinematic() || b.isKinematic()) ? 2 : 
    const invTotalMass = (a.body.isStatic || b.body.isStatic) ? 1 : ((1 / a_mass) + (1 / b_mass))
    const j = (-(1 + e) * dotRel) / invTotalMass;
    const impulse = multVec(point.normal, j);

    if (!a.body.isStatic) {
        a.body.v = subVec(a.body.v, multVec(impulse, 1 / a_mass));
    }
    if (!b.body.isStatic) {
        b.body.v = addVec(b.body.v, multVec(impulse, 1 / b_mass));
    }
}

function generateManifold(a: GameObject, b: GameObject): CollisionManifold | null {
    if (a.body.isStatic && b.body.isStatic) {
        return null;
    }

    let manifold: CollisionManifold | null = null;

    if (isGameObjectCircle(a)) {
        if (isGameObjectCircle(b)) {
            manifold = intersectCircles(a, b);
        } else if (isGameObjectBox(b)) {
            manifold = intersectBoxCircle(b, a);
        } else if (isGameObjectLine(b)) {
            manifold = intersectLineCircle(b, a);
        }
    } else if (isGameObjectBox(a)) {
        if (isGameObjectCircle(b)) {
            manifold = intersectBoxCircle(a, b);
        }
    } else if (isGameObjectLine(a)) {
        if (isGameObjectCircle(b)) {
            manifold = intersectLineCircle(a, b);
        }
    }
    return manifold;
}

function intersectCircles(a: GameObject<BodyCircle>, b: GameObject<BodyCircle>): CollisionManifold | null {
    const radii = a.body.g.rad + b.body.g.rad;

    const vDist = subVec(b.body.p, a.body.p);
    const dist = magnVec(vDist);

    const relV = subVec(b.body.v, a.body.v);
    const depth = radii - dist;

    if (depth < 0 || (depth <= 0 && relV.x === 0 && relV.y === 0)) {
        return null;
    }

    const normal = normVec(vDist);
    return { bodyA: a, bodyB: b, point: { normal, depth } };
}

function intersectBoxCircle(a: GameObject<BodyBox>, b: GameObject<BodyCircle>): CollisionManifold | null {

    const box = a.body.g.halfDim;
    const relPos = subVec(b.body.p, a.body.p);
    const closestPointOnBox = clampVec(relPos, invVec(box), box);

    const localPoint = subVec(relPos, closestPointOnBox);
    const dist = magnVec(localPoint);

    if (dist > b.body.g.rad) {
        return null;
    }

    const normal = normVec(localPoint);
    const depth = (b.body.g.rad - dist);

    return { bodyA: a, bodyB: b, point: { normal, depth } };
}

function intersectLineCircle(a: GameObject<BodyLine>, b: GameObject<BodyCircle>): CollisionManifold | null {
    const relPos = subVec(b.body.p, a.body.p);

    const projectionLength = dotVec(relPos, a.body.g.norm);

    const closestPointOnLine = addVec(a.body.p, multVec(a.body.g.norm, projectionLength));

    const lineToPoint = subVec(b.body.p, closestPointOnLine);
    const dist = magnVec(lineToPoint);

    if (dist > b.body.g.rad) {
        return null;
    }

    return {
        bodyA: a,
        bodyB: b,
        point: {
            normal: normVec(lineToPoint),
            depth: b.body.g.rad - dist
        }
    }
}