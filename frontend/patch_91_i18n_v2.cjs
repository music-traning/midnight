const fs = require('fs');

let code = fs.readFileSync('src/i18n.ts', 'utf8');

const oldJa = 'initialMessage: "よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。",';
const newJa = oldJa + `
    recordingStart: "聴いてるぜ。思い切り弾いてみな。",
    autoStopMsg: "もうやめときな。今日はそのくらいにしておけ。\\n指が擦り切れるぜ。",
    analyzingMsg: (count: number) => \`AI解析中だ。少し待ってな...\\n（抽出された総ノート数: \${count}）\`,
    audioQuietMsg: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。",`;

code = code.replace(oldJa, newJa);

const oldEn = 'initialMessage: "Alright, the vibe is perfect.\\nLet\'s hear what you\'ve got tonight.\\nShow me your soul.",';
const newEn = oldEn + `
    recordingStart: "I'm listening. Play it like you mean it.",
    autoStopMsg: "That's enough for tonight. Take a break before your fingers bleed.",
    analyzingMsg: (count: number) => \`Give me a second to process that...\\n(Notes extracted: \${count})\`,
    audioQuietMsg: "Too quiet, or the vibe didn't come through. Play it again.",`;

code = code.replace(oldEn, newEn);

fs.writeFileSync('src/i18n.ts', code, 'utf8');
console.log('src/i18n.ts patched safely!');
