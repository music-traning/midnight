const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. LocalStorage for language state
code = code.replace(
  "const [language, setLanguage] = useState<'ja' | 'en'>('ja');",
  "const [language, setLanguage] = useState<'ja' | 'en'>(() => (localStorage.getItem('app_language') as 'ja' | 'en') || 'ja');"
);

// 2. Language Toggle with save and useEffect
const oldToggle = `onClick={() => setLanguage(lang => lang === 'ja' ? 'en' : 'ja')}`;
const newToggle = `onClick={() => setLanguage(prev => {
                const newLang = prev === 'ja' ? 'en' : 'ja';
                localStorage.setItem('app_language', newLang);
                return newLang;
              })}`;
code = code.replace(oldToggle, newToggle);

const useEffectCode = `
  useEffect(() => {
    setEvaluations(prev => {
      if (prev.length === 1 && (prev[0].message === UI_TEXT.ja.initialMessage || prev[0].message === UI_TEXT.en.initialMessage)) {
        return [{ ...prev[0], message: T.initialMessage }];
      }
      return prev;
    });
  }, [language]);
`;

code = code.replace(
  "const currentEval = evaluations[currentIndex];",
  useEffectCode + "\n  const currentEval = evaluations[currentIndex];"
);

// 3. Replace Hardcoded Strings
code = code.replace(
  /message: "聴いてるぜ。思い切り弾いてみな。",/g,
  "message: T.recordingStart,"
);

code = code.replace(
  /message: "もうやめときな。今日はそのくらいにしておけ。\\n指が擦り切れるぜ。",/g,
  "message: T.autoStopMsg,"
);

code = code.replace(
  /message: \`AI解析中だ。少し待ってな\.\.\.\\n（抽出された総ノート数: \$\{notes\.length\}\）\`,/g,
  "message: T.analyzingMsg(notes.length),"
);

code = code.replace(
  /message: "音が小さすぎるか、うまく認識できなかったな。もう一度頼む。",/g,
  "message: T.audioQuietMsg,"
);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('src/App.tsx patched for Phase 9.1');
