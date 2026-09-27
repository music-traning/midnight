const fs = require('fs');
const file = 'frontend/package.json';
const p = JSON.parse(fs.readFileSync(file));
p.scripts['build:worklet'] = "node -e \"console.log('Vercel Dir Check:', require('fs').readdirSync('./public/pkg'))\" && node scripts/build-worklet.mjs";
fs.writeFileSync(file, JSON.stringify(p, null, 2));
console.log("package.json patched.");
