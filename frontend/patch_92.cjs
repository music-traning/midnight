const fs = require('fs');

// 1. Update i18n.ts
let i18n = fs.readFileSync('src/i18n.ts', 'utf8');
i18n = i18n.replace(
  'analyzingMsg: (count: number) => `AI解析中だ。少し待ってな...\\n（抽出された総ノート数: ${count}）`,',
  'analyzingMsg: "AI解析中だ。少し待ってな...",'
);
i18n = i18n.replace(
  'analyzingMsg: (count: number) => `Give me a second to process that...\\n(Notes extracted: ${count})`,',
  'analyzingMsg: "Give me a second to process that...",'
);
i18n = i18n.replace(
  'autoStopMsg: "もうやめときな。今日はそのくらいにしておけ。\\n指が擦り切れるぜ。"',
  'autoStopMsg: "もうやめときな。今日はそのくらいにしておけ。……指が擦り切れるぜ。"'
);
fs.writeFileSync('src/i18n.ts', i18n, 'utf8');

// 2. Update App.tsx
let app = fs.readFileSync('src/App.tsx', 'utf8');

app = app.replace(
  /message: wasAutoStopped \? "もうやめときな。今日はそのくらいにしておけ。……指が擦り切れるぜ。" : "AI解析中だ。少し待ってな\.\.\.",/,
  'message: wasAutoStopped ? T.autoStopMsg : T.analyzingMsg,'
);

// We also missed some other replacements in the previous step because of exact string mismatch. Let's fix them if they exist.
if (app.includes('音が小さすぎるか、うまく認識できなかったな。もう一度頼む。')) {
    app = app.replace(
      /"音が小さすぎるか、うまく認識できなかったな。もう一度頼む。"/g,
      "T.audioQuietMsg"
    );
}
if (app.includes('聴いてるぜ。思い切り弾いてみな。')) {
    app = app.replace(
      /"聴いてるぜ。思い切り弾いてみな。"/g,
      "T.recordingStart"
    );
}

fs.writeFileSync('src/App.tsx', app, 'utf8');
console.log('Phase 9.2 patched successfully');
