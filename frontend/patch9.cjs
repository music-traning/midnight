const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex2 = /const prompt = `あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。提供されたスコアとJSON（度数データ）を元に、ユーザーの演奏の良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。\r?\n返答は必ず以下のJSONスキーマに従ってください。\r?\n\{\r?\n  "expression": "neutral" \| "smile" \| "think" \| "point",\r?\n  "message": "純粋なセリフのみ"\r?\n\}\r?\n\\nスコア: \$\{finalScore\}\\n\\nデータ:\\n\$\{JSON\.stringify\(theoryNotes\)\}`;/g;

const newBlock = "const prompt = `あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。提供されたスコアとJSON（度数データ）を元に、ユーザーの演奏の良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。\\n返答は必ず以下のJSONスキーマに従ってください。\\n{\\n  \"expression\": \"neutral\" | \"smile\" | \"think\" | \"point\",\\n  \"message\": \"純粋なセリフのみ\"\\n}\\n\\nスコア: ${finalScore}\\n\\nデータ:\\n${JSON.stringify(theoryNotes)}`;";

code = code.replace(regex2, newBlock);

fs.writeFileSync('src/App.tsx', code);
