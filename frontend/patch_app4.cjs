const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startStr = `const newEvals: {score: number, message: string, expression: string}[] = [];`;
const endStr = `          if (reqId === aiRequestCountRef.current && validLoops.length > 0) {\n              setIsAnalyzing(false); \n          }`;

const startIdx = code.indexOf(startStr);
const endIdx = code.indexOf(endStr, startIdx) + endStr.length;

if (startIdx === -1 || endIdx < startIdx) {
  console.error("Could not find the block to replace.");
  process.exit(1);
}

const replacement = `          const allLoopsData = validLoops.map((loopNotes, index) => {
            return {
              loop: index + 1,
              score: calculateScore(loopNotes),
              notes: loopNotes.map(n => ({ chord: n.currentChord, note: n.noteName, degree: n.degree }))
            };
          });

          if (!import.meta.env.VITE_GEMINI_API_KEY) {
            const noKeyEvals = allLoopsData.map(d => ({
              score: d.score,
              message: \`\${d.loop}周目のスコアは\${d.score}点だ。APIキーが未設定みたいだな。\`,
              expression: 'point'
            }));
            setEvaluations(noKeyEvals);
            setIsAnalyzing(false);
            return;
          }

          const model = genAI.getGenerativeModel({ 
            model: "gemini-3.5-flash-lite",
            generationConfig: { responseMimeType: "application/json" }
          });

          const prompt = \`あなたはダークトーンのジャズバーの渋いマスターであり、凄腕のビバップギタリストです。
以下はユーザーが連続して弾いた最大4周分（1周=2-5-1進行）のギターソロデータです。

【データ概要】
ループ数: \${allLoopsData.length}
各ループのデータ:
\${JSON.stringify(allLoopsData)}

【指示】
送信されたデータは \${allLoopsData.length} 周分のコード進行です。
各ループに対して個別の評価を行い、必ず送信されたループ数と等しい数の要素を持つJSON配列で返答してください。
ただ独立した評価をするのではなく、「1周目は〜、だが2周目は〜、そして最後は〜」のように、ソロ全体の展開（起承転結）を踏まえた自然な語り口で、愛のある辛口なトーン（日本語）を徹底してください。
特に「5（ドミナント）」におけるテンションの使い方のセンスと、「1（トニック）」への着地（解決）の美しさについて必ず言及してください。

【出力JSONスキーマ】
[
  {
    "expression": "neutral" | "smile" | "think" | "point",
    "message": "純粋なセリフのみ(150文字程度)",
    "score": ループのスコア(提供された数値をそのまま返すこと)
  }
]\`;

          try {
            const result = await model.generateContent(prompt);
            if (reqId !== aiRequestCountRef.current) return;
            let rawText = result.response.text().replace(/\`\`\`json/gi, '').replace(/\`\`\`/g, '').trim();
            const dataArray = JSON.parse(rawText);
            
            const parsedArray = Array.isArray(dataArray) ? dataArray : (dataArray.evaluations || [dataArray]);
            
            const finalEvals = allLoopsData.map((d, i) => {
              const resObj = parsedArray[i] || parsedArray[parsedArray.length - 1] || {};
              return {
                score: d.score,
                message: resObj.message || \`\${i+1}周目も悪くないぜ。\`,
                expression: resObj.expression || 'neutral'
              };
            });
            
            setEvaluations(finalEvals);
          } catch (apiErr) {
            console.error(apiErr);
            if (reqId !== aiRequestCountRef.current) return;
            const fallbackEvals = allLoopsData.map(d => ({
              score: d.score,
              message: \`\${d.loop}周目の解析中にエラーが起きたようだ。\`,
              expression: 'neutral'
            }));
            setEvaluations(fallbackEvals);
          }

          setIsAnalyzing(false);`;

code = code.substring(0, startIdx) + replacement + code.substring(endIdx);
fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Patch applied successfully.");
