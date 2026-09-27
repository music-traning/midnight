const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldStartBlock = `          mediaRecorder.onstop = async () => {
            setIsMonitoring(false);
            const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
            chunksRef.current = [];
            
            if (isAutoStoppedRef.current) {
              isAutoStoppedRef.current = false;
              const reqId = ++aiRequestCountRef.current;
              setEvaluations([{ 
                score: null, 
                message: "もうやめときな。今日はそのくらいにしておけ。……指が擦り切れるぜ。", 
                expression: "point" 
              }]);
              setCurrentIndex(0);
              return;
            }

            setIsAnalyzing(true);
            const reqId = ++aiRequestCountRef.current;
            setEvaluations([{ score: null, message: "AI解析中だ。少し待ってな...", expression: "think" }]);
            setCurrentIndex(0);`;

const newStartBlock = `          mediaRecorder.onstop = async () => {
            setIsMonitoring(false);
            const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
            chunksRef.current = [];
            
            const wasAutoStopped = isAutoStoppedRef.current;
            isAutoStoppedRef.current = false;

            setIsAnalyzing(true);
            const reqId = ++aiRequestCountRef.current;
            setEvaluations([{ 
              score: null, 
              message: wasAutoStopped ? "もうやめときな。今日はそのくらいにしておけ。……指が擦り切れるぜ。" : "AI解析中だ。少し待ってな...", 
              expression: wasAutoStopped ? "point" : "think" 
            }]);
            setCurrentIndex(0);`;
            
code = code.replace(oldStartBlock, newStartBlock);

// Replace empty valid loops block
const oldEmptyLoops = `          if (validLoops.length === 0) {
            if (reqId !== aiRequestCountRef.current) return;
            setEvaluations([{ score: null, message: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。", expression: "neutral" }]);
            setIsAnalyzing(false);
            return;
          }`;
const newEmptyLoops = `          if (validLoops.length === 0) {
            if (reqId !== aiRequestCountRef.current) return;
            const emptyMsg = { score: null, message: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。", expression: "neutral" };
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], emptyMsg]);
            } else {
              setEvaluations([emptyMsg]);
            }
            setIsAnalyzing(false);
            return;
          }`;
code = code.replace(oldEmptyLoops, newEmptyLoops);

// Replace API Key Missing Block
const oldNoKey = `          if (!import.meta.env.VITE_GEMINI_API_KEY) {
            const noKeyEvals = allLoopsData.map(d => ({
              score: d.score,
              message: \`\${d.loop}周目のスコアは\${d.score}点だ。APIキーが未設定みたいだな。\`,
              expression: 'point'
            }));
            setEvaluations(noKeyEvals);
            setIsAnalyzing(false);
            return;
          }`;
const newNoKey = `          if (!import.meta.env.VITE_GEMINI_API_KEY) {
            const noKeyEvals = allLoopsData.map(d => ({
              score: d.score,
              message: \`\${d.loop}周目のスコアは\${d.score}点だ。APIキーが未設定みたいだな。\`,
              expression: 'point'
            }));
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...noKeyEvals]);
            } else {
              setEvaluations(noKeyEvals);
            }
            setIsAnalyzing(false);
            return;
          }`;
code = code.replace(oldNoKey, newNoKey);

// Replace final evaluations blocks
const oldTryCatch = `            const finalEvals = allLoopsData.map((d, i) => {
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
          }`;
const newTryCatch = `            const finalEvals = allLoopsData.map((d, i) => {
              const resObj = parsedArray[i] || parsedArray[parsedArray.length - 1] || {};
              return {
                score: d.score,
                message: resObj.message || \`\${i+1}周目も悪くないぜ。\`,
                expression: resObj.expression || 'neutral'
              };
            });
            
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...finalEvals]);
            } else {
              setEvaluations(finalEvals);
            }
          } catch (apiErr) {
            console.error(apiErr);
            if (reqId !== aiRequestCountRef.current) return;
            const fallbackEvals = allLoopsData.map(d => ({
              score: d.score,
              message: \`\${d.loop}周目の解析中にエラーが起きたようだ。\`,
              expression: 'neutral'
            }));
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...fallbackEvals]);
            } else {
              setEvaluations(fallbackEvals);
            }
          }`;
code = code.replace(oldTryCatch, newTryCatch);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Auto-stop API logic restored and merged successfully.");
