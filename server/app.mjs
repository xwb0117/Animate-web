import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { matchMotion } from './match-motion.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const app = express();
const port = Number(process.env.PORT || 3000);

app.disable('x-powered-by');
app.use(express.json({ limit: '32kb' }));

app.post('/api/generate', (req, res) => {
  const { character, prompt } = req.body || {};
  try { res.json(matchMotion(character, prompt)); }
  catch (error) { res.status(422).json({ error: error.message }); }
});

app.get('/health', (_req, res) => res.json({ status: 'ok' }));
app.use(express.static(path.join(root, 'dist'), { maxAge: '1h', etag: true }));
app.use((_req, res) => res.sendFile(path.join(root, 'dist/index.html')));

app.listen(port, '0.0.0.0', () => console.log(`AETHR is running on http://0.0.0.0:${port}`));
