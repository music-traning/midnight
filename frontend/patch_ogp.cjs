const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf8');

html = html.replace(/https:\/\/your-domain\.com\//g, 'https://midnight-ten-rose.vercel.app/');

fs.writeFileSync('index.html', html, 'utf8');
console.log('OGP URLs updated.');
