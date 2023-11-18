import { clamp, interpolateValue } from "./utils"

export type Vector = {
	x: number,
	y: number
}

export const getVec = () => ({ x: 0, y: 0, z: 0 })

export const multVec = (v: Vector, alpha: number | Vector): Vector => {
	if (typeof alpha === "number") {
		return ({
			x: v.x * alpha,
			y: v.y * alpha
		})
	}
	return ({
		x: v.x * alpha.x,
		y: v.y * alpha.y
	})
}

export const addVec = (v: Vector, alpha: number | Vector): Vector => {
	if (typeof alpha === "number") {
		return ({
			x: v.x + alpha,
			y: v.y + alpha
		})
	}
	return ({
		x: v.x + alpha.x,
		y: v.y + alpha.y
	})
}

export const subVec = (v: Vector, alpha: number | Vector): Vector => {
	if (typeof alpha === "number") {
		return ({
			x: v.x - alpha,
			y: v.y - alpha
		})
	}
	return ({
		x: v.x - alpha.x,
		y: v.y - alpha.y
	})
}

export function interVec(p: Vector, c: Vector, alpha: number): Vector {
	return {
		x: interpolateValue(p.x, c.x, alpha),
		y: interpolateValue(p.y, c.y, alpha)
	}
}

export function magnVec(v: Vector, sqrt: boolean = true): number {
	const magn = Math.pow(v.x, 2) + Math.pow(v.y, 2);

	return sqrt ? Math.sqrt(magn) : magn
}

export function normVec(v: Vector): Vector {
	const magn = magnVec(v);

	if (magn <= 0) {

		debugger;
		throw (`normVec: fatal Error magn = ${magn}`)
	}

	return { x: v.x / magn, y: v.y / magn }
}

export function invVec(v: Vector): Vector {
	return {
		x: -v.x,
		y: -v.y
	}
}

export function dotVec(a: Vector, b: Vector): number {
	return (a.x * b.x) + (a.y * b.y);
}

export function clampVec(a: Vector, min: Vector, max: Vector): Vector {
	return {
		x: clamp(a.x, min.x, max.x),
		y: clamp(a.y, min.y, max.y)
	}
}