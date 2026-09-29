import type { LoadingManager, Texture } from 'three';
import { type GLTF, GLTFLoader, type GLTFLoaderPlugin, type GLTFParser } from 'three/addons/loaders/GLTFLoader.js';

/**
 * WAZO3D's reader for three.js (the owner, 29 Sep 2026: loaders for other platforms that share
 * pictures between models, open source). A WAZO3D `.glb` names every picture by its content
 * (`images[i].extras.wazo.picture`, SHA-256); a picture this loader already holds is handed out
 * again rather than fetched, decoded and uploaded a second time. Nothing of WAZO3D's own is needed:
 * three.js alone, so a host can take this file and nothing else.
 */
export class WazoLoader {
  readonly gltf: GLTFLoader;
  /** One texture per picture and sampling (repeat or clamp), for every model this loader reads. */
  private readonly shared = new Map<string, Promise<Texture>>();

  constructor(manager?: LoadingManager) {
    this.gltf = new GLTFLoader(manager);
    this.gltf.register((parser) => new SharedPictures(parser, this.shared));
  }

  load(url: string): Promise<GLTF> {
    return this.gltf.loadAsync(url);
  }

  parse(data: ArrayBuffer, path = ''): Promise<GLTF> {
    return this.gltf.parseAsync(data, path);
  }

  /** How many distinct pictures are held. */
  get pictures(): number {
    return new Set([...this.shared.keys()].map((key) => key.split('|')[0])).size;
  }

  /** Let go of every texture handed out; models read before keep drawing until they are disposed of. */
  dispose(): void {
    for (const texture of this.shared.values()) void texture.then((t: Texture | null) => t?.dispose());
    this.shared.clear();
  }
}

class SharedPictures implements GLTFLoaderPlugin {
  readonly name = 'WAZO3D_shared_pictures';

  constructor(private readonly parser: GLTFParser, private readonly shared: Map<string, Promise<Texture>>) {}

  loadTexture(textureIndex: number): Promise<Texture> | null {
    const json = this.parser.json as {
      textures?: { source?: number; sampler?: number }[];
      images?: { extras?: { wazo?: { picture?: unknown } } }[];
      samplers?: { wrapS?: number; wrapT?: number }[];
    };
    const texture = json.textures?.[textureIndex];
    const key = texture?.source === undefined ? undefined : json.images?.[texture.source]?.extras?.wazo?.picture;
    if (typeof key !== 'string' || !/^[0-9a-f]{64}$/.test(key)) return null; // not WAZO3D's: three's own way
    const sampler = texture!.sampler === undefined ? undefined : json.samplers?.[texture!.sampler];
    const id = `${key}|${sampler?.wrapS ?? 10497}|${sampler?.wrapT ?? 10497}`;
    let answer = this.shared.get(id);
    if (!answer) {
      answer = this.parser.loadTextureImage(textureIndex, texture!.source!, this.parser.textureLoader);
      this.shared.set(id, answer);
      // three answers null for a picture it could not read: that one is not kept, and asked again next time
      void answer.then((t: Texture | null) => { if (!t) this.shared.delete(id); });
    }
    return answer;
  }
}

export type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
