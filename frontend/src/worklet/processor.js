// AudioWorklet processor loading WASM

import './polyfill.js';
import init, { AudioProcessor } from '../../public/pkg/wasm_audio.js';

class Phase1Processor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.wasmReady = false;
    this.processor = null;
    this.lastPostTime = currentTime;

    this.port.onmessageerror = (e) => {
      console.error('[WORKLET DIAG] messageerror on worklet port:', e);
    };

    this.port.onmessage = async (e) => {
      console.log('[WORKLET DIAG] message received:', e.data.type);
      if (e.data.type === 'INIT_WASM') {
        try {
          const wasmModule = await WebAssembly.compile(e.data.wasmBuffer);
          await init(wasmModule);
          console.log('[WORKLET DIAG] init() succeeded');
          this.processor = new AudioProcessor(128, sampleRate);
          this.wasmReady = true;
          this.port.postMessage({ type: 'WASM_READY' });
        } catch (err) {
          console.error("Failed to initialize WASM in worklet", err);
        }
      }
    };
  }

  process(inputs, outputs, parameters) {
    if (!this._procCount) this._procCount = 0;
    if (this._procCount < 3) {
      console.log('[WORKLET DIAG] process() called, wasmReady:', this.wasmReady);
      this._procCount++;
    }
    if (!this.wasmReady || !this.processor) return true;

    const input = inputs[0];
    if (!input || input.length === 0 || !input[0]) return true;

    const channelData = input[0];

    // Pass data to Rust WASM
    this.processor.process(channelData);

    // Retrieve computed values from WASM
    const rms = this.processor.get_rms();
    const peak = this.processor.get_peak();
    const onsetIdx = this.processor.get_onset_index();
    const pitch = this.processor.get_pitch();

    if (onsetIdx >= 0) {
      const exactTime = currentTime + (onsetIdx / sampleRate);
      
      this.port.postMessage({
        type: 'ONSET',
        time: exactTime
      });
    }

    // Throttle UI updates to roughly 60fps (every ~16ms)
    if (currentTime - this.lastPostTime >= 0.016) {
      this.port.postMessage({
        type: 'LEVELS',
        rms: rms,
        peak: peak
      });
      
      if (pitch > 0) {
        const midi = Math.round(12 * Math.log2(pitch / 440.0) + 69);
        const notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
        const octave = Math.floor(midi / 12) - 1;
        const noteName = `${notes[midi % 12]}${octave}`;
        
        this.port.postMessage({
          type: 'PITCH',
          hz: pitch,
          midi: midi,
          noteName: noteName
        });
      }
      
      this.lastPostTime = currentTime;
    }

    return true;
  }
}

registerProcessor('phase1-processor', Phase1Processor);
