import g1 from './unitree-g1.json';
import b1 from './unitree-b1.json';
import cabinet from './unitree-cabinet.json';

export const inputModels = {
  g1: { label: '宇树 G1', filename: 'AETHR-G1.glb', url: '/input-models/AETHR-G1.glb', joints: g1.joints },
  b1: { label: '宇树 B1', filename: 'AETHR-B1.glb', url: '/input-models/AETHR-B1.glb', joints: b1.joints },
  cabinet: { label: '组合柜', filename: 'AETHR-Cabinet.glb', url: '/input-models/AETHR-Cabinet.glb', joints: cabinet.joints }
};

export async function recognizeInputModel(file) {
  if (!/\.glb$/i.test(file.name) || file.size < 20) return null;
  const header = new DataView(await file.slice(0, 20).arrayBuffer());
  if (header.getUint32(0, true) !== 0x46546c67 || header.getUint32(4, true) !== 2 || header.getUint32(16, true) !== 0x4e4f534a) return null;
  const jsonLength = header.getUint32(12, true);
  if (jsonLength > 5_000_000 || jsonLength + 20 > file.size) return null;
  try {
    const json = JSON.parse(new TextDecoder().decode(await file.slice(20, 20 + jsonLength).arrayBuffer()));
    const names = new Set((json.nodes || []).map(node => node.name));
    return Object.entries(inputModels).find(([, model]) =>
      Object.keys(model.joints).every(name => names.has(`joint:${name}`)))?.[0] || null;
  } catch {
    return null;
  }
}
