import { BodyBox, tlBox } from "../base/physics/rigid/Box";
import { BodyCircle } from "../base/physics/rigid/Circle";

export const drawCircle = (body: BodyCircle, ctx: CanvasRenderingContext2D) => {
    ctx.beginPath();
    ctx.arc(body.p.x, body.p.y, body.g.rad, 0, 2 * Math.PI, false);
    ctx.fill();
    ctx.beginPath();
}

export const drawRect = (body: BodyBox, ctx: CanvasRenderingContext2D) => {
    const tlPoint = tlBox(body);
    ctx.fillRect(
        tlPoint.x,
        tlPoint.y,
        body.g.halfDim.x * 2,
        body.g.halfDim.y * 2
    );
}