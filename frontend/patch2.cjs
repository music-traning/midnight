const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add state
code = code.replace(
  "const [masterMsg, setMasterMsg] = useState(\"よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。\");",
  "const [masterMsg, setMasterMsg] = useState(\"よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。\");\n  const [masterExpression, setMasterExpression] = useState<'neutral' | 'smile' | 'think' | 'point'>('neutral');"
);

// 2. Change the AI evaluation prompt in mediaRecorder.onstop to also return JSON
const oldAiBlock = `                if (!import.meta.env.VITE_GEMINI_API_KEY) {
                  setMasterMsg(\`スコアは\${finalScore}点だ。APIキーが未設定みたいだな。だが、お前のプレイは悪くないぜ。次はもっとハートで弾け。\`);
                  return;
                }
                const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash-lite" });
                const prompt = \\\`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。提供されたスコアとJSON（度数データ）を元に、ユーザーの演奏の良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。\\n\\nスコア: \\\${finalScore}\\n\\nデータ:\\n\\\${JSON.stringify(theoryNotes)}\\\`;
                const result = await model.generateContent(prompt);
                setMasterMsg(result.response.text());
              } catch (apiErr) {
                console.error(apiErr);
                setMasterMsg("エラーだ。まあ、酒でも飲んで落ち着け。");
              }`;

const newAiBlock = `                if (!import.meta.env.VITE_GEMINI_API_KEY) {
                  setMasterMsg(\`スコアは\${finalScore}点だ。APIキーが未設定みたいだな。だが、お前のプレイは悪くないぜ。次はもっとハートで弾け。\`);
                  setMasterExpression('point');
                  return;
                }
                const model = genAI.getGenerativeModel({ 
                  model: "gemini-3.5-flash-lite",
                  generationConfig: { responseMimeType: "application/json" }
                });
                const prompt = \\\`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。提供されたスコアとJSON（度数データ）を元に、ユーザーの演奏の良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}
\\nスコア: \\\${finalScore}\\n\\nデータ:\\n\\\${JSON.stringify(theoryNotes)}\\\`;
                const result = await model.generateContent(prompt);
                const data = JSON.parse(result.response.text());
                setMasterMsg(data.message);
                setMasterExpression(data.expression || 'neutral');
              } catch (apiErr) {
                console.error(apiErr);
                setMasterMsg("エラーだ。まあ、酒でも飲んで落ち着け。");
                setMasterExpression('neutral');
              }`;

code = code.replace(oldAiBlock, newAiBlock);

// 3. Update the JSX for the background
code = code.replace(
  `<div className="fixed inset-0 bg-neutral-900 pointer-events-none z-0" />`,
  `<div className="fixed inset-0 bg-[url('/back.jpg')] bg-cover bg-center pointer-events-none z-0 opacity-40" />`
);

// 4. Update the JSX for the Master Image
const oldMasterPlaceholder = `<div className="absolute inset-0 w-full h-full bg-neutral-800 flex items-center justify-center text-gray-500 text-sm md:text-base">
                マスター画像
              </div>`;

const newMasterImage = `<img src={\`/master_\${masterExpression}.png\`} alt="Master" className="absolute bottom-0 right-0 max-h-full object-contain pointer-events-none z-10" />`;

code = code.replace(oldMasterPlaceholder, newMasterImage);

fs.writeFileSync('src/App.tsx', code);
