const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const oldFunc = `  const runCalibration = useCallback(async () => {
    let ctx = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;
    }
    setIsCalibrating(true);
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    env.gain.setValueAtTime(0, ctx.currentTime);
    env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.005);
    env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(env);
    env.connect(ctx.destination);
    const startTime = ctx.currentTime;
    osc.start(startTime);
    osc.stop(startTime + 0.05);
    setTimeout(() => {
      const measuredLatency = 68 + Math.floor(Math.random() * 5); 
      setLatency(measuredLatency);
      localStorage.setItem('calibration_latency', measuredLatency.toString());
      setIsCalibrating(false);
    }, 1000);
  }, []);`;

const newFunc = `  const runCalibration = useCallback(async () => {
    let ctx = audioContextRef.current;
    if (!ctx) {
      ctx = new AudioContext({ latencyHint: 'interactive' });
      audioContextRef.current = ctx;
    }
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    setIsCalibrating(true);
    
    let stream: MediaStream | null = null;
    let source: MediaStreamAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let reqId: number;
    let timeoutId: any;
    let detected = false;

    const cleanup = () => {
      if (reqId) cancelAnimationFrame(reqId);
      if (timeoutId) clearTimeout(timeoutId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (source) source.disconnect();
      if (analyser) analyser.disconnect();
      setIsCalibrating(false);
    };

    try {
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

      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      env.gain.setValueAtTime(0, ctx.currentTime);
      env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.005);
      env.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(env);
      env.connect(ctx.destination);

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
          const endPerf = performance.now();
          const diff = Math.round(endPerf - startPerf);
          setLatency(diff);
          localStorage.setItem('calibration_latency', diff.toString());
          cleanup();
          return;
        }
        reqId = requestAnimationFrame(check);
      };

      reqId = requestAnimationFrame(check);

      timeoutId = setTimeout(() => {
        if (!detected) {
          alert('マイクが測定音を拾えませんでした。スピーカーの音量を確認するか、マイクを近づけて再度お試しください。');
          cleanup();
        }
      }, 1500);

    } catch (e) {
      console.error('Calibration failed to get mic stream', e);
      alert('マイクへのアクセスに失敗しました。');
      cleanup();
    }
  }, [selectedDeviceId]);`;

code = code.replace(oldFunc, newFunc);
fs.writeFileSync('src/App.tsx', code, 'utf8');
console.log('App.tsx patched for actual calibration');
