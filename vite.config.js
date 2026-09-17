import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import { matchMotion } from './server/match-motion.mjs';

function motionApi() {
  const handler = (req, res, next) => {
    if (req.url !== '/api/generate' || req.method !== 'POST') return next();
    let raw = '';
    req.on('data', chunk => raw += chunk);
    req.on('end', () => {
      try {
        const { character, prompt } = JSON.parse(raw || '{}');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.end(JSON.stringify(matchMotion(character, prompt)));
      } catch (error) {
        res.statusCode = 422; res.end(JSON.stringify({ error: error.message }));
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
