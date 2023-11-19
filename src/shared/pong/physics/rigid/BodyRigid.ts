import { BodyCircle } from "./Circle"
import { BodyBox } from "./Box"
import { BodyLine } from "./Line"
import { Vector, getVec } from "@/shared/pong/utils/Vector"

type Shape = "circle" | "box" | "line"

export type BodyBase<T extends Shape, U = unknown> = {
	p: Vector, //position
	v: Vector, //velocity
	a: Vector, //acceleration
	mass: number,

	shape: T,
	g: U

	isStatic: boolean
	isTrigger: boolean
}

export const getBody = (): Omit<BodyBase<any>, "shape" | "g"> => ({
	p: getVec(),
	v: getVec(),
	a: getVec(),
	mass: 1,

	isStatic: false,
	isTrigger: false,
})

export type BodyRigid = BodyBox | BodyCircle | BodyLine