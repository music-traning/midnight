const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldPrompt = `              const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーのループ\${i+1}回目の演奏データです。スコアとJSON（度数データ）を元に、良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}
\\nスコア: \${loopScore}\\n\\nデータ:\\n\${JSON.stringify(loopNotes)}\`;`;

const newPrompt = `              const slimNotes = loopNotes.map(n => ({
                chord: n.currentChord,
                note: n.noteName,
                degree: n.degree
              }));
              
              const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーのループ\${i+1}回目（2-5-1進行）の演奏データです。提供されたJSONデータ（フレーズの度数情報）を元に、「2-5-1」進行の全体を通したストーリーを評価してください。
特に、「5（ドミナント）」におけるテンションの使い方のセンスと、「1（トニック）」への着地（解決）の美しさについて必ず言及してください。最初の「2」のコードだけで評価を終わらせてはいけません。

出力は150文字〜200文字程度の純粋なセリフのみとし、愛のある辛口なトーン（日本語）を徹底してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}
\\nスコア: \${loopScore}\\n\\nデータ:\\n\${JSON.stringify(slimNotes)}\`;`;

code = code.replace(oldPrompt, newPrompt);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Patch applied successfully.");
