import { Vector } from "@/pong/utils/Vector"
import { BodyBase, getBody } from "./BodyRigid"

export type Box = {
    halfDim: Vector
}

export const getBox = (): Box => ({
    halfDim: { x: 10, y: 10 }
})

export type BodyBox = BodyBase<"box", Box>

export const getBodyBox = (): BodyBox => ({
    ...getBody(),
    shape: "box",
    g: getBox()
})

export const tlBox = (b: BodyBox): Vector => {
    return ({ x: b.p.x - b.g.halfDim.x, y: b.p.y - b.g.halfDim.y })
}