import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const source = path.join(distDir, 'github-snake-dark-flat.svg');

if (!fs.existsSync(source)) {
  console.error('Missing github-snake-dark-flat.svg');
  process.exit(1);
}

await sharp(source, { density: 144 })
  .flatten({ background: '#0d1117' })
  .png()
  .toFile(path.join(distDir, 'github-snake-dark.png'));

console.log('Wrote github-snake-dark.png');
