const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(
  'message: "もうやめときな。今日はそのくらいにしておけ。\\n指が擦り切れるぜ。"',
  'message: T.autoStopMsg'
);

code = code.replace(
  'message: `AI解析中だ。少し待ってな...\\n（抽出された総ノート数: ${notes.length}）`',
  'message: T.analyzingMsg(notes.length)'
);

code = code.replace(
  'message: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。"',
  'message: T.audioQuietMsg'
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('src/App.tsx strings patched completely!');
