// Hands in STARLOOM for make.fun's best-game-01 bounty (Node 22, standard library only).
// STARLOOM is the static browser game in game/ (index.html plus plain ES modules, no library,
// no build step, no network request). This program copies game/ and screenshots/ into the
// output directory and writes dossier.json, the summary the judge reads, with the kit's
// unchanged make.fun library in vendor/. Same inputs, same bytes: it is deterministic.
//
// Play locally: `node serve.ts`, then open http://localhost:8080.
// Hand in locally: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const output = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(output, { recursive: true });
cpSync(join(root, 'game'), join(output, 'game'), { recursive: true });
mkdirSync(join(output, 'screenshots'), { recursive: true });
if (existsSync(join(root, 'screenshots'))) {
  cpSync(join(root, 'screenshots'), join(output, 'screenshots'), { recursive: true });
}

// The scorer's caps: text_max_bytes shapes the dossier text; the rest refuse what the gate would.
const dossier = buildDossier(output, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(output, 'dossier.json'), dossier);
