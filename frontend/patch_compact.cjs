const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Root & Inner Wrappers
code = code.replace(
  '<div className="min-h-screen bg-bg-dark text-gray-200 font-sans flex flex-col relative overflow-x-hidden overflow-y-auto md:overflow-hidden">',
  '<div className="h-[100dvh] bg-bg-dark text-gray-200 font-sans flex flex-col relative overflow-hidden">'
);

code = code.replace(
  '<div className="max-w-7xl mx-auto w-full px-2 md:px-4 py-4 md:py-6 flex flex-col flex-1 relative z-10 min-h-screen md:h-screen">',
  '<div className="max-w-7xl mx-auto w-full px-2 md:px-4 py-2 md:py-4 flex flex-col flex-1 relative z-10 h-full">'
);

code = code.replace(
  '<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-3 md:pb-4 mb-4 md:mb-6">',
  '<header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0">'
);

code = code.replace(
  '<div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 flex-1 min-h-0">',
  '<div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 flex-1 min-h-0">'
);

// 2. Chat Input block spacing
code = code.replace(
  '<div className="mt-4 md:mt-6 mb-4 md:mb-0 bg-panel backdrop-blur-md border border-border-dark rounded-xl p-3 md:p-4 flex items-center gap-3 md:gap-4 shadow-lg shrink-0">',
  '<div className="mt-2 md:mt-3 mb-4 md:mb-0 bg-panel backdrop-blur-md border border-border-dark rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 shadow-lg shrink-0">'
);

// 3. Right column compression
const oldRight = `<div className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:h-full md:min-h-0 md:overflow-hidden">
            <div className="bg-panel backdrop-blur-xl rounded-xl border border-border-dark p-4 md:p-6 flex flex-col gap-4 md:gap-6 shadow-2xl flex-1 md:h-full md:custom-scrollbar md:overflow-y-auto">
              
              <h2 className="text-accent text-xs md:text-sm font-bold flex items-center gap-2 uppercase tracking-widest border-b border-accent/20 pb-2 m-0">
                👤 USER MENU
              </h2>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-xs md:text-sm text-gray-400">🎵 キー設定</label>
                <select 
                  value={musicKey}
                  onChange={(e) => setMusicKey(e.target.value)}
                  disabled={isMonitoring} 
                  className="bg-black/50 border border-border-dark text-white p-2 md:p-2.5 rounded-lg outline-none focus:border-accent text-sm md:text-base"
                >
                  {['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-xs md:text-sm text-gray-400">🎤 入力デバイス</label>
                <select 
                  value={selectedDeviceId} 
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-2 md:p-2.5 rounded-lg outline-none focus:border-accent truncate text-sm md:text-base"
                >
                  <option value="" disabled>デバイスを選択</option>
                  {devices.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || \`Device \${d.deviceId.slice(0, 5)}\`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs md:text-sm text-gray-400">⏱ 遅延補正 (ms)</label>
                  <button onClick={runCalibration} disabled={isMonitoring || isCalibrating} className="text-[10px] md:text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/40 disabled:opacity-50 border border-accent/50">
                    {isCalibrating ? '測定中...' : '測定'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={latency !== null ? latency : '未設定'} disabled readOnly className="bg-black/50 border border-border-dark text-white p-2 md:p-2.5 rounded-lg w-full text-center text-sm md:text-base" />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-xs md:text-sm text-gray-400">⏱ メトロノーム</label>
                <select 
                  value={metronomeMode} 
                  onChange={(e) => setMetronomeMode(e.target.value as any)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-2 md:p-2.5 rounded-lg outline-none focus:border-accent text-sm md:text-base"
                >
                  <option value="off">オフ</option>
                  <option value="on-beat">表拍 (1,2,3,4)</option>
                  <option value="off-beat">裏拍 (2,4)</option>
                  <option value="4-1">4-1 (4拍に1回)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5 md:gap-2">
                <label className="text-xs md:text-sm text-gray-400">🎼 コード進行 (バッキング有)</label>
                <div className="flex gap-1 md:gap-2">
                  {getProgressionForKey(musicKey).map((chord, index) => (
                    <div key={index} className="flex-1 text-center bg-black/50 border border-border-dark p-1.5 md:p-2 rounded-lg text-xs md:text-sm text-gray-300">
                      {chord}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-4 md:pt-6 flex flex-col gap-3 md:gap-4 pb-4 md:pb-0">
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
                </div>

                <button 
                  className={\`w-full py-3 md:py-4 rounded-full font-bold text-base md:text-lg flex items-center justify-center gap-2 md:gap-3 transition-all border \${
                    isMonitoring || countdown !== null
                      ? 'bg-transparent border-red-dot text-red-dot hover:bg-red-dot/10' 
                      : 'bg-transparent border-border-dark text-white hover:border-accent hover:bg-accent/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed\`}
                  onClick={isMonitoring ? stopAudio : async () => { 
                    if (selectedDeviceId) {
                      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                        audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
                      }
                      if (audioContextRef.current.state === 'suspended') {
                        await audioContextRef.current.resume();
                      }
                      setCountdown(3); 
                    }
                  }}
                  disabled={isAnalyzing || countdown !== null}
                >`;

const newRight = `<div className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:h-full md:min-h-0 md:overflow-hidden">
            <div className="bg-panel backdrop-blur-xl rounded-xl border border-border-dark p-3 md:p-4 flex flex-col gap-2 md:gap-3 shadow-2xl flex-1 md:h-full md:custom-scrollbar md:overflow-y-auto">
              
              <h2 className="text-accent text-[10px] md:text-xs font-bold flex items-center gap-2 uppercase tracking-widest border-b border-accent/20 pb-1.5 m-0">
                👤 USER MENU
              </h2>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label className="text-[10px] md:text-xs text-gray-400">🎵 キー設定</label>
                <select 
                  value={musicKey}
                  onChange={(e) => setMusicKey(e.target.value)}
                  disabled={isMonitoring} 
                  className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg outline-none focus:border-accent text-xs md:text-sm"
                >
                  {['C', 'F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb', 'B', 'E', 'A', 'D', 'G'].map(k => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex flex-col gap-1 md:gap-1.5">
                <label className="text-[10px] md:text-xs text-gray-400">🎤 入力デバイス</label>
                <select 
                  value={selectedDeviceId} 
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg outline-none focus:border-accent truncate text-xs md:text-sm"
                >
                  <option value="" disabled>デバイスを選択</option>
                  {devices.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || \`Device \${d.deviceId.slice(0, 5)}\`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] md:text-xs text-gray-400">⏱ 遅延補正 (ms)</label>
                  <button onClick={runCalibration} disabled={isMonitoring || isCalibrating} className="text-[9px] md:text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded hover:bg-accent/40 disabled:opacity-50 border border-accent/50">
                    {isCalibrating ? '測定中...' : '測定'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="text" value={latency !== null ? latency : '未設定'} disabled readOnly className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg w-full text-center text-xs md:text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label className="text-[10px] md:text-xs text-gray-400">⏱ メトロノーム</label>
                <select 
                  value={metronomeMode} 
                  onChange={(e) => setMetronomeMode(e.target.value as any)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg outline-none focus:border-accent text-xs md:text-sm"
                >
                  <option value="off">オフ</option>
                  <option value="on-beat">表拍 (1,2,3,4)</option>
                  <option value="off-beat">裏拍 (2,4)</option>
                  <option value="4-1">4-1 (4拍に1回)</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label className="text-[10px] md:text-xs text-gray-400">🎼 コード進行 (バッキング有)</label>
                <div className="flex gap-1 md:gap-1.5">
                  {getProgressionForKey(musicKey).map((chord, index) => (
                    <div key={index} className="flex-1 text-center bg-black/50 border border-border-dark p-1 md:p-1.5 rounded-lg text-[10px] md:text-xs text-gray-300">
                      {chord}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-2 md:pt-3 flex flex-col gap-2 md:gap-3 pb-2 md:pb-0 shrink-0">
                {/* 評価結果・MIDIボタン用スペース確保（レイアウトシフト防止） */}
                <div className="min-h-[110px] md:min-h-[130px] flex flex-col justify-end gap-2 md:gap-3">
                  {currentEval?.score !== null && currentEval?.score !== undefined ? (
                    <div className="text-center p-2 md:p-3 bg-black/40 border border-accent/20 rounded-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="text-[9px] md:text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">
                        {evaluations.length > 1 ? \`LOOP \${currentIndex + 1} SCORE\` : 'TOTAL SCORE'}
                      </div>
                      <div className="text-3xl md:text-4xl font-serif text-accent">{currentEval.score}</div>
                    </div>
                  ) : <div className="flex-1" />}
                  
                  {theoryNotesState.length > 0 && !isMonitoring && !isAnalyzing ? (
                    <button onClick={exportMidi} className="w-full py-1.5 rounded-lg border border-accent/50 text-accent hover:bg-accent/10 text-[10px] md:text-xs transition-colors animate-in fade-in duration-300">
                      💾 MIDIダウンロード
                    </button>
                  ) : null}
                </div>

                <button 
                  className={\`w-full py-2.5 md:py-3 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all border shrink-0 \${
                    isMonitoring || countdown !== null
                      ? 'bg-transparent border-red-dot text-red-dot hover:bg-red-dot/10' 
                      : 'bg-transparent border-border-dark text-white hover:border-accent hover:bg-accent/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed\`}
                  onClick={isMonitoring ? stopAudio : async () => { 
                    if (selectedDeviceId) {
                      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                        audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
                      }
                      if (audioContextRef.current.state === 'suspended') {
                        await audioContextRef.current.resume();
                      }
                      setCountdown(3); 
                    }
                  }}
                  disabled={isAnalyzing || countdown !== null}
                >`;

if (code.includes(oldRight)) {
  code = code.replace(oldRight, newRight);
  fs.writeFileSync('src/App.tsx', code, 'utf8');
  console.log('App.tsx patched for ultra compact layout!');
} else {
  console.log('Could not find oldRight block. Maybe already patched?');
}
