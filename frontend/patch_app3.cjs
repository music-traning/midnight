const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Add playCountSound function outside App component
const playCountSoundCode = `
function playCountSound(ctx: AudioContext, isHigh: boolean) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = isHigh ? 1200 : 800;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}
`;
code = code.replace(`function App() {`, playCountSoundCode + '\nfunction App() {');

// 2. Update countdown useEffect
const oldCountdownEffect = `  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startAudio();
    }
  }, [countdown]);`;

const newCountdownEffect = `  useEffect(() => {
    if (countdown === null) return;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      playCountSound(audioContextRef.current, countdown <= 1);
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startAudio();
    }
  }, [countdown]);`;
code = code.replace(oldCountdownEffect, newCountdownEffect);

// 3. Update the onClick in the button
const oldOnClick = `onClick={isMonitoring ? stopAudio : () => { if (selectedDeviceId) setCountdown(3); }}`;
const newOnClick = `onClick={isMonitoring ? stopAudio : async () => { 
                    if (selectedDeviceId) {
                      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
                        audioContextRef.current = new AudioContext({ latencyHint: 'interactive' });
                      }
                      if (audioContextRef.current.state === 'suspended') {
                        await audioContextRef.current.resume();
                      }
                      setCountdown(3); 
                    }
                  }}`;
code = code.replace(oldOnClick, newOnClick);

// 4. Update startAudio to reuse context
const oldStartAudioCtx = `      const ctx = new AudioContext({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;`;
const newStartAudioCtx = `      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContext({ latencyHint: 'interactive' });
        audioContextRef.current = ctx;
      }`;
code = code.replace(oldStartAudioCtx, newStartAudioCtx);

fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log("Patch 3 applied successfully.");
