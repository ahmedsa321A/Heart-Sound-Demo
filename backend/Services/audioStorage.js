/**
 * Compact copy of a recording for storage (and future model training): mono, first 30 s,
 * 4 kHz, 16-bit WAV — about 240 KB instead of ~3 MB for a 48 kHz upload. 4 kHz keeps everything
 * up to 2 kHz, well above the 20-480 Hz band the model uses.
 */
export const STORAGE_SAMPLE_RATE = 4000;
const MAX_SECONDS = 30;

// Light anti-aliasing filter: Kaiser-windowed sinc, ±16 output samples. Much cheaper than the
// model's resampler; plenty for storage since training resamples to 1 kHz and bandpasses at 480 Hz.
const HALF_WIDTH = 16;
const CUTOFF = 0.9;
const BETA = 6;
const TABLE_RES = 256;

const besselI0 = (x) => {
    let sum = 1;
    let term = 1;
    for (let k = 1; k < 30; k++) {
        term *= (x / (2 * k)) ** 2;
        sum += term;
    }
    return sum;
};

const table = (() => {
    const t = new Float64Array(HALF_WIDTH * TABLE_RES + 2);
    const norm = besselI0(BETA);
    for (let i = 0; i < t.length; i++) {
        const x = i / TABLE_RES;
        const r = x / HALF_WIDTH;
        if (r >= 1) break;
        const sinc = x === 0 ? 1 : Math.sin(Math.PI * CUTOFF * x) / (Math.PI * CUTOFF * x);
        t[i] = CUTOFF * sinc * (besselI0(BETA * Math.sqrt(1 - r * r)) / norm);
    }
    return t;
})();

function downsample(signal, origSr, targetSr) {
    const ratio = targetSr / origSr;
    const halfWidthIn = HALF_WIDTH / ratio;
    const out = new Float64Array(Math.ceil(signal.length * ratio));
    for (let i = 0; i < out.length; i++) {
        const u = i / ratio;
        const first = Math.max(0, Math.ceil(u - halfWidthIn));
        const last = Math.min(signal.length - 1, Math.floor(u + halfWidthIn));
        let sum = 0;
        for (let n = first; n <= last; n++) {
            const pos = Math.abs(u - n) * ratio * TABLE_RES;
            const idx = Math.floor(pos);
            sum += signal[n] * (table[idx] + (pos - idx) * (table[idx + 1] - table[idx]));
        }
        out[i] = sum * ratio;
    }
    return out;
}

/** @param {{samples: Float64Array, sampleRate: number}} audio - decoded mono audio */
export function toStorageWav({ samples, sampleRate }) {
    let signal = samples.subarray(0, Math.min(samples.length, Math.floor(MAX_SECONDS * sampleRate)));
    let sr = sampleRate;
    if (sr > STORAGE_SAMPLE_RATE) {
        signal = downsample(signal, sr, STORAGE_SAMPLE_RATE);
        sr = STORAGE_SAMPLE_RATE;
    }

    const wav = Buffer.alloc(44 + signal.length * 2);
    wav.write('RIFF', 0);
    wav.writeUInt32LE(36 + signal.length * 2, 4);
    wav.write('WAVEfmt ', 8);
    wav.writeUInt32LE(16, 16);      // fmt chunk size
    wav.writeUInt16LE(1, 20);       // PCM
    wav.writeUInt16LE(1, 22);       // mono
    wav.writeUInt32LE(sr, 24);
    wav.writeUInt32LE(sr * 2, 28);  // byte rate
    wav.writeUInt16LE(2, 32);       // block align
    wav.writeUInt16LE(16, 34);      // bits per sample
    wav.write('data', 36);
    wav.writeUInt32LE(signal.length * 2, 40);
    for (let i = 0; i < signal.length; i++) {
        wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, signal[i])) * 32767), 44 + i * 2);
    }
    return { wav, sampleRate: sr, durationSec: signal.length / sr };
}
