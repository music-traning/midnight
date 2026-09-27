const fs = require('fs');
const code = fs.readFileSync('src/App.tsx', 'utf8');
const start = code.indexOf('<header');
console.log(code.substring(start - 100, start + 300));
