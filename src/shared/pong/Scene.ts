import { GameObject } from "./GameObject";
import { SceneData } from "./pong";

export class Scene<T extends GameObject> {
	private _objs: T[] = [];

	constructor(objs?: T[]) {
		this._objs = objs ?? this._objs;
	}

	addObj(obj: T) {
		this._objs.push(obj);
	}

	addObjs(objs: T[]) {
		this._objs.push(...objs);
	}

	get objs(): T[] {
		return this._objs
	}

	set objs(objs: T[]) {
		this._objs = objs;
	}

	getObj(objId: string) {
		return this._objs.find(p => p.id === objId)
	}

	removeObj(objId: string) {
		this._objs = this._objs.filter(p => p.id !== objId);
	}

	toData(): SceneData {
		return {
			objs: this._objs.map(obj => obj.toData())
		}
	}
}

export default Scene