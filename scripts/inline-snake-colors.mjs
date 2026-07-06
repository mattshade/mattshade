import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');

function normalizeColor(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('#')) return trimmed;
  if (/^[0-9a-f]{3,8}$/i.test(trimmed)) return `#${trimmed}`;
  return trimmed;
}

function inlineSvgVars(svg) {
  const root = svg.match(/:root\s*\{([^}]*)\}/)?.[1] ?? '';
  const vars = {};
  for (const chunk of root.split(';')) {
    const match = chunk.match(/--([a-z0-9-]+)\s*:\s*([^;]+)/i);
    if (match) vars[`--${match[1]}`] = normalizeColor(match[2]);
  }

  Object.assign(vars, {
    '--cb': '#484f58',
    '--cs': '#bef264',
    '--ce': '#3d444d',
    '--c0': '#3d444d',
    '--c1': '#1a4a62',
    '--c2': '#2d5570',
    '--c3': '#5ec4dc',
    '--c4': '#bef264',
  });

  let out = svg;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replaceAll(`var(${key})`, value);
  }
  return out;
}

for (const file of ['github-snake.svg', 'github-snake-dark.svg']) {
  const filePath = path.join(distDir, file);
  if (!fs.existsSync(filePath)) continue;
  const inlined = inlineSvgVars(fs.readFileSync(filePath, 'utf8'));
  fs.writeFileSync(filePath, inlined);
  fs.writeFileSync(path.join(distDir, file.replace('.svg', '-flat.svg')), inlined);
  console.log(`Inlined colors in ${file}`);
}
