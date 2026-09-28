const fs = require('fs');
let code = fs.readFileSync('api/gemini.js', 'utf8');

const oldInjection = `const langRule = "\\n\\n[IMPORTANT] If the user selected language is 'en', you MUST output all text in the 'message' field in natural, cool native English like a cinematic Jazz bar master. If 'ja', output in Japanese.\\nUser selected language: " + language;
    prompt += langRule;`;

const newInjection = `const langRule = language === 'en'
      ? "\\n\\n**CRITICAL INSTRUCTION: You MUST output your entire response in English. Use cool, natural Jazz slang and native English phrasing.**"
      : "\\n\\n**CRITICAL INSTRUCTION: 日本語で出力してください。**";
    prompt += langRule;`;

if (code.includes(oldInjection)) {
    code = code.replace(oldInjection, newInjection);
} else {
    // try a more generic replacement in case whitespace was off
    const startIdx = code.indexOf('const langRule');
    const endIdx = code.indexOf('const result = await model.generateContent');
    if(startIdx !== -1 && endIdx !== -1) {
        const toReplace = code.substring(startIdx, endIdx);
        code = code.replace(toReplace, newInjection + '\n    ');
    }
}

fs.writeFileSync('api/gemini.js', code, 'utf8');
console.log('api/gemini.js patched for Phase 9.1');
