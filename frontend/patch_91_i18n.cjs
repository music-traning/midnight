const fs = require('fs');

let code = fs.readFileSync('src/i18n.ts', 'utf8');

// Inject new keys for JA
code = code.replace(
  'initialMessage: "よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。",',
  'initialMessage: "よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。",\n    recordingStart: "聴いてるぜ。思い切り弾いてみな。",\n    autoStopMsg: "もうやめときな。今日はそのくらいにしておけ。\\n指が擦り切れるぜ。",\n    analyzingMsg: (count: number) => `AI解析中だ。少し待ってな...\\n（抽出された総ノート数: ${count}）`,\n    audioQuietMsg: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。",'
);

// Inject new keys for EN
code = code.replace(
  'initialMessage: "Alright, the vibe is perfect.\\nLet\\'s hear what you\\'ve got tonight.\\nShow me your soul.",',
  'initialMessage: "Alright, the vibe is perfect.\\nLet\\'s hear what you\\'ve got tonight.\\nShow me your soul.",\n    recordingStart: "I\\'m listening. Play it like you mean it.",\n    autoStopMsg: "That\\'s enough for tonight. Take a break before your fingers bleed.",\n    analyzingMsg: (count: number) => `Give me a second to process that...\\n(Notes extracted: ${count})`,\n    audioQuietMsg: "Too quiet, or the vibe didn\\'t come through. Play it again.",'
);

fs.writeFileSync('src/i18n.ts', code, 'utf8');
console.log('src/i18n.ts patched for Phase 9.1');
