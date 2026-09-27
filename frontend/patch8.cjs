const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add aiRequestCountRef and displayedMsg and typewriterTimerRef
code = code.replace(
  /const \[masterMsg, setMasterMsg\] = useState.*?;\n\s*const \[masterExpression, setMasterExpression\] = useState.*?;/,
  `const [masterMsg, setMasterMsg] = useState("よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。");
  const [masterExpression, setMasterExpression] = useState<'neutral' | 'smile' | 'think' | 'point'>('neutral');
  const [displayedMsg, setDisplayedMsg] = useState('');
  const aiRequestCountRef = useRef(0);
  const typewriterTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (typewriterTimerRef.current) window.clearInterval(typewriterTimerRef.current);
    setDisplayedMsg('');
    let i = 0;
    const normalizedMsg = masterMsg.replace(/\\\\n/g, '\\n');
    typewriterTimerRef.current = window.setInterval(() => {
      if (i < normalizedMsg.length) {
        setDisplayedMsg(normalizedMsg.substring(0, i + 1));
        i++;
      } else {
        if (typewriterTimerRef.current) window.clearInterval(typewriterTimerRef.current);
      }
    }, 40);
    return () => {
      if (typewriterTimerRef.current) window.clearInterval(typewriterTimerRef.current);
    };
  }, [masterMsg]);`
);

// 2. Modify handleChat
const oldHandleChat = /const handleChat = async \(\) => \{[\s\S]*?  \};\n/;
const newHandleChat = `const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    const reqId = ++aiRequestCountRef.current;
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
      const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。ユーザーからのメッセージに対して、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}

ユーザーの言葉: \${msg}\`;
      const result = await model.generateContent(prompt);
      if (reqId !== aiRequestCountRef.current) return;
      let rawText = result.response.text().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
      const data = JSON.parse(rawText);
      setMasterMsg(data.message);
      setMasterExpression(data.expression || 'neutral');
    } catch (e) {
      console.error(e);
      if (reqId !== aiRequestCountRef.current) return;
      setMasterMsg('すまん、ちょっと聞き取れなかった。もう一度言ってくれないか？');
      setMasterExpression('neutral');
    }
  };
`;
code = code.replace(oldHandleChat, newHandleChat);

// 3. Modify startAudio reset
code = code.replace(
  /beatCountRef\.current = 0;\n\s*setMasterMsg\("聴いてるぜ。思い切り弾いてみな。"\);\n\s*setMasterExpression\('neutral'\);/,
  `beatCountRef.current = 0;
    ++aiRequestCountRef.current;
    setMasterMsg("聴いてるぜ。思い切り弾いてみな。");
    setMasterExpression('neutral');`
);

// 4. Modify onstop analyzing start
code = code.replace(
  /setIsAnalyzing\(true\);\n\s*setMasterMsg\("AI解析中だ。少し待ってな\.\.\."\);\n\s*setMasterExpression\('think'\);/,
  `setIsAnalyzing(true);
        const reqId = ++aiRequestCountRef.current;
        setMasterMsg("AI解析中だ。少し待ってな...");
        setMasterExpression('think');`
);

// 5. Modify onstop AI call
const oldOnstopAI = /try \{\n\s*if \(\!import\.meta\.env\.VITE_GEMINI_API_KEY\) \{[\s\S]*?setMasterExpression\('neutral'\);\n\s*\}\n\s*\},/;
const newOnstopAI = `try {
                if (!import.meta.env.VITE_GEMINI_API_KEY) {
                  if (reqId !== aiRequestCountRef.current) return;
                  setMasterMsg(\`スコアは\${finalScore}点だ。APIキーが未設定みたいだな。だが、お前のプレイは悪くないぜ。次はもっとハートで弾け。\`);
                  setMasterExpression('point');
                  return;
                }
                const model = genAI.getGenerativeModel({ 
                  model: "gemini-3.5-flash-lite",
                  generationConfig: { responseMimeType: "application/json" }
                });
                const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。提供されたスコアとJSON（度数データ）を元に、ユーザーの演奏の良い点と改善点を、愛のある辛口なトーンで150文字以内で語りかけてください。AI的な不自然な挨拶やリスト形式は避け、純粋なセリフのみを出力してください。
返答は必ず以下のJSONスキーマに従ってください。
{
  "expression": "neutral" | "smile" | "think" | "point",
  "message": "純粋なセリフのみ"
}
\\nスコア: \${finalScore}\\n\\nデータ:\\n\${JSON.stringify(theoryNotes)}\`;
                const result = await model.generateContent(prompt);
                if (reqId !== aiRequestCountRef.current) return;
                let rawText = result.response.text().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
                const data = JSON.parse(rawText);
                setMasterMsg(data.message);
                setMasterExpression(data.expression || 'neutral');
              } catch (apiErr) {
                console.error(apiErr);
                if (reqId !== aiRequestCountRef.current) return;
                setMasterMsg("エラーだ。まあ、酒でも飲んで落ち着け。");
                setMasterExpression('neutral');
              }
            },`;
code = code.replace(oldOnstopAI, newOnstopAI);

// 6. Modify JSX displayedMsg
code = code.replace(
  /{masterMsg\.split\(\/\\\\n\|\\n\/\)\.map\(\(line, i\) => \(/,
  `{displayedMsg.split(/\\\\n|\\n/).map((line, i) => (`
);

fs.writeFileSync('src/App.tsx', code);
