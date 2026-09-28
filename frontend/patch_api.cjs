const fs = require('fs');
let code = fs.readFileSync('api/gemini.js', 'utf8');

code = code.replace(
  'const { type, payload } = req.body;',
  'const { type, payload, language = "ja" } = req.body;'
);

const injection = `
    const langRule = "\\n\\n[IMPORTANT] If the user selected language is 'en', you MUST output all text in the 'message' field in natural, cool native English like a cinematic Jazz bar master. If 'ja', output in Japanese.\\nUser selected language: " + language;
    prompt += langRule;
    
    const result = await model.generateContent(prompt);`;

code = code.replace(
  'const result = await model.generateContent(prompt);',
  injection
);

fs.writeFileSync('api/gemini.js', code, 'utf8');
console.log('API patched');
