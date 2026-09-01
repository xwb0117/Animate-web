import fs from 'node:fs';
import path from 'node:path';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';

globalThis.ProgressEvent ??= class ProgressEvent {
  constructor(type, init = {}) { this.type = type; Object.assign(this, init); }
};
globalThis.document ??= {
  createElementNS() {
    const listeners = {};
    return {
      addEventListener(type, callback) { listeners[type] = callback; },
      removeEventListener(type) { delete listeners[type]; },
      set src(value) { this.currentSrc = value; queueMicrotask(() => listeners.load?.call(this)); }
    };
  }
};

const sourceDir = path.resolve('fbx');
const targetDir = path.resolve('public/meshes');
fs.mkdirSync(targetDir, { recursive: true });

for (const name of fs.readdirSync(sourceDir).filter(name => name.endsWith('.fbx'))) {
  const buffer = fs.readFileSync(path.join(sourceDir, name));
  const model = new FBXLoader().parse(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), sourceDir + '/');
  model.animations = [];
  model.updateMatrixWorld(true);
  const output = new OBJExporter().parse(model);
  const target = path.join(targetDir, name.replace(/\.fbx$/i, '.obj'));
  fs.writeFileSync(target, `# Static mesh extracted from ${name}; animation tracks removed.\n${output}`);
  console.log(`${name} -> ${path.relative(process.cwd(), target)}`);
}
