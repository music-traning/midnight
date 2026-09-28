const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const lines = code.split('\n');
const idx = lines.findIndex(l => l.includes('return ('));
console.log(lines.slice(idx, idx + 15).join('\n'));
