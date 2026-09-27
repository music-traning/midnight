const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const idx = code.indexOf('          <div className="col-span-1 md:col-span-5');
console.log(code.substring(idx - 150, idx + 50));
