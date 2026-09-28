const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const targetStr = `              <div className="mt-auto pt-4 md:pt-6 flex flex-col gap-3 md:gap-4 pb-4 md:pb-0">
                {currentEval?.score !== null && currentEval?.score !== undefined && (
                  <div className="text-center p-3 md:p-4 bg-black/40 border border-accent/20 rounded-xl">
                    <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mb-1">
                      {evaluations.length > 1 ? \`LOOP \${currentIndex + 1} SCORE\` : 'TOTAL SCORE'}
                    </div>
                    <div className="text-4xl md:text-5xl font-serif text-accent">{currentEval.score}</div>
                  </div>
                )}
                
                {theoryNotesState.length > 0 && !isMonitoring && !isAnalyzing && (
                  <button onClick={exportMidi} className="w-full py-2 rounded-lg border border-accent/50 text-accent hover:bg-accent/10 text-sm transition-colors">
                    💾 MIDIダウンロード
                  </button>
                )}`;

const replacementStr = `              <div className="mt-auto pt-4 md:pt-6 flex flex-col gap-3 md:gap-4 pb-4 md:pb-0">
                {/* 評価結果・MIDIボタン用スペース確保（レイアウトシフト防止） */}
                <div className="min-h-[140px] md:min-h-[160px] flex flex-col justify-end gap-3 md:gap-4">
                  {currentEval?.score !== null && currentEval?.score !== undefined ? (
                    <div className="text-center p-3 md:p-4 bg-black/40 border border-accent/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="text-[10px] md:text-xs text-gray-400 uppercase tracking-widest mb-1">
                        {evaluations.length > 1 ? \`LOOP \${currentIndex + 1} SCORE\` : 'TOTAL SCORE'}
                      </div>
                      <div className="text-4xl md:text-5xl font-serif text-accent">{currentEval.score}</div>
                    </div>
                  ) : <div className="flex-1" />}
                  
                  {theoryNotesState.length > 0 && !isMonitoring && !isAnalyzing ? (
                    <button onClick={exportMidi} className="w-full py-2 rounded-lg border border-accent/50 text-accent hover:bg-accent/10 text-sm transition-colors animate-in fade-in duration-300">
                      💾 MIDIダウンロード
                    </button>
                  ) : null}
                </div>`;

code = code.replace(targetStr, replacementStr);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched for CLS fixed on right panel.');
