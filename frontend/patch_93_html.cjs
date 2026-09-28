const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

// 1. Language attribute
if (html.includes('<html lang="en">')) {
  html = html.replace('<html lang="en">', '<html lang="ja">');
} else if (!html.includes('<html lang="ja">')) {
  html = html.replace('<html>', '<html lang="ja">');
}

// 2. Meta description
const metaDesc = '<meta name="description" content="AIがあなたのジャズギター・インプロビゼーションを辛口評価するブラウザ完結型のトレーニングアプリ『Midnight Session』" />';
if (!html.includes('name="description"')) {
  html = html.replace('</head>', `  ${metaDesc}\n  </head>`);
} else {
  html = html.replace(/<meta name="description".*?>/, metaDesc);
}

fs.writeFileSync('index.html', html, 'utf8');
console.log('index.html patched for SEO');
