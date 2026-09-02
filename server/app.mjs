import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const catalog = JSON.parse(fs.readFileSync(path.join(root, 'server/motion-catalog.json'), 'utf8'));
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.post('/api/generate', (req, res) => {
  const { character, prompt } = req.body || {};
  const candidates = catalog.filter(item => item.character === character);
  const normalized = String(prompt || '').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim();
  let match = candidates.find(item => item.prompt.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, ' ').trim() === normalized);
  if (!match) {
    const ranked = candidates.map(item => ({ item, score: item.keywords.reduce((sum, word) => sum + (normalized.includes(word.toLowerCase()) ? 1 : 0), 0) })).sort((a, b) => b.score - a.score);
    match = ranked[0]?.score > 0 ? ranked[0].item : null;
  }
  if (!match) return res.status(422).json({ error: 'No matching motion found for this character and prompt.' });
  res.json({ key: match.key, character: match.character, level: match.level });
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(express.static(path.join(root, 'dist'), { maxAge: '1h', etag: true }));
app.use((_req, res) => res.sendFile(path.join(root, 'dist/index.html')));

app.listen(port, '0.0.0.0', () => console.log(`AETHR is running on http://0.0.0.0:${port}`));
