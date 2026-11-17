// GENERATED from frontend/src/services/demo/yamnetFeatures.ts by backend/scripts/sync-inference.sh — do not edit.
import { fft } from "./mfccExtractor.js";
const YAMNET_SAMPLE_RATE = 16e3;
const PATCH_FRAMES = 96;
const PATCH_BANDS = 64;
const WINDOW = 400;
const HOP = 160;
const FFT_SIZE = 512;
const PATCH_HOP = 48;
const MEL_MIN_HZ = 125;
const MEL_MAX_HZ = 7500;
const LOG_OFFSET = 1e-3;
let melMatrixCache = null;
let windowCache = null;
const hzToMel = (hz) => 1127 * Math.log(1 + hz / 700);
function melMatrix() {
  if (melMatrixCache) return melMatrixCache;
  const bins = FFT_SIZE / 2 + 1;
  const nyquist = YAMNET_SAMPLE_RATE / 2;
  const lo = hzToMel(MEL_MIN_HZ);
  const hi = hzToMel(MEL_MAX_HZ);
  const edges = Array.from({ length: PATCH_BANDS + 2 }, (_, i) => lo + i * (hi - lo) / (PATCH_BANDS + 1));
  melMatrixCache = Array.from({ length: PATCH_BANDS }, (_, m) => {
    const row = new Float64Array(bins);
    for (let k = 1; k < bins; k++) {
      const mel = hzToMel(k * nyquist / (bins - 1));
      const lower = (mel - edges[m]) / (edges[m + 1] - edges[m]);
      const upper = (edges[m + 2] - mel) / (edges[m + 2] - edges[m + 1]);
      row[k] = Math.max(0, Math.min(lower, upper));
    }
    return row;
  });
  return melMatrixCache;
}
function hannWindow() {
  if (windowCache) return windowCache;
  windowCache = Float64Array.from({ length: WINDOW }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WINDOW));
  return windowCache;
}
const RS_HALF_WIDTH = 16;
const RS_CUTOFF = 0.9;
const RS_TABLE_RES = 256;
let rsTable = null;
function besselI0(x) {
  let sum = 1;
  let term = 1;
  for (let k = 1; k < 30; k++) {
    term *= (x / (2 * k)) ** 2;
    sum += term;
  }
  return sum;
}
function resampleTable() {
  if (rsTable) return rsTable;
  const t = new Float64Array(RS_HALF_WIDTH * RS_TABLE_RES + 2);
  const beta = 6;
  const norm = besselI0(beta);
  for (let i = 0; i < t.length; i++) {
    const x = i / RS_TABLE_RES;
    const r = x / RS_HALF_WIDTH;
    if (r >= 1) break;
    const sinc = x === 0 ? 1 : Math.sin(Math.PI * RS_CUTOFF * x) / (Math.PI * RS_CUTOFF * x);
    t[i] = RS_CUTOFF * sinc * (besselI0(beta * Math.sqrt(1 - r * r)) / norm);
  }
  rsTable = t;
  return t;
}
function toYamnetRate(samples, sampleRate) {
  if (sampleRate === YAMNET_SAMPLE_RATE) return samples;
  const table = resampleTable();
  const ratio = YAMNET_SAMPLE_RATE / sampleRate;
  const scale = Math.min(1, ratio);
  const halfWidthIn = RS_HALF_WIDTH / scale;
  const out = new Float64Array(Math.ceil(samples.length * ratio));
  for (let i = 0; i < out.length; i++) {
    const u = i / ratio;
    const first = Math.max(0, Math.ceil(u - halfWidthIn));
    const last = Math.min(samples.length - 1, Math.floor(u + halfWidthIn));
    let sum = 0;
    for (let n = first; n <= last; n++) {
      const pos = Math.abs(u - n) * scale * RS_TABLE_RES;
      const idx = Math.floor(pos);
      sum += samples[n] * (table[idx] + (pos - idx) * (table[idx + 1] - table[idx]));
    }
    out[i] = sum * scale;
  }
  return out;
}
function yamnetPatches(wave16k) {
  const minSamples = Math.round((0.96 + 0.025 - 0.01) * YAMNET_SAMPLE_RATE);
  const hopSamples = Math.round(0.48 * YAMNET_SAMPLE_RATE);
  const n = Math.max(wave16k.length, minSamples);
  const padded = new Float64Array(minSamples + Math.ceil((n - minSamples) / hopSamples) * hopSamples);
  for (let i = 0; i < wave16k.length; i++) padded[i] = Math.max(-1, Math.min(1, wave16k[i]));
  const window = hannWindow();
  const mel = melMatrix();
  const numFrames = 1 + Math.floor((padded.length - WINDOW) / HOP);
  const logMel = new Float32Array(numFrames * PATCH_BANDS);
  const re = new Float64Array(FFT_SIZE);
  const im = new Float64Array(FFT_SIZE);
  const mag = new Float64Array(FFT_SIZE / 2 + 1);
  for (let f = 0; f < numFrames; f++) {
    re.fill(0);
    im.fill(0);
    for (let i = 0; i < WINDOW; i++) re[i] = padded[f * HOP + i] * window[i];
    fft(re, im);
    for (let k = 0; k < mag.length; k++) mag[k] = Math.hypot(re[k], im[k]);
    for (let m = 0; m < PATCH_BANDS; m++) {
      let sum = 0;
      const row = mel[m];
      for (let k = 0; k < mag.length; k++) sum += mag[k] * row[k];
      logMel[f * PATCH_BANDS + m] = Math.log(sum + LOG_OFFSET);
    }
  }
  const numPatches = numFrames < PATCH_FRAMES ? 0 : 1 + Math.floor((numFrames - PATCH_FRAMES) / PATCH_HOP);
  const data = new Float32Array(numPatches * PATCH_FRAMES * PATCH_BANDS);
  for (let p = 0; p < numPatches; p++) {
    data.set(logMel.subarray(p * PATCH_HOP * PATCH_BANDS, (p * PATCH_HOP + PATCH_FRAMES) * PATCH_BANDS), p * PATCH_FRAMES * PATCH_BANDS);
  }
  return { data, numPatches };
}
export {
  PATCH_BANDS,
  PATCH_FRAMES,
  YAMNET_SAMPLE_RATE,
  toYamnetRate,
  yamnetPatches
};
