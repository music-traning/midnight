const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Inject state
code = code.replace(
  'const [countdown, setCountdown] = useState<number | null>(null);',
  'const [countdown, setCountdown] = useState<number | null>(null);\n  const [isHelpOpen, setIsHelpOpen] = useState(false);'
);

// Update Header
const oldHeader = `<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0">
          <div className="flex items-baseline gap-2 md:gap-4">
            <h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">
              🎵 Midnight Session
            </h1>
            <p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">The Jazz Guitar Trainer - ジャズを、もっと深く、もっと楽しく。</p>
          </div>
        </header>`;

const newHeader = `<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0 relative">
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

code = code.replace(oldHeader, newHeader);

// Inject Modal
const modalCode = `
      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsHelpOpen(false)} />
          <div className="relative bg-panel border border-border-dark rounded-xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar overflow-y-auto max-h-[85vh]">
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-accent transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-accent text-lg md:text-xl font-bold border-b border-accent/20 pb-2 mb-4 font-serif">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}`;

code = code.replace(/    <\/div>\n  \);\n}/, modalCode);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched with Help Modal');
