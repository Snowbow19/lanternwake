import { cpSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR || '/output';
const screenshots = readdirSync(join(root, 'screenshots')).filter(name => /\.(jpe?g|png)$/i.test(name));
if (screenshots.length < 3 || screenshots.length > 4) {
  throw new Error('Lanternwake needs three or four screenshots of the playable game.');
}
const dossier = buildDossier(root, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
mkdirSync(output, { recursive: true });
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
writeFileSync(join(output, 'dossier.json'), dossier);
