/**
 * Decode base64 icon packs into real PNG files.
 * Run from project root:
 *   node scripts/decode-icons.js
 */
const fs = require('fs');
const path = require('path');

const assets = path.join(__dirname, '..', 'assets');
const files = ['icon.png', 'adaptive-icon.png', 'splash.png', 'favicon.png'];

let ok = 0;
for (const name of files) {
  const b64Path = path.join(assets, name + '.b64');
  const outPath = path.join(assets, name);
  if (!fs.existsSync(b64Path)) {
    console.warn('Missing', b64Path);
    continue;
  }
  const b64 = fs.readFileSync(b64Path, 'utf8').trim();
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'));
  console.log('✓', name, '(' + fs.statSync(outPath).size + ' bytes)');
  ok++;
}
console.log('\nDone! ' + ok + ' icons written to assets/');
console.log('Optional: rm assets/*.b64');
