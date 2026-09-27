// AudioWorkletGlobalScope lacks TextEncoder and TextDecoder in many browsers.
// wasm-bindgen generated JS requires them, so we provide a minimal polyfill.
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
            if (!arr) return '';
            let str = '';
            for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i]);
            return str;
        }
    };
}
