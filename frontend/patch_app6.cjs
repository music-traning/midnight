const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const startBlockStart = code.indexOf('const blob = new Blob(chunksRef.current');
const startBlockEnd = code.indexOf('try {', startBlockStart);

if (startBlockStart === -1 || startBlockEnd === -1) {
  console.error("Could not find start block");
  process.exit(1);
}

const newStartBlock = `const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
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
        setCurrentIndex(0);
        
        `;

code = code.substring(0, startBlockStart) + newStartBlock + code.substring(startBlockEnd);
fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Scope fixed.");
