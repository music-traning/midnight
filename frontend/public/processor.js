"use strict";
(() => {
  // src/worklet/polyfill.js
  if (typeof TextEncoder === "undefined") {
    globalThis.TextEncoder = class TextEncoder {
      encode(str) {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) arr[i] = str.charCodeAt(i);
        return arr;
      }
    };
  }
  if (typeof TextDecoder === "undefined") {
    globalThis.TextDecoder = class TextDecoder {
      decode(arr) {
        if (!arr) return "";
        let str = "";
        for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
        return str;
      }
    };
  }

  // public/pkg/wasm_audio.js
  var import_meta = {};
  var AudioProcessor = class {
    __destroy_into_raw() {
      const ptr = this.__wbg_ptr;
      this.__wbg_ptr = 0;
      AudioProcessorFinalization.unregister(this);
      return ptr;
    }
    free() {
      const ptr = this.__destroy_into_raw();
      wasm.__wbg_audioprocessor_free(ptr, 0);
    }
    /**
     * @returns {number}
     */
    get_onset_index() {
      const ret = wasm.audioprocessor_get_onset_index(this.__wbg_ptr);
      return ret;
    }
    /**
     * @returns {number}
     */
    get_peak() {
      const ret = wasm.audioprocessor_get_peak(this.__wbg_ptr);
      return ret;
    }
    /**
     * @returns {number}
     */
    get_pitch() {
      const ret = wasm.audioprocessor_get_pitch(this.__wbg_ptr);
      return ret;
    }
    /**
     * @returns {number}
     */
    get_rms() {
      const ret = wasm.audioprocessor_get_rms(this.__wbg_ptr);
      return ret;
    }
    /**
     * @param {number} buffer_size
     * @param {number} sample_rate
     */
    constructor(buffer_size, sample_rate) {
      const ret = wasm.audioprocessor_new(buffer_size, sample_rate);
      this.__wbg_ptr = ret;
      AudioProcessorFinalization.register(this, this.__wbg_ptr, this);
      return this;
    }
    /**
     * @param {Float32Array} input
     */
    process(input) {
      const ptr0 = passArrayF32ToWasm0(input, wasm.__wbindgen_malloc);
      const len0 = WASM_VECTOR_LEN;
      wasm.audioprocessor_process(this.__wbg_ptr, ptr0, len0);
    }
  };
  if (Symbol.dispose) AudioProcessor.prototype[Symbol.dispose] = AudioProcessor.prototype.free;
  function __wbg_get_imports() {
    const import0 = {
      __proto__: null,
      __wbg___wbindgen_throw_41e9ee4f547fc59a: function(arg0, arg1) {
        throw new Error(getStringFromWasm0(arg0, arg1));
      },
      __wbindgen_init_externref_table: function() {
        const table = wasm.__wbindgen_externrefs;
        const offset = table.grow(4);
        table.set(0, void 0);
        table.set(offset + 0, void 0);
        table.set(offset + 1, null);
        table.set(offset + 2, true);
        table.set(offset + 3, false);
      }
    };
    return {
      __proto__: null,
      "./wasm_audio_bg.js": import0
    };
  }
  var AudioProcessorFinalization = typeof FinalizationRegistry === "undefined" ? { register: () => {
  }, unregister: () => {
  } } : new FinalizationRegistry((ptr) => wasm.__wbg_audioprocessor_free(ptr, 1));
  var cachedFloat32ArrayMemory0 = null;
  function getFloat32ArrayMemory0() {
    if (cachedFloat32ArrayMemory0 === null || cachedFloat32ArrayMemory0.byteLength === 0) {
      cachedFloat32ArrayMemory0 = new Float32Array(wasm.memory.buffer);
    }
    return cachedFloat32ArrayMemory0;
  }
  function getStringFromWasm0(ptr, len) {
    return decodeText(ptr >>> 0, len);
  }
  var cachedUint8ArrayMemory0 = null;
  function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
      cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
  }
  function passArrayF32ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 4, 4) >>> 0;
    getFloat32ArrayMemory0().set(arg, ptr / 4);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
  }
  var cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
  cachedTextDecoder.decode();
  var MAX_SAFARI_DECODE_BYTES = 2146435072;
  var numBytesDecoded = 0;
  function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
      cachedTextDecoder = new TextDecoder("utf-8", { ignoreBOM: true, fatal: true });
      cachedTextDecoder.decode();
      numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
  }
  var WASM_VECTOR_LEN = 0;
  var wasmModule;
  var wasmInstance;
  var wasm;
  function __wbg_finalize_init(instance, module) {
    wasmInstance = instance;
    wasm = instance.exports;
    wasmModule = module;
    cachedFloat32ArrayMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
  }
  async function __wbg_load(module, imports) {
    if (typeof Response === "function" && module instanceof Response) {
      if (!module.ok) {
        throw new Error(`failed to fetch Wasm: ${module.status} ${module.statusText} fetching '${module.url}'`);
      }
      if (typeof WebAssembly.instantiateStreaming === "function") {
        try {
          return await WebAssembly.instantiateStreaming(module, imports);
        } catch (e) {
          const validResponse = expectedResponseType(module.type);
          if (validResponse && module.headers.get("Content-Type") !== "application/wasm") {
            console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);
          } else {
            throw e;
          }
        }
      }
      const bytes = await module.arrayBuffer();
      return await WebAssembly.instantiate(bytes, imports);
    } else {
      const instance = await WebAssembly.instantiate(module, imports);
      if (instance instanceof WebAssembly.Instance) {
        return { instance, module };
      } else {
        return instance;
      }
    }
    function expectedResponseType(type) {
      switch (type) {
        case "basic":
        case "cors":
        case "default":
          return true;
      }
      return false;
    }
  }
  async function __wbg_init(module_or_path) {
    if (wasm !== void 0) return wasm;
    if (module_or_path !== void 0) {
      if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
        ({ module_or_path } = module_or_path);
      } else {
        console.warn("using deprecated parameters for the initialization function; pass a single object instead");
      }
    }
    if (module_or_path === void 0) {
      module_or_path = new URL("wasm_audio_bg.wasm", import_meta.url);
    }
    const imports = __wbg_get_imports();
    if (typeof module_or_path === "string" || typeof Request === "function" && module_or_path instanceof Request || typeof URL === "function" && module_or_path instanceof URL) {
      module_or_path = fetch(module_or_path);
    }
    const { instance, module } = await __wbg_load(await module_or_path, imports);
    return __wbg_finalize_init(instance, module);
  }

  // src/worklet/processor.js
  var Phase1Processor = class extends AudioWorkletProcessor {
    constructor() {
      super();
      this.wasmReady = false;
      this.processor = null;
      this.lastPostTime = currentTime;
      this.port.onmessageerror = (e) => {
        console.error("[WORKLET DIAG] messageerror on worklet port:", e);
      };
      this.port.onmessage = async (e) => {
        console.log("[WORKLET DIAG] message received:", e.data.type);
        if (e.data.type === "INIT_WASM") {
          try {
            const wasmModule2 = await WebAssembly.compile(e.data.wasmBuffer);
            await __wbg_init(wasmModule2);
            console.log("[WORKLET DIAG] init() succeeded");
            this.processor = new AudioProcessor(128, sampleRate);
            this.wasmReady = true;
            this.port.postMessage({ type: "WASM_READY" });
          } catch (err) {
            console.error("Failed to initialize WASM in worklet", err);
          }
        }
      };
    }
    process(inputs, outputs, parameters) {
      if (!this._procCount) this._procCount = 0;
      if (this._procCount < 3) {
        console.log("[WORKLET DIAG] process() called, wasmReady:", this.wasmReady);
        this._procCount++;
      }
      if (!this.wasmReady || !this.processor) return true;
      const input = inputs[0];
      if (!input || input.length === 0 || !input[0]) return true;
      const channelData = input[0];
      this.processor.process(channelData);
      const rms = this.processor.get_rms();
      const peak = this.processor.get_peak();
      const onsetIdx = this.processor.get_onset_index();
      const pitch = this.processor.get_pitch();
      if (onsetIdx >= 0) {
        const exactTime = currentTime + onsetIdx / sampleRate;
        this.port.postMessage({
          type: "ONSET",
          time: exactTime
        });
      }
      if (currentTime - this.lastPostTime >= 0.016) {
        this.port.postMessage({
          type: "LEVELS",
          rms,
          peak
        });
        if (pitch > 0) {
          const midi = Math.round(12 * Math.log2(pitch / 440) + 69);
          const notes = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "G#", "A", "Bb", "B"];
          const octave = Math.floor(midi / 12) - 1;
          const noteName = `${notes[midi % 12]}${octave}`;
          this.port.postMessage({
            type: "PITCH",
            hz: pitch,
            midi,
            noteName
          });
        }
        this.lastPostTime = currentTime;
      }
      return true;
    }
  };
  registerProcessor("phase1-processor", Phase1Processor);
})();
