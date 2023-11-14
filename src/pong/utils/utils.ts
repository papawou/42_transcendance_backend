export function interpolateValue(prev: number, curr: number, alpha: number) {
	return curr * alpha + prev * (1.0 - alpha);
}

export function clamp(nb: number, min: number, max: number) {
	return Math.min(Math.max(min, nb), max);
}