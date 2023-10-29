
import { Vector } from "@/pong/utils/Vector"
import { BodyBase, getBody } from "./BodyRigid"

export type Line = {
    norm: Vector
}

export const getLine = (): Line => ({
    norm: { x: 1, y: 0 }
})

export type BodyLine = BodyBase<"line", Line> & {
    isStatic: true
}

export const getBodyLine = (): BodyLine => ({
    ...getBody(),
    isStatic: true,
    shape: "line",
    g: getLine()
})
