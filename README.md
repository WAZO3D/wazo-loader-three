# wazo-loader-three — WAZO3D models in three.js, pictures shared

Reads a WAZO3D `.glb` with three.js's own `GLTFLoader`, with one step added: every picture WAZO3D writes
carries its content name (SHA-256) in `images[i].extras.wazo.picture`, and a picture this loader already
holds is **not fetched, decoded or uploaded again**. A hundred buildings wearing the same brick cost one
brick of video memory.

```js
import { WazoLoader } from 'https://wazo3d.com/embed/wazo-loader.js'; // or dist/wazo-loader.js from this repository

const loader = new WazoLoader();
const a = await loader.load('https://wazo3d.com/inside/models/<key>/lean.glb');
const b = await loader.load('https://wazo3d.com/shared/<key>/lean.glb');
scene.add(a.scene, b.scene);
loader.pictures;   // how many distinct pictures are held
loader.dispose();  // let go of every texture it handed out
```

- A **lean** `.glb` (`…/lean.glb`) has its pictures as addresses (`/pictures/<name>`, kept a year), so a
  picture is also *downloaded* once. The full `.glb` (`…/model.glb`) carries its own bytes and reads in
  any glTF viewer; this loader still shares their textures.
- WAZO3D's `.glb` is in **metres**, one node, the model where it stands (see `boxM` in the manifest).
- Any other glTF reads as it would with `GLTFLoader` alone.

MIT licence. Loaders for Unity, Godot and jMonkeyEngine are to follow.

## Using it

`dist/wazo-loader.js` is an ES module that imports `three` and `three/addons/loaders/GLTFLoader.js` from your
page, so an import map (or your bundler) must provide them:

```html
<script type="importmap">
{ "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.185.0/build/three.module.js",
               "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.185.0/examples/jsm/" } }
</script>
```

## How pictures are shared

WAZO3D writes, beside every image in a `.glb`:

```json
{ "bufferView": 7, "mimeType": "image/jpeg", "extras": { "wazo": { "picture": "<sha-256 of the image bytes>" } } }
```

The loader keeps one `Texture` per picture name and sampling (repeat or clamp) for every model it reads; the
lean `.glb` has `"uri": "https://wazo3d.com/pictures/<name>"` instead of `bufferView`. Any glTF reader can do
the same: the name is the SHA-256 of the bytes, so you may check it.

The source lives in the WAZO3D monorepo (`editor/packages/loader`); this repository is its published copy.
