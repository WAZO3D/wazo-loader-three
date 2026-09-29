import { GLTFLoader as e } from "three/addons/loaders/GLTFLoader.js";
//#region packages/loader/src/index.ts
var t = class {
	gltf;
	shared = /* @__PURE__ */ new Map();
	constructor(t) {
		this.gltf = new e(t), this.gltf.register((e) => new n(e, this.shared));
	}
	load(e) {
		return this.gltf.loadAsync(e);
	}
	parse(e, t = "") {
		return this.gltf.parseAsync(e, t);
	}
	get pictures() {
		return new Set([...this.shared.keys()].map((e) => e.split("|")[0])).size;
	}
	dispose() {
		for (let e of this.shared.values()) e.then((e) => e?.dispose());
		this.shared.clear();
	}
}, n = class {
	parser;
	shared;
	name = "WAZO3D_shared_pictures";
	constructor(e, t) {
		this.parser = e, this.shared = t;
	}
	loadTexture(e) {
		let t = this.parser.json, n = t.textures?.[e], r = n?.source === void 0 ? void 0 : t.images?.[n.source]?.extras?.wazo?.picture;
		if (typeof r != "string" || !/^[0-9a-f]{64}$/.test(r)) return null;
		let i = n.sampler === void 0 ? void 0 : t.samplers?.[n.sampler], a = `${r}|${i?.wrapS ?? 10497}|${i?.wrapT ?? 10497}`, o = this.shared.get(a);
		return o || (o = this.parser.loadTextureImage(e, n.source, this.parser.textureLoader), this.shared.set(a, o), o.then((e) => {
			e || this.shared.delete(a);
		})), o;
	}
};
//#endregion
export { t as WazoLoader };
