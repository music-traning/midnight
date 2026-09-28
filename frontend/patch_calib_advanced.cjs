const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// 1. Update State
code = code.replace(
  "const [isCalibrating, setIsCalibrating] = useState(false);",
  "const [calibrationStep, setCalibrationStep] = useState(0);\n  const isCalibrating = calibrationStep > 0;"
);

// 2. Update Button JSX
code = code.replace(
  "{isCalibrating ? '測定中...' : '測定'}",
  "{isCalibrating ? `測定中... (${calibrationStep}/4)` : '測定'}"
);

// 3. Update runCalibration function
const oldFuncStart = code.indexOf('const runCalibration = useCallback(async () => {');
const oldFuncEnd = code.indexOf('}, [selectedDeviceId]);', oldFuncStart) + '}, [selectedDeviceId]);'.length;
const oldFunc = code.substring(oldFuncStart, oldFuncEnd);

const newFunc = `const runCalibration = useCallback(async () => {
    let ctx = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    let stream: MediaStream | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;

    const cleanup = () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      setCalibrationStep(0);
    };

    try {
      setCalibrationStep(1);
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      
      source = ctx.createMediaStreamSource(stream);
      analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      source.connect(analyser);

      const measurements: number[] = [];

      for (let step = 1; step <= 4; step++) {
        setCalibrationStep(step);
        
        const latencyVal = await new Promise<number>((resolve, reject) => {
          const osc = ctx.createOscillator();
          const env = ctx.createGain();
          osc.type = 'square';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          env.gain.setValueAtTime(0, ctx.currentTime);
          env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.005);
          env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
          osc.connect(env);
          env.connect(ctx.destination);

          let reqId: number;
          let timeoutId: any;
          let detected = false;
          
          const startPerf = performance.now();
          osc.start(ctx.currentTime);
          osc.stop(ctx.currentTime + 0.05);

          const data = new Float32Array(analyser.fftSize);

          const check = () => {
            if (!analyser) return;
            analyser.getFloatTimeDomainData(data);
            let peak = 0;
            for (let i = 0; i < data.length; i++) {
              if (Math.abs(data[i]) > peak) peak = Math.abs(data[i]);
            }
            
            if (peak > 0.15) {
              detected = true;
              cancelAnimationFrame(reqId);
              clearTimeout(timeoutId);
              resolve(Math.round(performance.now() - startPerf));
              return;
            }
            reqId = requestAnimationFrame(check);
          };

          reqId = requestAnimationFrame(check);

          timeoutId = setTimeout(() => {
            if (!detected) {
              cancelAnimationFrame(reqId);
              reject(new Error('timeout'));
            }
          }, 1500);
        });

        measurements.push(latencyVal);

        if (step < 4) {
          await new Promise(r => setTimeout(r, 500));
        }
      }

      // 4回のうち、最大値と最小値を除外して平均をとる（より安定させるため）
      measurements.sort((a, b) => a - b);
      const validMeasurements = measurements.slice(1, 3);
      const avg = Math.round(validMeasurements.reduce((a, b) => a + b, 0) / validMeasurements.length);

      setLatency(avg);
      localStorage.setItem('calibration_latency', avg.toString());
      cleanup();

    } catch (e: any) {
      console.error('Calibration failed', e);
      if (e.message === 'timeout') {
        alert('マイクが測定音を拾えませんでした。全体の測定を中止します。');
      } else {
        alert('マイクへのアクセスに失敗しました。');
      }
      cleanup();
    }
  }, [selectedDeviceId]);`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched with multi-ping calibration');
