import { BodyRigid, BodyBase, getBody } from "./BodyRigid"

export type Circle = {
    rad: number
}

export const getCircle = (): Circle => ({
    rad: 10
})

export type BodyCircle = BodyBase<"circle", Circle>

export const getBodyCircle = (): BodyCircle => ({
    ...getBody(),
    shape: "circle",
    g: getCircle()

})