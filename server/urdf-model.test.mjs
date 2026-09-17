import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js';

test('GLTFLoader preserves original URDF joint names in userData after cloning', async () => {
  for (const kind of ['g1', 'b1']) {
    const bytes = fs.readFileSync(new URL(`../public/unitree/${kind}/model.glb`, import.meta.url));
    const data = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const gltf = await new Promise((resolve, reject) => new GLTFLoader().parse(data, '', resolve, reject));
    const originalNames = new Set();
    clone(gltf.scene).traverse(node => {
      if (node.userData?.name) originalNames.add(node.userData.name);
    });
    const definition = JSON.parse(fs.readFileSync(new URL(`../public/unitree/${kind}/joints.json`, import.meta.url), 'utf8'));
    for (const name of Object.keys(definition.joints)) assert.ok(originalNames.has(`joint:${name}`), `${kind}: ${name}`);
  }
});
