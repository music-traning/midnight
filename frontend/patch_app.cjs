const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add states and refs
code = code.replace(
  `const [isAnalyzing, setIsAnalyzing] = useState(false);`,
  `const [isAnalyzing, setIsAnalyzing] = useState(false);\n  const [countdown, setCountdown] = useState<number | null>(null);`
);

code = code.replace(
  `const typewriterTimerRef = useRef<number | null>(null);`,
  `const typewriterTimerRef = useRef<number | null>(null);\n  const autoStopTimerRef = useRef<number | null>(null);\n  const isAutoStoppedRef = useRef<boolean>(false);`
);

// 2. Add Countdown useEffect
const countdownEffect = `
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startAudio();
    }
  }, [countdown]);
`;
code = code.replace(`const currentEval = evaluations[currentIndex];`, countdownEffect + `\n  const currentEval = evaluations[currentIndex];`);

// 3. Update Title Header
code = code.replace(
  `<h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">\n              🎵 2-5-1 Trainer\n            </h1>`,
  `<h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">\n              🎵 Midnight Session\n            </h1>`
);

// 4. Update Header Subtitle
code = code.replace(
  `The Jazz Guitar Trainer - ジャズを、もっと深く、もっと楽しく。`,
  `The Jazz Guitar Trainer - ジャズを、もっと深く、もっと楽しく。` // Already correct? wait, previous had: `<p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">ジャズを、もっと深く、もっと楽しく。</p>`
);
code = code.replace(
  `<p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">ジャズを、もっと深く、もっと楽しく。</p>`,
  `<p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">The Jazz Guitar Trainer - ジャズを、もっと深く、もっと楽しく。</p>`
);


// 5. stopAudio to clear autoStopTimer
code = code.replace(
  `const stopAudio = useCallback(() => {`,
  `const stopAudio = useCallback(() => {\n    if (autoStopTimerRef.current !== null) {\n      window.clearTimeout(autoStopTimerRef.current);\n      autoStopTimerRef.current = null;\n    }`
);

// 6. startAudio to set isAutoStoppedRef and autoStopTimer
code = code.replace(
  `isAutoStoppedRef.current = false;`,
  ``
); // in case it exists.
code = code.replace(
  `setTheoryNotesState([]);\n    beatCountRef.current = 0;\n    \n    ++aiRequestCountRef.current;`,
  `setTheoryNotesState([]);\n    beatCountRef.current = 0;\n    isAutoStoppedRef.current = false;\n    \n    ++aiRequestCountRef.current;`
);

// 7. Insert auto stop timer right after mediaRecorder.start()
code = code.replace(
  `mediaRecorder.start();`,
  `mediaRecorder.start();\n\n      const durationMs = (60 / BPM) * 4 * 16 * 1000;\n      autoStopTimerRef.current = window.setTimeout(() => {\n        isAutoStoppedRef.current = true;\n        stopAudio();\n      }, durationMs);`
);

// 8. Update mediaRecorder.onstop to handle auto-stop and bypass Gemini
code = code.replace(
  `chunksRef.current = [];\n        \n        setIsAnalyzing(true);`,
  `chunksRef.current = [];\n        \n        if (isAutoStoppedRef.current) {\n          isAutoStoppedRef.current = false;\n          const reqId = ++aiRequestCountRef.current;\n          setEvaluations([{ \n            score: null, \n            message: "もうやめときな。今日はそのくらいにしておけ。……指が擦り切れるぜ。", \n            expression: "point" \n          }]);\n          setCurrentIndex(0);\n          return;\n        }\n\n        setIsAnalyzing(true);`
);


// 9. Update the Record Button
// Find the <button> containing "録音を開始する"
const oldBtn = `<button 
                  className={\`w-full py-3 md:py-4 rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all border \${
                    isMonitoring 
                      ? 'bg-transparent border-red-dot text-red-dot hover:bg-red-dot/10' 
                      : 'bg-transparent border-border-dark text-white hover:border-accent hover:bg-accent/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed\`}
                  onClick={isMonitoring ? stopAudio : startAudio}
                  disabled={isAnalyzing}
                >
                  {isMonitoring ? (
                    <><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-dot"></div> 録音を停止する</>
                  ) : (
                    <><div className={\`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full \${isAnalyzing ? 'bg-gray-500' : 'bg-red-dot pulse-dot'}\`}></div> {isAnalyzing ? 'AI解析中...' : '録音を開始する'}</>
                  )}
                </button>`;

const newBtn = `<button 
                  className={\`w-full py-3 md:py-4 rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all border \${
                    isMonitoring || countdown !== null
                      ? 'bg-transparent border-red-dot text-red-dot hover:bg-red-dot/10' 
                      : 'bg-transparent border-border-dark text-white hover:border-accent hover:bg-accent/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed\`}
                  onClick={isMonitoring ? stopAudio : () => { if (selectedDeviceId) setCountdown(3); }}
                  disabled={isAnalyzing || countdown !== null}
                >
                  {isMonitoring ? (
                    <><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-dot"></div> 録音を停止する</>
                  ) : countdown !== null ? (
                    <>準備中...</>
                  ) : (
                    <><div className={\`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full \${isAnalyzing ? 'bg-gray-500' : 'bg-red-dot pulse-dot'}\`}></div> {isAnalyzing ? 'AI解析中...' : '録音を開始する'}</>
                  )}
                </button>`;
code = code.replace(oldBtn, newBtn);


// 10. Inject overlay for countdown in JSX
// Find the Master Image
const masterImage = `<img 
              src={\`/master_\${currentEval?.expression || 'neutral'}.png\`} 
              alt="Master" 
              className="absolute left-1/2 -translate-x-1/2 bottom-[120px] md:bottom-[190px] h-auto max-h-[70%] md:max-h-[85%] w-auto object-contain z-10 drop-shadow-2xl pointer-events-none"
            />`;

const overlay = `
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl overflow-hidden">
                <div key={countdown} className="text-[12rem] text-accent font-serif animate-bounce drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] leading-none select-none pointer-events-none">
                  {countdown}
                </div>
              </div>
            )}
`;

code = code.replace(masterImage, overlay + '\\n' + masterImage);

fs.writeFileSync('src/App.tsx', code, 'utf8');
