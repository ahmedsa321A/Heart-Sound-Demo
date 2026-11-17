// GENERATED from frontend/src/services/demo/mfccExtractor.ts by backend/scripts/sync-inference.sh — do not edit.
const SR = 1e3;
const SEGMENT_SEC = 2;
const SEGMENT_OVERLAP = 0.5;
const N_MFCC = 40;
const N_MELS = 40;
const N_FFT = 512;
const WIN_LENGTH = 256;
const HOP_LENGTH = 64;
const MAX_TIME_STEPS = 32;
const OPTIMAL_THRESHOLD = 0.58;
const MAX_DURATION_SEC = 30;
const MIN_RMS_THRESHOLD = 15e-4;
const MIN_LOW_FREQ_ENERGY_RATIO = 0.25;
const MAX_HIGH_FREQ_ENERGY_RATIO = 0.4;
const WAVE_FORMAT_PCM = 1;
const WAVE_FORMAT_IEEE_FLOAT = 3;
const WAVE_FORMAT_EXTENSIBLE = 65534;
function readWav(buffer) {
  const data = new DataView(buffer);
  const tag = (o) => String.fromCharCode(data.getUint8(o), data.getUint8(o + 1), data.getUint8(o + 2), data.getUint8(o + 3));
  if (data.byteLength < 12 || tag(0) !== "RIFF" || tag(8) !== "WAVE") {
    throw new Error("Not a valid WAV file");
  }
  let offset = 12;
  let format = WAVE_FORMAT_PCM;
  let sampleRate = 44100;
  let numChannels = 1;
  let bitsPerSample = 16;
  let dataOffset = 0;
  let dataSize = 0;
  while (offset < data.byteLength - 8) {
    const chunkId = tag(offset);
    const chunkSize = data.getUint32(offset + 4, true);
    if (chunkId === "fmt ") {
      format = data.getUint16(offset + 8, true);
      numChannels = data.getUint16(offset + 10, true);
      sampleRate = data.getUint32(offset + 12, true);
      bitsPerSample = data.getUint16(offset + 22, true);
      if (format === WAVE_FORMAT_EXTENSIBLE && chunkSize >= 40) format = data.getUint16(offset + 32, true);
    } else if (chunkId === "data") {
      dataOffset = offset + 8;
      dataSize = Math.min(chunkSize, data.byteLength - dataOffset);
      break;
    }
    offset += 8 + chunkSize + chunkSize % 2;
  }
  if (dataOffset === 0) throw new Error("No data chunk found in WAV file");
  const isFloat = format === WAVE_FORMAT_IEEE_FLOAT;
  if (isFloat ? ![32, 64].includes(bitsPerSample) : format !== WAVE_FORMAT_PCM || ![8, 16, 24, 32].includes(bitsPerSample)) {
    throw new Error(`Unsupported WAV encoding: format ${format}, ${bitsPerSample}-bit`);
  }
  const bytesPerSample = bitsPerSample / 8;
  const totalFrames = Math.floor(dataSize / (bytesPerSample * numChannels));
  const mono = new Float64Array(totalFrames);
  const readSample = (pos) => {
    if (isFloat) return bitsPerSample === 32 ? data.getFloat32(pos, true) : data.getFloat64(pos, true);
    switch (bitsPerSample) {
      case 8:
        return (data.getUint8(pos) - 128) / 128;
      case 16:
        return data.getInt16(pos, true) / 32768;
      case 24:
        return (data.getUint8(pos) | data.getUint8(pos + 1) << 8 | data.getInt8(pos + 2) << 16) / 8388608;
      default:
        return data.getInt32(pos, true) / 2147483648;
    }
  };
  for (let i = 0; i < totalFrames; i++) {
    let sum = 0;
    for (let ch = 0; ch < numChannels; ch++) sum += readSample(dataOffset + (i * numChannels + ch) * bytesPerSample);
    mono[i] = sum / numChannels;
  }
  return { samples: mono, sampleRate };
}
function removeDcOffset(signal) {
  let mean = 0;
  for (let i = 0; i < signal.length; i++) mean += signal[i];
  mean /= signal.length;
  const result = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) result[i] = signal[i] - mean;
  return result;
}
const RESAMPLE_HALF_WIDTH = 80;
const RESAMPLE_CUTOFF = 0.9565;
const RESAMPLE_KAISER_BETA = 10.06;
const RESAMPLE_TABLE_RES = 512;
let resampleTable = null;
function besselI0(x) {
  let sum = 1;
  let term = 1;
  for (let k = 1; k < 50; k++) {
    term *= (x / (2 * k)) ** 2;
    sum += term;
    if (term < sum * 1e-17) break;
  }
  return sum;
}
function getResampleTable() {
  if (resampleTable) return resampleTable;
  const size = RESAMPLE_HALF_WIDTH * RESAMPLE_TABLE_RES + 2;
  const table = new Float64Array(size);
  const i0Beta = besselI0(RESAMPLE_KAISER_BETA);
  for (let i = 0; i < size; i++) {
    const t = i / RESAMPLE_TABLE_RES;
    const r = t / RESAMPLE_HALF_WIDTH;
    if (r >= 1) break;
    const x = RESAMPLE_CUTOFF * t;
    const sinc = x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x);
    table[i] = RESAMPLE_CUTOFF * sinc * (besselI0(RESAMPLE_KAISER_BETA * Math.sqrt(1 - r * r)) / i0Beta);
  }
  resampleTable = table;
  return table;
}
function resample(signal, origSr, targetSr) {
  if (origSr === targetSr) return signal;
  const table = getResampleTable();
  const ratio = targetSr / origSr;
  const scale = Math.min(1, ratio);
  const halfWidthIn = RESAMPLE_HALF_WIDTH / scale;
  const outLen = Math.ceil(signal.length * ratio);
  const result = new Float64Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const u = i / ratio;
    const first = Math.max(0, Math.ceil(u - halfWidthIn));
    const last = Math.min(signal.length - 1, Math.floor(u + halfWidthIn));
    let sum = 0;
    for (let n = first; n <= last; n++) {
      const pos = Math.abs(u - n) * scale * RESAMPLE_TABLE_RES;
      const idx = Math.floor(pos);
      const frac = pos - idx;
      sum += signal[n] * (table[idx] + frac * (table[idx + 1] - table[idx]));
    }
    result[i] = sum * scale;
  }
  return result;
}
function normalizeAmplitude(signal, eps = 1e-8) {
  let maxAbs = 0;
  for (let i = 0; i < signal.length; i++) maxAbs = Math.max(maxAbs, Math.abs(signal[i]));
  if (maxAbs < eps) return signal;
  const result = new Float64Array(signal.length);
  for (let i = 0; i < signal.length; i++) result[i] = signal[i] / maxAbs;
  return result;
}
const cAdd = (a, b) => [a[0] + b[0], a[1] + b[1]];
const cSub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const cMul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cDiv = (a, b) => {
  const d = b[0] * b[0] + b[1] * b[1];
  return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cSqrt = (a) => {
  const r = Math.sqrt(Math.hypot(a[0], a[1]));
  const angle = Math.atan2(a[1], a[0]) / 2;
  return [r * Math.cos(angle), r * Math.sin(angle)];
};
function polyFromRoots(roots) {
  let poly = [[1, 0]];
  for (const root of roots) {
    const next = Array.from({ length: poly.length + 1 }, () => [0, 0]);
    for (let i = 0; i < poly.length; i++) {
      next[i] = cAdd(next[i], poly[i]);
      next[i + 1] = cSub(next[i + 1], cMul(poly[i], root));
    }
    poly = next;
  }
  return poly.map((c) => c[0]);
}
function butterBandpassCoefficients(low, high, fs, order) {
  const fs2 = 4;
  const nyq = fs / 2;
  const wl = fs2 * Math.tan(Math.PI * (low / nyq) / 2);
  const wh = fs2 * Math.tan(Math.PI * Math.min(high / nyq, 0.999) / 2);
  const bw = wh - wl;
  const w0Sq = wl * wh;
  const poles = [];
  for (let k = 0; k < order; k++) {
    const theta = Math.PI * (2 * k + 1 - order) / (2 * order);
    const proto = [-Math.cos(theta), -Math.sin(theta)];
    const half = cMul(proto, [bw / 2, 0]);
    const disc = cSqrt(cSub(cMul(half, half), [w0Sq, 0]));
    poles.push(cAdd(half, disc), cSub(half, disc));
  }
  let gain = bw ** order;
  let gainNum = [fs2 ** order, 0];
  let gainDen = [1, 0];
  for (const p of poles) gainDen = cMul(gainDen, cSub([fs2, 0], p));
  gain *= cDiv(gainNum, gainDen)[0];
  const digitalPoles = poles.map((p) => cDiv(cAdd([fs2, 0], p), cSub([fs2, 0], p)));
  const digitalZeros = [
    ...Array.from({ length: order }, () => [1, 0]),
    ...Array.from({ length: order }, () => [-1, 0])
  ];
  return {
    b: polyFromRoots(digitalZeros).map((v) => v * gain),
    a: polyFromRoots(digitalPoles)
  };
}
function lfilterZi(b, a) {
  const n = a.length - 1;
  const m = Array.from(
    { length: n },
    (_, i) => Array.from({ length: n }, (_2, j) => (i === j ? 1 : 0) - (j === 0 ? -a[i + 1] : j === i + 1 ? 1 : 0))
  );
  const rhs = Array.from({ length: n }, (_, i) => b[i + 1] - a[i + 1] * b[0]);
  for (let col = 0; col < n; col++) {
    let pivot = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(m[r][col]) > Math.abs(m[pivot][col])) pivot = r;
    [m[col], m[pivot]] = [m[pivot], m[col]];
    [rhs[col], rhs[pivot]] = [rhs[pivot], rhs[col]];
    for (let r = col + 1; r < n; r++) {
      const f = m[r][col] / m[col][col];
      for (let c = col; c < n; c++) m[r][c] -= f * m[col][c];
      rhs[r] -= f * rhs[col];
    }
  }
  const zi = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    let s = rhs[r];
    for (let c = r + 1; c < n; c++) s -= m[r][c] * zi[c];
    zi[r] = s / m[r][r];
  }
  return zi;
}
function lfilter(b, a, x, zi) {
  const n = a.length - 1;
  const z = zi.slice();
  const y = new Float64Array(x.length);
  for (let i = 0; i < x.length; i++) {
    const out = b[0] * x[i] + z[0];
    for (let k = 0; k < n - 1; k++) z[k] = b[k + 1] * x[i] + z[k + 1] - a[k + 1] * out;
    z[n - 1] = b[n] * x[i] - a[n] * out;
    y[i] = out;
  }
  return y;
}
function filtfilt(b, a, x) {
  const n = x.length;
  const padLen = Math.min(3 * Math.max(b.length, a.length), n - 1);
  const ext = new Float64Array(n + 2 * padLen);
  for (let i = 0; i < padLen; i++) ext[i] = 2 * x[0] - x[padLen - i];
  ext.set(x, padLen);
  for (let i = 0; i < padLen; i++) ext[padLen + n + i] = 2 * x[n - 1] - x[n - 2 - i];
  const zi = lfilterZi(b, a);
  const forward = lfilter(b, a, ext, zi.map((v) => v * ext[0]));
  forward.reverse();
  const backward = lfilter(b, a, forward, zi.map((v) => v * forward[0]));
  backward.reverse();
  return backward.slice(padLen, padLen + n);
}
let bandpassCache = null;
function butterworthBandpass(signal) {
  bandpassCache ??= butterBandpassCoefficients(20, 480, SR, 4);
  return filtfilt(bandpassCache.b, bandpassCache.a, signal);
}
function medianFilter(signal, kernelSize = 5) {
  const result = new Float64Array(signal.length);
  const half = Math.floor(kernelSize / 2);
  const window = new Float64Array(kernelSize);
  for (let i = 0; i < signal.length; i++) {
    for (let j = -half; j <= half; j++) {
      const idx = i + j;
      window[j + half] = idx >= 0 && idx < signal.length ? signal[idx] : 0;
    }
    window.sort();
    result[i] = window[half];
  }
  return result;
}
function segment(signal, sampleRate = SR, segSec = SEGMENT_SEC, overlap = SEGMENT_OVERLAP) {
  const segLen = Math.floor(segSec * sampleRate);
  const step = Math.floor(segLen * (1 - overlap));
  if (signal.length < segLen) {
    const padded = new Float64Array(segLen);
    padded.set(signal, Math.floor((segLen - signal.length) / 2));
    return [padded];
  }
  const segments = [];
  for (let start = 0; start <= signal.length - segLen; start += step) {
    segments.push(signal.slice(start, start + segLen));
  }
  return segments;
}
function fft(re, im) {
  const n = re.length;
  for (let i = 0, j = 0; i < n; i++) {
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
    let m = n >> 1;
    while (m >= 1 && j >= m) {
      j -= m;
      m >>= 1;
    }
    j += m;
  }
  for (let len = 2; len <= n; len <<= 1) {
    const half = len >> 1;
    const angle = -2 * Math.PI / len;
    for (let i = 0; i < n; i += len) {
      for (let k = 0; k < half; k++) {
        const wr = Math.cos(angle * k);
        const wi = Math.sin(angle * k);
        const xr = re[i + k + half];
        const xi = im[i + k + half];
        const tr = wr * xr - wi * xi;
        const ti = wr * xi + wi * xr;
        re[i + k + half] = re[i + k] - tr;
        im[i + k + half] = im[i + k] - ti;
        re[i + k] += tr;
        im[i + k] += ti;
      }
    }
  }
}
function powerSpectrum(frame, window, size) {
  const re = new Float64Array(size);
  const im = new Float64Array(size);
  for (let i = 0; i < window.length; i++) re[i] = frame[i] * window[i];
  fft(re, im);
  const power = new Float64Array(size / 2 + 1);
  for (let i = 0; i <= size / 2; i++) power[i] = re[i] * re[i] + im[i] * im[i];
  return power;
}
let stftWindowCache = null;
let melFilterCache = null;
function stftWindow() {
  if (stftWindowCache) return stftWindowCache;
  const w = new Float64Array(N_FFT);
  const offset = Math.floor((N_FFT - WIN_LENGTH) / 2);
  for (let i = 0; i < WIN_LENGTH; i++) w[offset + i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / WIN_LENGTH);
  stftWindowCache = w;
  return w;
}
const hzToMel = (hz) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel) => 700 * (Math.pow(10, mel / 2595) - 1);
function melFilterbank() {
  if (melFilterCache) return melFilterCache;
  const fftBins = N_FFT / 2 + 1;
  const fftFreqs = Array.from({ length: fftBins }, (_, k) => k * SR / N_FFT);
  const melMax = hzToMel(SR / 2);
  const melF = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz(i * melMax / (N_MELS + 1)));
  const filters = [];
  for (let m = 0; m < N_MELS; m++) {
    const filter = new Float64Array(fftBins);
    const enorm = 2 / (melF[m + 2] - melF[m]);
    for (let k = 0; k < fftBins; k++) {
      const lower = (fftFreqs[k] - melF[m]) / (melF[m + 1] - melF[m]);
      const upper = (melF[m + 2] - fftFreqs[k]) / (melF[m + 2] - melF[m + 1]);
      filter[k] = Math.max(0, Math.min(lower, upper)) * enorm;
    }
    filters.push(filter);
  }
  melFilterCache = filters;
  return filters;
}
function dctII(x, nCoeffs) {
  const n = x.length;
  const result = new Float64Array(nCoeffs);
  for (let k = 0; k < nCoeffs; k++) {
    let sum = 0;
    for (let i = 0; i < n; i++) sum += x[i] * Math.cos(Math.PI * k * (2 * i + 1) / (2 * n));
    result[k] = sum * (k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n));
  }
  return result;
}
function extractMfcc(segmentData) {
  const window = stftWindow();
  const melFilters = melFilterbank();
  const padded = new Float64Array(segmentData.length + N_FFT);
  padded.set(segmentData, N_FFT / 2);
  const nFrames = 1 + Math.floor((padded.length - N_FFT) / HOP_LENGTH);
  const melDb = [];
  let maxDb = -Infinity;
  for (let f = 0; f < nFrames; f++) {
    const power = powerSpectrum(padded.subarray(f * HOP_LENGTH, f * HOP_LENGTH + N_FFT), window, N_FFT);
    const frame = new Float64Array(N_MELS);
    for (let m = 0; m < N_MELS; m++) {
      let energy = 0;
      const filter = melFilters[m];
      for (let k = 0; k < power.length; k++) energy += power[k] * filter[k];
      frame[m] = 10 * Math.log10(Math.max(energy, 1e-10));
      maxDb = Math.max(maxDb, frame[m]);
    }
    melDb.push(frame);
  }
  const floor = maxDb - 80;
  return melDb.map((frame) => dctII(frame.map((v) => Math.max(v, floor)), N_MFCC));
}
function trimToMaxDuration(signal, sampleRate) {
  const maxSamples = Math.floor(MAX_DURATION_SEC * sampleRate);
  return signal.length > maxSamples ? signal.subarray(0, maxSamples) : signal;
}
function processAudio({ samples, sampleRate }) {
  if (samples.length / sampleRate < 0.05) throw new Error("Audio too short");
  let signal = removeDcOffset(trimToMaxDuration(samples, sampleRate));
  signal = resample(signal, sampleRate, SR);
  signal = normalizeAmplitude(signal);
  signal = butterworthBandpass(signal);
  signal = medianFilter(signal);
  const segments = segment(signal);
  if (segments.length === 0) throw new Error("No segments extracted");
  return segments.map((seg) => {
    const mfcc = extractMfcc(seg);
    return Array.from({ length: MAX_TIME_STEPS }, (_, i) => mfcc[i] ?? new Float64Array(N_MFCC));
  });
}
function symmetricHann(size) {
  const w = new Float64Array(size);
  for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (size - 1));
  return w;
}
function evaluateSignalQuality(rawSignal, origSr) {
  const signal = trimToMaxDuration(rawSignal, origSr);
  let sumSq = 0;
  let maxAbs = 0;
  for (let i = 0; i < signal.length; i++) {
    maxAbs = Math.max(maxAbs, Math.abs(signal[i]));
    sumSq += signal[i] * signal[i];
  }
  const rms = signal.length > 0 ? Math.sqrt(sumSq / signal.length) : 0;
  if (rms < MIN_RMS_THRESHOLD || maxAbs < 5e-3) {
    return { isValidHeartSound: false, reason: "silence", lowFreqEnergyRatio: 0, highFreqEnergyRatio: 0, rms };
  }
  let lowFreqRatio = 1;
  let highFreqRatio = 0;
  const fftSize = 1024;
  if (origSr >= 2e3 && signal.length >= fftSize) {
    const step = Math.max(fftSize, Math.floor((signal.length - fftSize) / 6));
    const win = symmetricHann(fftSize);
    let totalLow = 0;
    let totalHigh = 0;
    let totalAudible = 0;
    for (let start = 0; start + fftSize <= signal.length; start += step) {
      const power = powerSpectrum(signal.subarray(start, start + fftSize), win, fftSize);
      for (let k = 0; k < power.length; k++) {
        const freq = k * origSr / fftSize;
        if (freq < 20) continue;
        totalAudible += power[k];
        if (freq <= 500) totalLow += power[k];
        else if (freq >= 1e3 && freq <= Math.min(8e3, origSr / 2)) totalHigh += power[k];
      }
    }
    if (totalAudible > 1e-12) {
      lowFreqRatio = totalLow / totalAudible;
      highFreqRatio = totalHigh / totalAudible;
    }
  }
  const isNoise = lowFreqRatio < MIN_LOW_FREQ_ENERGY_RATIO || highFreqRatio > MAX_HIGH_FREQ_ENERGY_RATIO;
  return {
    isValidHeartSound: !isNoise,
    reason: isNoise ? "high_frequency_noise" : "valid",
    lowFreqEnergyRatio: lowFreqRatio,
    highFreqEnergyRatio: highFreqRatio,
    rms
  };
}
export {
  HOP_LENGTH,
  MAX_DURATION_SEC,
  MAX_TIME_STEPS,
  N_FFT,
  N_MELS,
  N_MFCC,
  OPTIMAL_THRESHOLD,
  SEGMENT_OVERLAP,
  SEGMENT_SEC,
  SR,
  WIN_LENGTH,
  butterBandpassCoefficients,
  butterworthBandpass,
  evaluateSignalQuality,
  extractMfcc,
  fft,
  medianFilter,
  normalizeAmplitude,
  processAudio,
  readWav,
  removeDcOffset,
  resample,
  segment
};
