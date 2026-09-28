import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UI_TEXT } from './i18n';
import './App.css';
import MidiWriter from 'midi-writer-js';
import { BPM, BEAT_DUR, BAR_DUR, getProgressionForKey, getChordForTime, getDegree, calculateScore, analyzeNote } from './lib/theory';

function playChord(time: number, chordName: string, duration: number, ctx: AudioContext, destination?: AudioNode) {
  const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
  let notes: number[] = [];
  const rootStr = chordName.replace(/m7|maj7|7/g, ''); 
  const rootToMidi: Record<string, number> = { 'C': 48, 'C#': 49, 'Db': 49, 'D': 50, 'Eb': 51, 'E': 52, 'F': 53, 'F#': 54, 'Gb': 54, 'G': 43, 'Ab': 44, 'A': 45, 'Bb': 46, 'B': 47 };
  const base = rootToMidi[rootStr] || 48;
  
  if (chordName.includes('m7')) {
    notes = [base, base + 3, base + 7, base + 10];
  } else if (chordName.includes('maj7')) {
    notes = [base, base + 4, base + 7, base + 11];
  } else if (chordName.includes('7')) {
    notes = [base, base + 4, base + 7, base + 10];
  } else {
    notes = [base, base + 4, base + 7];
  }
  
  notes.forEach(midi => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = midiToFreq(midi);
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.05, time + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration - 0.1);
    osc.connect(gain);
    gain.connect(destination || ctx.destination);
    osc.start(time);
    osc.stop(time + duration);
  });
}



function playCountSound(ctx: AudioContext, isHigh: boolean, destination?: AudioNode) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = isHigh ? 1200 : 800;
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  osc.connect(gain);
    gain.connect(destination || ctx.destination);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + 0.1);
}

function App() {
  const [language, setLanguage] = useState<'ja' | 'en'>(() => (localStorage.getItem('app_language') as 'ja' | 'en') || 'ja');
  const T = UI_TEXT[language];
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const helpCloseBtnRef = useRef<HTMLButtonElement>(null);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isHelpOpen) {
        setIsHelpOpen(false);
      }
    };
    if (isHelpOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Wait for render then focus
      setTimeout(() => helpCloseBtnRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isHelpOpen]);

  
  // Single Source of Truth for Messages and Scores
  const [evaluations, setEvaluations] = useState<{score: number | null, message: string, expression: string}[]>([
    { score: null, message: T.initialMessage, expression: "neutral" }
  ]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedMsg, setDisplayedMsg] = useState('');
  
  const [theoryNotesState, setTheoryNotesState] = useState<any[]>([]);
  const [metronomeMode, setMetronomeMode] = useState<'off' | 'on-beat' | 'off-beat' | '4-1'>('off');
  const [chatInput, setChatInput] = useState('');
  const [musicKey, setMusicKey] = useState('C');
  
  const [latency, setLatency] = useState<number | null>(() => {
    const saved = localStorage.getItem('calibration_latency');
    return saved ? parseInt(saved, 10) : null;
  });
  const [calibrationStep, setCalibrationStep] = useState(0);
  const isCalibrating = calibrationStep > 0;

  const latestTRef = useRef(T);
  const latestLangRef = useRef(language);
  const masterGainRef = useRef<GainNode | null>(null);
  const recordingDriftRef = useRef<number>(0);
  
  useEffect(() => {
    latestTRef.current = T;
    latestLangRef.current = language;
  }, [T, language]);
  
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);


  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const schedulerTimerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef<number>(0);
  const beatCountRef = useRef<number>(0);
  
  const aiRequestCountRef = useRef(0);
  const typewriterTimerRef = useRef<number | null>(null);
  const autoStopTimerRef = useRef<number | null>(null);
  const isAutoStoppedRef = useRef<boolean>(false);

  
  useEffect(() => {
    if (countdown === null) return;
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      playCountSound(audioContextRef.current, countdown <= 1, masterGainRef.current || undefined);
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCountdown(null);
      startAudio();
    }
  }, [countdown]);

  
  useEffect(() => {
    setEvaluations(prev => {
      if (prev.length === 1 && (prev[0].message === UI_TEXT.ja.initialMessage || prev[0].message === UI_TEXT.en.initialMessage)) {
        return [{ ...prev[0], message: T.initialMessage }];
      }
      return prev;
    });
  }, [language]);

  const currentEval = evaluations[currentIndex];

  useEffect(() => {
    async function fetchDevices() {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        const allDevices = await navigator.mediaDevices.enumerateDevices();
        const audioInputDevices = allDevices.filter(d => d.kind === 'audioinput');
        setDevices(audioInputDevices);
        if (audioInputDevices.length > 0) setSelectedDeviceId(audioInputDevices[0].deviceId);
      } catch (e) {
        console.error('Error fetching devices', e);
      }
    }
    fetchDevices();
  }, []);

  useEffect(() => {
    if (!currentEval) return;
    
    if (typewriterTimerRef.current !== null) {
      window.clearInterval(typewriterTimerRef.current);
      typewriterTimerRef.current = null;
    }
    
    setDisplayedMsg('');
    setIsTyping(true);
    let i = 0;
    const normalizedMsg = currentEval.message.replace(/\\n/g, '\n');
    
    if (normalizedMsg.length === 0) {
      setIsTyping(false);
      return;
    }

    typewriterTimerRef.current = window.setInterval(() => {
      if (i < normalizedMsg.length) {
        setDisplayedMsg(normalizedMsg.substring(0, i + 1));
        i++;
      } else {
        setIsTyping(false);
        if (typewriterTimerRef.current !== null) {
          window.clearInterval(typewriterTimerRef.current);
          typewriterTimerRef.current = null;
        }
      }
    }, 40);

    return () => {
      if (typewriterTimerRef.current !== null) {
        window.clearInterval(typewriterTimerRef.current);
        typewriterTimerRef.current = null;
      }
    };
  }, [currentEval]);

  const handleBubbleClick = () => {
    if (!isTyping && currentIndex < evaluations.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const msg = chatInput.trim();
    setChatInput('');
    const reqId = ++aiRequestCountRef.current;
    
    setEvaluations([{ score: null, message: '...', expression: 'think' }]);
    setCurrentIndex(0);
    
    try {
      if (false) { // Disabled env check on client
        setEvaluations([{ score: null, message: 'キーが設定されてないな。\nマスターには聞こえてないようだ。', expression: 'neutral' }]);
        return;
      }
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'chat', payload: msg, language })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      if (reqId !== aiRequestCountRef.current) return;
      setEvaluations([{ score: null, message: data.message, expression: ['neutral', 'smile', 'think', 'point'].includes(data.expression) ? data.expression : 'neutral' }]);
    } catch (e) {
      console.error(e);
      if (reqId !== aiRequestCountRef.current) return;
      setEvaluations([{ score: null, message: T.chatError, expression: 'neutral' }]);
    }
  };

  const exportMidi = () => {
    if (theoryNotesState.length === 0) return;
    const track = new MidiWriter.Track();
    track.addEvent(new MidiWriter.ProgramChangeEvent({instrument: 27}));
    theoryNotesState.forEach(n => {
      const startTick = Math.round(parseFloat(n.startTime) * 256);
      const durTick = Math.round(parseFloat(n.duration) * 256);
      const event = new MidiWriter.NoteEvent({
        pitch: [n.pitchMidi],
        duration: 'T' + durTick,
        tick: startTick,
        velocity: Math.min(100, Math.max(1, Math.round(parseFloat(n.amplitude) * 100)))
      });
      track.addEvent(event);
    });
    const write = new MidiWriter.Writer(track);
    const uri = write.dataUri();
    const a = document.createElement('a');
    a.href = uri;
    a.download = 'jazz-session.mid';
    a.click();
  };

  const runCalibration = useCallback(async () => {
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

          const data = new Float32Array((analyser as AnalyserNode).fftSize);

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
        alert(latestTRef.current.calibTimeoutAlert);
      } else {
        alert(latestTRef.current.calibAccessAlert);
      }
      cleanup();
    }
  }, [selectedDeviceId]);

  const stopAudio = useCallback(() => {
    if (autoStopTimerRef.current !== null) {
      window.clearTimeout(autoStopTimerRef.current);
      autoStopTimerRef.current = null;
    }
    if (schedulerTimerRef.current !== null) {
      window.clearInterval(schedulerTimerRef.current);
      schedulerTimerRef.current = null;
    }
    if (workletNodeRef.current) {
      workletNodeRef.current.disconnect();
      workletNodeRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      setIsMonitoring(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track: MediaStreamTrack) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  const startAudio = useCallback(async () => {
    if (!selectedDeviceId) return;
    stopAudio();
    
    // Clear and prepare state
    setEvaluations([{ score: null, message: latestTRef.current.recordingStart, expression: "neutral" }]);
    setCurrentIndex(0);
    setTheoryNotesState([]);
    beatCountRef.current = 0;
    isAutoStoppedRef.current = false;
    
    ++aiRequestCountRef.current;

    try {
      let ctx = audioContextRef.current;
      if (!ctx || ctx.state === 'closed') {
        ctx = new AudioContext({ latencyHint: 'interactive' });
        audioContextRef.current = ctx;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: selectedDeviceId }, echoCancellation: false, noiseSuppression: false, autoGainControl: false, channelCount: 1 }
      });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        setIsMonitoring(false);
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        chunksRef.current = [];
        
        const wasAutoStopped = isAutoStoppedRef.current;
        isAutoStoppedRef.current = false;

        setIsAnalyzing(true);
        const reqId = ++aiRequestCountRef.current;
        setEvaluations([{ 
          score: null, 
          message: wasAutoStopped ? latestTRef.current.autoStopMsg : latestTRef.current.analyzingMsg, 
          expression: wasAutoStopped ? "point" : "think" 
        }]);
        setCurrentIndex(0);
        
        try {
          const { BasicPitch, noteFramesToTime, addPitchBendsToNoteEvents, outputToNotesPoly } = await import('@spotify/basic-pitch');
          const arrayBuffer = await blob.arrayBuffer();
          const tempCtx = new AudioContext({ sampleRate: 22050 });
          const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer);
          await tempCtx.close();

          let monoData: Float32Array;
          if (audioBuffer.numberOfChannels > 1) {
            monoData = new Float32Array(audioBuffer.length);
            const left = audioBuffer.getChannelData(0);
            const right = audioBuffer.getChannelData(1);
            for (let i = 0; i < audioBuffer.length; i++) {
              monoData[i] = (left[i] + right[i]) / 2.0;
            }
          } else {
            monoData = audioBuffer.getChannelData(0);
          }

          const basicPitch = new BasicPitch('https://unpkg.com/@spotify/basic-pitch@1.0.1/model/model.json');
          
          console.log(`[DEBUG] Audio buffer decoded. Duration: ${audioBuffer.duration}s`);
          const lastFrames: number[][] = [];
          const lastOnsets: number[][] = [];
          const lastContours: number[][] = [];

          await basicPitch.evaluateModel(
            monoData,
            (frames: number[][], onsets: number[][], contours: number[][]) => {
              lastFrames.push(...frames);
              lastOnsets.push(...onsets);
              lastContours.push(...contours);
            },
            (percent: number) => {}
          );
          
          // CRITICAL: Ensure we haven't started a new recording/chat
          if (reqId !== aiRequestCountRef.current) return;

          const noteEvents = outputToNotesPoly(lastFrames, lastOnsets);
          const withBends = addPitchBendsToNoteEvents(lastContours, noteEvents);
          const notesInTime = noteFramesToTime(withBends);
          
          const currentLatencySec = (latency || 0) / 1000.0;

          const sorted = [...notesInTime].map(n => {
            let correctedTime = n.startTimeSeconds - currentLatencySec - (recordingDriftRef.current || 0);
            if (correctedTime < 0) correctedTime = 0;
            return { ...n, startTimeSeconds: correctedTime };
          }).sort((a, b) => a.startTimeSeconds - b.startTimeSeconds);
          
          const thresholdFiltered = sorted.filter(n => n.durationSeconds >= 0.06 && n.amplitude >= 0.45 && n.pitchMidi >= 40 && n.pitchMidi <= 88);
          
          const deduplicated: typeof thresholdFiltered = [];
          for (const note of thresholdFiltered) {
            if (deduplicated.length === 0) {
              deduplicated.push({ ...note });
              continue;
            }
            const last = deduplicated[deduplicated.length - 1];
            if (Math.abs(note.startTimeSeconds - last.startTimeSeconds) <= 0.05) {
              if (note.amplitude > last.amplitude) deduplicated[deduplicated.length - 1] = { ...note };
            } else {
              deduplicated.push({ ...note });
            }
          }

          for (let i = 0; i < deduplicated.length - 1; i++) {
            const curr = deduplicated[i];
            const next = deduplicated[i + 1];
            const currEndTime = curr.startTimeSeconds + curr.durationSeconds;
            if (currEndTime > next.startTimeSeconds) curr.durationSeconds = next.startTimeSeconds - curr.startTimeSeconds;
          }

          const midiToNoteName = (midi: number) => {
            const notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
            return `${notes[midi % 12]}${Math.floor(midi / 12) - 1}`;
          };

          const theoryNotes = deduplicated.map(n => {
            const chord = getChordForTime(n.startTimeSeconds, musicKey);
            const degree = getDegree(n.pitchMidi, chord);
            return {
              noteName: midiToNoteName(n.pitchMidi),
              pitchMidi: n.pitchMidi,
              startTime: n.startTimeSeconds.toFixed(3),
              duration: n.durationSeconds.toFixed(3),
              amplitude: n.amplitude.toFixed(3),
              currentChord: chord,
              degree: degree
            };
          });

          console.log(`[DEBUG] 抽出された総ノート数 (deduplicated): ${theoryNotes.length}`);
          setTheoryNotesState(theoryNotes);

          // Chunk theoryNotes by loop (4 bars)
          const loopDurationSec = BAR_DUR * 4;
          const loops: any[][] = [];
          theoryNotes.forEach(n => {
            const lIdx = Math.floor(parseFloat(n.startTime) / loopDurationSec);
            if (!loops[lIdx]) loops[lIdx] = [];
            loops[lIdx].push(n);
          });
          
          const validLoops = loops.filter(l => l && l.length > 0);

          if (validLoops.length === 0) {
            if (reqId !== aiRequestCountRef.current) return;
            const emptyMsg = { score: null, message: latestTRef.current.audioQuietMsg, expression: "neutral" };
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], emptyMsg]);
            } else {
              setEvaluations([emptyMsg]);
            }
            setIsAnalyzing(false);
            return;
          }

                    const allLoopsData = validLoops.map((loopNotes, index) => {
            return {
              loop: index + 1,
              score: calculateScore(loopNotes),
              notes: loopNotes.map(n => ({ chord: n.currentChord, note: n.noteName, degree: n.degree }))
            };
          });

          if (false) { // Disabled env check on client
            const noKeyEvals = allLoopsData.map(d => ({
              score: d.score,
              message: `${d.loop}周目のスコアは${d.score}点だ。APIキーが{T.notSet}みたいだな。`,
              expression: 'point'
            }));
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...noKeyEvals]);
            } else {
              setEvaluations(noKeyEvals);
            }
            setIsAnalyzing(false);
            return;
          }

          console.log('[DEBUG Phase 8.6] Sending to Gemini API route:', JSON.stringify(allLoopsData, null, 2));
          try {
            const response = await fetch('/api/gemini', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'evaluate', payload: allLoopsData, language: latestLangRef.current })
            });
            if (!response.ok) throw new Error('API Error');
            const dataArray = await response.json();
            if (reqId !== aiRequestCountRef.current) return;
            
            const parsedArray = Array.isArray(dataArray) ? dataArray : (dataArray.evaluations || [dataArray]);
            
            const finalEvals = allLoopsData.map((d, i) => {
              const resObj = parsedArray[i] || parsedArray[parsedArray.length - 1] || {};
              return {
                score: d.score,
                message: resObj.message || `${i+1}周目も悪くないぜ。`,
                expression: ['neutral', 'smile', 'think', 'point'].includes(resObj.expression) ? resObj.expression : 'neutral'
              };
            });
            
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...finalEvals]);
            } else {
              setEvaluations(finalEvals);
            }
          } catch (apiErr) {
            console.error("[Front-end Error Details]:", apiErr);
            if (reqId !== aiRequestCountRef.current) return;
            const fallbackEvals = allLoopsData.map(d => ({
              score: d.score,
              message: latestTRef.current.evalLoopError(d.loop),
              expression: 'neutral'
            }));
            if (wasAutoStopped) {
              setEvaluations(prev => [prev[0], ...fallbackEvals]);
            } else {
              setEvaluations(fallbackEvals);
            }
          }

          setIsAnalyzing(false);
        } catch (err) {
          console.error("[Front-end Error Details]:", err);
          if (reqId !== aiRequestCountRef.current) return;
          setEvaluations([{ score: null, message: T.evalError, expression: "neutral" }]);
          setIsAnalyzing(false);
        }
      };
      
      mediaRecorder.start();
      recordingDriftRef.current = Math.max(0, nextNoteTimeRef.current - ctx.currentTime);

      const durationMs = (60 / BPM) * 4 * 16 * 1000;
      autoStopTimerRef.current = window.setTimeout(() => {
        isAutoStoppedRef.current = true;
        stopAudio();
      }, durationMs);

      const scheduleAheadTime = 0.1; 
      nextNoteTimeRef.current = ctx.currentTime + 0.1;

      schedulerTimerRef.current = window.setInterval(() => {
        if (!audioContextRef.current) return;
        const currentCtxTime = audioContextRef.current.currentTime;
        
        while (nextNoteTimeRef.current < currentCtxTime + scheduleAheadTime) {
          const time = nextNoteTimeRef.current;
          const currentBeatInBar = beatCountRef.current % 4;
          const timeInProg = (beatCountRef.current * BEAT_DUR) % (BAR_DUR * 4);
          
          let playClick = false;
          if (metronomeMode === 'on-beat') playClick = true;
          else if (metronomeMode === 'off-beat' && (currentBeatInBar === 1 || currentBeatInBar === 3)) playClick = true;
          else if (metronomeMode === '4-1' && currentBeatInBar === 0) playClick = true;

          if (playClick) {
            const osc = audioContextRef.current.createOscillator();
            const gain = audioContextRef.current.createGain();
            osc.frequency.value = currentBeatInBar === 0 ? 440 : 220;
            gain.gain.setValueAtTime(0.0, time);
            gain.gain.linearRampToValueAtTime(0.5, time + 0.005);
            gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
            osc.connect(gain);
            gain.connect(masterGainRef.current || audioContextRef.current.destination);
            osc.start(time);
            osc.stop(time + 0.05);
          }

          if (currentBeatInBar === 0) {
            const chord = getChordForTime(timeInProg, musicKey);
            playChord(time, chord, BAR_DUR, audioContextRef.current, masterGainRef.current || undefined);
          }

          beatCountRef.current++;
          nextNoteTimeRef.current += BEAT_DUR;
        }
      }, 25);

      setIsMonitoring(true);
    } catch (e) {
      console.error('Error starting audio', e);
    }
  }, [selectedDeviceId, stopAudio, metronomeMode, musicKey, latency]); // Removed language/T dependencies

  const hasMoreEvaluations = !isTyping && currentIndex < evaluations.length - 1;

  return (
    <div className="min-h-[100dvh] h-auto md:h-[100dvh] bg-bg-dark text-gray-200 font-sans flex flex-col relative overflow-x-hidden overflow-y-auto md:overflow-hidden">
      <div className="fixed inset-0 bg-[url('/back.png')] bg-cover bg-center pointer-events-none z-0 opacity-40" />
      
      <main className="max-w-7xl mx-auto w-full px-2 md:px-4 py-2 md:py-4 flex flex-col flex-1 relative z-10 h-auto md:h-full">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-accent/20 pb-2 mb-2 md:pb-3 md:mb-3 shrink-0 relative">
          <div className="flex items-baseline gap-2 md:gap-4">
            <h1 className="font-serif text-accent text-xl md:text-3xl italic tracking-wide m-0">
              🎵 {T.appTitle}
            </h1>
            <p className="text-gray-400 text-xs md:text-sm m-0 hidden md:block">{T.appSubtitle}</p>
          </div>
          
          <div className="absolute right-0 top-0 md:relative flex items-center gap-3 md:gap-4">
            <button 
              onClick={() => setLanguage(prev => {
                const newLang = prev === 'ja' ? 'en' : 'ja';
                localStorage.setItem('app_language', newLang);
                return newLang;
              })}
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
        </header>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4 flex-1 min-h-0">
          
          <div className="col-span-1 md:col-span-7 lg:col-span-8 relative w-full h-[400px] min-h-[350px] md:h-full">
            
            {/* LIVE Indicator */}
            {isMonitoring && (
              <div className="absolute top-2 left-2 md:top-4 md:left-4 bg-black/60 px-2 py-1 md:px-3 md:py-1.5 rounded-full flex items-center gap-1.5 md:gap-2 text-[10px] md:text-xs font-bold text-white border border-white/10 backdrop-blur-md z-30">
                <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-red-dot rounded-full pulse-dot"></div>
                {T.liveIndicator}
              </div>
            )}

            {/* Master Image */}
            
            {countdown !== null && countdown > 0 && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-center justify-center rounded-xl overflow-hidden">
                <div key={countdown} className="text-[12rem] text-accent font-serif animate-bounce drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] leading-none select-none pointer-events-none">
                  {countdown}
                </div>
              </div>
            )}
{/* Master Image & Chat Bubble Wrapper */}
            <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-full h-[85%] max-w-3xl flex justify-center items-end">
              <div className="relative h-full w-full flex justify-center">
                <img 
                  src={`/master_${currentEval?.expression || 'neutral'}.png`} 
                  alt="Master" 
                  className="h-full w-auto object-contain z-10 drop-shadow-2xl pointer-events-none"
                />

                {/* Chat Bubble overlay */}
                <div 
                  className={`absolute bottom-4 md:bottom-12 left-1/2 -translate-x-1/2 w-[95%] md:w-11/12 bg-black/80 backdrop-blur-md border border-gray-600 rounded-xl p-6 md:p-8 shadow-xl z-20 ${
                    hasMoreEvaluations ? 'cursor-pointer hover:bg-black/90 transition-colors' : ''
                  }`}
                  onClick={handleBubbleClick}
                >
                  <div className="absolute -top-4 left-6 md:left-8 bg-gray-900 border border-gray-600 px-3 py-1 rounded-lg text-accent text-[10px] md:text-xs font-bold">
                    {T.masterLabel}
                  </div>
                  <div className="text-gray-100 text-sm md:text-lg leading-relaxed font-medium min-h-[5rem] md:min-h-[7rem] whitespace-pre-wrap select-none">
                    {displayedMsg.split(/\\n|\n/).map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        <br />
                      </React.Fragment>
                    ))}
                  </div>
                  
                  {/* ▼ Tap to Continue Indicator */}
                  {hasMoreEvaluations && (
                    <div className="absolute bottom-4 right-6 text-accent animate-bounce text-xl md:text-2xl drop-shadow-[0_0_8px_rgba(255,215,0,0.8)] select-none pointer-events-none">
                      ▼
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-5 lg:col-span-4 flex flex-col min-h-[400px] md:h-full md:min-h-0 md:overflow-hidden">
            <div className="bg-panel backdrop-blur-xl rounded-xl border border-border-dark p-3 md:p-4 flex flex-col gap-2 md:gap-3 shadow-2xl flex-1 md:h-full md:custom-scrollbar md:overflow-y-auto">
              
              <h2 className="text-accent text-[10px] md:text-xs font-bold flex items-center gap-2 uppercase tracking-widest border-b border-accent/20 pb-1.5 m-0">
                👤 {T.userMenu}
              </h2>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label htmlFor="key-select" className="text-[10px] md:text-xs text-gray-400">{T.keySetting}</label>
                <select id="key-select"
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
                <label htmlFor="device-select" className="text-[10px] md:text-xs text-gray-400">{T.inputDevice}</label>
                <select id="device-select"
                  value={selectedDeviceId} 
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg outline-none focus:border-accent truncate text-xs md:text-sm"
                >
                  <option value="" disabled>{T.selectDevice}</option>
                  {devices.map((d: MediaDeviceInfo) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Device ${d.deviceId.slice(0, 5)}`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="latency-input" className="text-[10px] md:text-xs text-gray-400">{T.latencyCalib}</label>
                  <button onClick={runCalibration} disabled={isMonitoring || isCalibrating} className="text-[9px] md:text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded hover:bg-accent/40 disabled:opacity-50 border border-accent/50">
                    {isCalibrating ? `測定中... (${calibrationStep}/4)` : '測定'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input id="latency-input" type="text" value={latency !== null ? latency : '未設定'} disabled readOnly className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg w-full text-center text-xs md:text-sm" />
                </div>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label htmlFor="metronome-select" className="text-[10px] md:text-xs text-gray-400">{T.metronome}</label>
                <select id="metronome-select"
                  value={metronomeMode} 
                  onChange={(e) => setMetronomeMode(e.target.value as any)}
                  disabled={isMonitoring}
                  className="bg-black/50 border border-border-dark text-white p-1.5 md:p-2 rounded-lg outline-none focus:border-accent text-xs md:text-sm"
                >
                  <option value="off">{T.metroOff}</option>
                  <option value="on-beat">{T.metroOnBeat}</option>
                  <option value="off-beat">{T.metroOffBeat}</option>
                  <option value="4-1">{T.metro41}</option>
                </select>
              </div>

              <div className="flex flex-col gap-1 md:gap-1.5">
                <label className="text-[10px] md:text-xs text-gray-400">{T.chordProgression}</label>
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
                        {evaluations.length > 1 ? T.loopScore(currentIndex + 1) : T.totalScore}
                      </div>
                      <div className="text-3xl md:text-4xl font-serif text-accent">{currentEval.score}</div>
                    </div>
                  ) : <div className="flex-1" />}
                  
                  {theoryNotesState.length > 0 && !isMonitoring && !isAnalyzing ? (
                    <button onClick={exportMidi} className="w-full py-1.5 rounded-lg border border-accent/50 text-accent hover:bg-accent/10 text-[10px] md:text-xs transition-colors animate-in fade-in duration-300">
                      💾 {T.midiDownload}
                    </button>
                  ) : null}
                </div>

                <button 
                  className={`w-full py-2.5 md:py-3 rounded-full font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all border shrink-0 ${
                    isMonitoring || countdown !== null
                      ? 'bg-transparent border-red-dot text-red-dot hover:bg-red-dot/10' 
                      : 'bg-transparent border-border-dark text-white hover:border-accent hover:bg-accent/10'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
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
                >
                  {isMonitoring ? (
                    <><div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-dot"></div> {T.stopRecording}</>
                  ) : countdown !== null ? (
                    <>{T.preparing}</>
                  ) : (
                    <><div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${isAnalyzing ? 'bg-gray-500' : 'bg-red-dot pulse-dot'}`}></div> {isAnalyzing ? T.analyzing : T.startRecording}</>
                  )}
                </button>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Chat Input */}
        <div className="mt-2 md:mt-3 mb-4 md:mb-0 bg-panel backdrop-blur-md border border-border-dark rounded-xl p-2 md:p-3 flex items-center gap-2 md:gap-3 shadow-lg shrink-0">
          <span className="text-accent text-lg md:text-xl">🎤</span>
          <input 
            type="text" 
            placeholder={T.chatPlaceholder} 
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleChat()}
            className="bg-transparent border-none text-white outline-none flex-1 text-xs md:text-sm placeholder-gray-500" 
          />
          <button 
            onClick={handleChat}
            disabled={!chatInput.trim()} 
            className="text-gray-500 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" /></svg>
          </button>
        </div>
        
        {/* Footer */}
        <footer className="mt-4 mb-2 text-center md:absolute md:bottom-2 md:left-1/2 md:-translate-x-1/2 md:mt-0 md:mb-0 text-[10px] md:text-xs text-gray-500 hover:text-gray-300 transition-colors z-50 w-full md:w-auto">
          <a href="https://note.com/jazzy_begin" target="_blank" rel="noopener noreferrer">
            {T.footerCopyright}
          </a>
        </footer>
      </main>
      {/* Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity" onClick={() => setIsHelpOpen(false)} />
          <div className="relative bg-panel border border-border-dark rounded-xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-in fade-in zoom-in-95 duration-200 custom-scrollbar overflow-y-auto max-h-[85vh]">
            <button 
              onClick={() => setIsHelpOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-accent transition-colors"
              aria-label="ヘルプを閉じる"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <h2 className="text-accent text-lg md:text-xl font-bold border-b border-accent/20 pb-2 mb-4 font-serif">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
