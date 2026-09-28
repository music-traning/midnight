const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Remove top-level T and import it
code = code.replace(
  "import { UI_TEXT } from './i18n';\nconst T = UI_TEXT.ja;",
  "import { UI_TEXT } from './i18n';"
);

// 2. Add language state to App component
code = code.replace(
  "function App() {",
  "function App() {\n  const [language, setLanguage] = useState<'ja' | 'en'>('ja');\n  const T = UI_TEXT[language];"
);

// 3. Header and Toggle
const oldHeader = `<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0 relative">
          <div className="flex items-baseline gap-2 md:gap-4">
            <h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">
              🎵 Midnight Session
            </h1>
            <p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">The Jazz Guitar Trainer - ジャズを、もっと深く、もっと楽しく。</p>
          </div>
          <button 
            onClick={() => setIsHelpOpen(true)}
            className="absolute right-0 top-0 md:relative text-gray-500 hover:text-accent transition-colors p-1 md:p-0"
            title="ヘルプ"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        </header>`;

const newHeader = `<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0 relative">
          <div className="flex items-baseline gap-2 md:gap-4">
            <h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">
              🎵 {T.appTitle}
            </h1>
            <p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">{T.appSubtitle}</p>
          </div>
          
          <div className="absolute right-0 top-0 md:relative flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setLanguage(lang => lang === 'ja' ? 'en' : 'ja')}
              className="text-[10px] md:text-xs font-bold px-2 py-1 border border-gray-600 rounded text-gray-400 hover:text-accent hover:border-accent transition-colors"
            >
              {language === 'ja' ? 'EN / JA' : 'JA / EN'}
            </button>
            <button 
              onClick={() => setIsHelpOpen(true)}
              className="text-gray-500 hover:text-accent transition-colors p-1 md:p-0"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          </div>
        </header>`;
code = code.replace(oldHeader, newHeader);

// 4. Update the texts in the right panel and chat
// I will just use string replacements for the specific UI parts.

// "よし、いい感じだ。\nまずは今日のフレーズを聴かせてくれ。\nどんな感じで弾くか、楽しみにしているよ。"
code = code.replace(
  'message: "よし、いい感じだ。\\nまずは今日のフレーズを聴かせてくれ。\\nどんな感じで弾くか、楽しみにしているよ。"',
  'message: T.initialMessage'
);

// "キーが設定されてないな..." -> Disabled anyway, ignoring for now, or just replace with basic string since it's hardcoded false.

// Chat handle
code = code.replace(
  /body: JSON\.stringify\(\{ type: 'chat', payload: msg \}\)/g,
  "body: JSON.stringify({ type: 'chat', payload: msg, language })"
);
code = code.replace(
  "message: 'すまん、ちょっと聞き取れなかった。もう一度言ってくれないか？'",
  "message: T.chatError"
);

// Evaluate handle
code = code.replace(
  /body: JSON\.stringify\(\{ type: 'evaluate', payload: allLoopsData \}\)/g,
  "body: JSON.stringify({ type: 'evaluate', payload: allLoopsData, language })"
);
code = code.replace(
  "message: \`\${i+1}周目も悪くないぜ。\`,",
  "message: resObj.message || (language === 'ja' ? \`\${i+1}周目も悪くないぜ。\` : \`Not bad on loop \${i+1}.\`),"
);
code = code.replace(
  "message: \`\${d.loop}周目の解析中にエラーが起きたようだ。\`,",
  "message: T.evalLoopError(d.loop),"
);
code = code.replace(
  "message: \"解析に失敗したな。もう一度頼む。\"",
  "message: T.evalError"
);

// LIVE Indicator
code = code.replace(
  "LIVE\n              </div>",
  "{T.liveIndicator}\n              </div>"
);

// Chat Bubble Master label
code = code.replace(
  "マスター\n                  </div>",
  "{T.masterLabel}\n                  </div>"
);

// USER MENU
code = code.replace(
  "👤 USER MENU",
  "👤 {T.userMenu}"
);
code = code.replace(
  "🎵 キー設定",
  "{T.keySetting}"
);
code = code.replace(
  "🎤 入力デバイス",
  "{T.inputDevice}"
);
code = code.replace(
  "デバイスを選択",
  "{T.selectDevice}"
);
code = code.replace(
  "⏱ 遅延補正 (ms)",
  "{T.latencyCalib}"
);
code = code.replace(
  "{isCalibrating ? '測定中...' : '測定'}",
  "{isCalibrating ? \`\${T.measuring} (\${calibrationStep}/4)\` : T.measure}"
);
code = code.replace(
  "未設定",
  "{T.notSet}"
);
code = code.replace(
  "⏱ メトロノーム",
  "{T.metronome}"
);
code = code.replace(
  "<option value=\"off\">オフ</option>",
  "<option value=\"off\">{T.metroOff}</option>"
);
code = code.replace(
  "<option value=\"on-beat\">表拍 (1,2,3,4)</option>",
  "<option value=\"on-beat\">{T.metroOnBeat}</option>"
);
code = code.replace(
  "<option value=\"off-beat\">裏拍 (2,4)</option>",
  "<option value=\"off-beat\">{T.metroOffBeat}</option>"
);
code = code.replace(
  "<option value=\"4-1\">4-1 (4拍に1回)</option>",
  "<option value=\"4-1\">{T.metro41}</option>"
);
code = code.replace(
  "🎼 コード進行 (バッキング有)",
  "{T.chordProgression}"
);
code = code.replace(
  "{evaluations.length > 1 ? \`LOOP \${currentIndex + 1} SCORE\` : 'TOTAL SCORE'}",
  "{evaluations.length > 1 ? T.loopScore(currentIndex + 1) : T.totalScore}"
);
code = code.replace(
  "💾 MIDIダウンロード",
  "💾 {T.midiDownload}"
);
code = code.replace(
  "録音を停止する",
  "{T.stopRecording}"
);
code = code.replace(
  "準備中...",
  "{T.preparing}"
);
code = code.replace(
  "'AI解析中...' : '録音を開始する'",
  "T.analyzing : T.startRecording"
);

// Footer
code = code.replace(
  "© 2026 buro",
  "{T.footerCopyright}"
);

// Calibration Alerts
code = code.replace(
  "alert('マイクが測定音を拾えませんでした。全体の測定を中止します。');",
  "alert(T.calibTimeoutAlert);"
);
code = code.replace(
  "alert('マイクへのアクセスに失敗しました。');",
  "alert(T.calibAccessAlert);"
);

// Chat Input placeholder
code = code.replace(
  "placeholder=\"マスターに話しかける...\"",
  "placeholder={T.chatPlaceholder}"
);

// Help Modal
const oldHelpModal = `<h2 className="text-accent text-lg md:text-xl font-bold border-b border-accent/20 pb-2 mb-4 font-serif">
              Midnight Session について
            </h2>
            
            <div className="space-y-4 md:space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
              <p className="text-sm">
                あなたのジャズギター・インプロビゼーションをAIが聴き込み、マスターが辛口で評価するブラウザ完結型のトレーニングアプリです。
              </p>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>🎧</span> ヘッドホン・イヤホン必須
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  スピーカーから音を出すと、バッキングトラックやクリック音をマイクが拾ってしまい、AIが正確に解析できません。演奏時は必ずヘッドホンやイヤホンを使用してください。
                </p>
              </div>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>⏱</span> 遅延補正（キャリブレーション）について
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  環境によって音が届くまでにわずかな遅延が発生します。「測定」ボタンから実測を行うことで、より正確なリズム評価が可能になります。
                </p>
                <div className="mt-2 p-2.5 md:p-3 bg-black/40 border border-accent/30 rounded text-xs text-gray-400">
                  <strong className="text-accent/80 block mb-1">⚠️ 測定時のご注意:</strong>
                  測定時はテスト音が鳴ります。マイクが音を拾えるよう、測定の一瞬だけ<strong>「ヘッドホンを外してマイク（またはピックアップ）に近づける」</strong>か、オーディオインターフェースの<strong>「ステレオミックス（ループバック）をオン」</strong>にしてください。
                </div>
              </div>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>💾</span> MIDIダウンロード
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  評価完了後、あなたが弾いたフレーズ（AIが認識したノートデータ）をMIDIファイルとしてダウンロードできます。自身のタイム感やフレーズの振り返りに活用してください。
                </p>
              </div>
            </div>`;

const newHelpModal = `<h2 className="text-accent text-lg md:text-xl font-bold border-b border-accent/20 pb-2 mb-4 font-serif">
              {T.helpTitle}
            </h2>
            
            <div className="space-y-4 md:space-y-6 text-sm md:text-base text-gray-300 leading-relaxed">
              <p className="text-sm">
                {T.helpDesc}
              </p>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>🎧</span> {T.helpHeadphoneTitle}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {T.helpHeadphoneDesc}
                </p>
              </div>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>⏱</span> {T.helpCalibTitle}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {T.helpCalibDesc}
                </p>
                <div className="mt-2 p-2.5 md:p-3 bg-black/40 border border-accent/30 rounded text-xs text-gray-400">
                  <strong className="text-accent/80 block mb-1">{T.helpCalibWarn}</strong>
                  {T.helpCalibWarnDesc}
                </div>
              </div>

              <div>
                <h3 className="text-accent font-bold mb-1 flex items-center gap-1.5 text-sm md:text-base">
                  <span>💾</span> {T.helpMidiTitle}
                </h3>
                <p className="text-xs md:text-sm text-gray-400">
                  {T.helpMidiDesc}
                </p>
              </div>
            </div>`;

code = code.replace(oldHelpModal, newHelpModal);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("App.tsx i18n patched");
