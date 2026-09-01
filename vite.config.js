import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';

function motionApi() {
  const handler = (req, res, next) => {
    if (req.url !== '/api/generate' || req.method !== 'POST') return next();
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try {
        const { character, prompt } = JSON.parse(raw || '{}');
        const catalog = JSON.parse(fs.readFileSync(new URL('./server/motion-catalog.json', import.meta.url), 'utf8'));
        const candidates = catalog.filter(item => item.character === character);
        const normalized = String(prompt || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
        let match = candidates.find(item => item.prompt.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim() === normalized);
        if (!match) {
          match = candidates.map(item => ({ item, score: item.keywords.reduce((score, word) => score + (normalized.includes(word.toLowerCase()) ? 1 : 0), 0) }))
            .sort((a, b) => b.score - a.score)[0];
          match = match?.score > 0 ? match.item : null;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        if (!match) { res.statusCode = 422; return res.end(JSON.stringify({ error: 'No matching motion found for this character and prompt.' })); }
        res.end(JSON.stringify({ key: match.key, character: match.character, level: match.level }));
      } catch (error) {
        res.statusCode = 500; res.end(JSON.stringify({ error: error.message }));
      }
    });
  };
  return { name: 'motion-api', configureServer(server) { server.middlewares.use(handler); }, configurePreviewServer(server) { server.middlewares.use(handler); } };
}

function copyFbxAssets() {
  return {
    name: 'copy-fbx-assets',
    closeBundle() {
      const source = new URL('./fbx/', import.meta.url);
      const target = new URL('./dist/fbx/', import.meta.url);
      fs.mkdirSync(target, { recursive: true });
      for (const name of fs.readdirSync(source).filter(name => name.endsWith('.fbx'))) {
        fs.copyFileSync(new URL(name, source), new URL(name, target));
      }
    }
  };
}

export default defineConfig({ plugins: [react(), motionApi(), copyFbxAssets()] });
