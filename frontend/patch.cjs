const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const newChat = `  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMasterMsg('...');
    setMasterExpression('think');
    try {
      if (!import.meta.env.VITE_GEMINI_API_KEY) {
        setMasterMsg('キーが設定されてないな。\\nマスターには聞こえてないようだ。');
        setMasterExpression('neutral');
        return;
      }
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-3.5-flash-lite',
        generationConfig: { responseMimeType: 'application/json' }
      });
      const prompt = \\\`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。ユーザーからのメッセージに対して、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}

ユーザーの言葉: \\\${msg}\\\`;
      const result = await model.generateContent(prompt);
      const data = JSON.parse(result.response.text());
      setMasterMsg(data.message);
      setMasterExpression(data.expression || 'neutral');
    } catch (e) {
      console.error(e);
      setMasterMsg('すまん、ちょっと聞き取れなかった。もう一度言ってくれないか？');
      setMasterExpression('neutral');
    }
  };`;

code = code.replace(/  const handleChat = async \(\) => \{[\s\S]*?  \};\n/, newChat + '\n');
fs.writeFileSync('src/App.tsx', code);
