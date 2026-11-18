/**
 * MFCC feature extractor + signal quality assessment for in-browser (demo mode) inference.
 *
 * Reproduces the ai-service/Services/mfcc_api.py pipeline (librosa 0.10 / scipy) so the
 * browser computes the same features the model was trained on. All parameters MUST match training:
 *   SR=1000, N_MFCC=40, N_MELS=40, N_FFT=512, WIN_LENGTH=256,
 *   HOP_LENGTH=64, MAX_TIME_STEPS=32, SEGMENT_SEC=2.0, OVERLAP=0.5,
 *   BANDPASS=[20,480]Hz order=4 (decision threshold: OPTIMAL_THRESHOLD below)
 * Kept in sync with mobile/lib/services/demo/mfcc_extractor.dart.
 */

export const SR = 1000;
export const SEGMENT_SEC = 2.0;
export const SEGMENT_OVERLAP = 0.5;
export const N_MFCC = 40;
export const N_MELS = 40;
export const N_FFT = 512;
export const WIN_LENGTH = 256;
export const HOP_LENGTH = 64;
export const MAX_TIME_STEPS = 32;
// Decision cutoff of the fine-tuned model, chosen on validation data to keep the previous model's sensitivity
export const OPTIMAL_THRESHOLD = 0.506;
export const MAX_DURATION_SEC = 30;

// Quality gate thresholds — tuned on 190 real heart recordings (CirCor 2022, PhysioNet 2016) and
// 337 non-heart sounds (ESC-50, speech): accepts ~98% of heart sounds, rejects all clapping clips.
const MIN_RMS_THRESHOLD = 0.0015;
const MIN_LOW_FREQ_ENERGY_RATIO = 0.25; // share of audible energy in 20-500 Hz
const MAX_HIGH_FREQ_ENERGY_RATIO = 0.40; // share of audible energy in 1-8 kHz

export type QualityReason = 'valid' | 'silence' | 'high_frequency_noise';

export interface AudioQualityResult {
    isValidHeartSound: boolean;
    reason: QualityReason;
    lowFreqEnergyRatio: number;
    highFreqEnergyRatio: number;
    rms: number;
}

export interface DecodedAudio {
    samples: Float64Array;
    sampleRate: number;
}

// ─── WAV reading ───────────────────────────────────────────────

const WAVE_FORMAT_PCM = 1;
const WAVE_FORMAT_IEEE_FLOAT = 3;
const WAVE_FORMAT_EXTENSIBLE = 0xfffe;

/** Parses a WAV file (8/16/24/32-bit integer PCM or 32/64-bit float) into mono samples at the file's own sample rate. */
export function readWav(buffer: ArrayBuffer): DecodedAudio {
    const data = new DataView(buffer);
    const tag = (o: number) => String.fromCharCode(data.getUint8(o), data.getUint8(o + 1), data.getUint8(o + 2), data.getUint8(o + 3));

    if (data.byteLength < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WAVE') {
        throw new Error('Not a valid WAV file');
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
        if (chunkId === 'fmt ') {
            format = data.getUint16(offset + 8, true);
            numChannels = data.getUint16(offset + 10, true);
            sampleRate = data.getUint32(offset + 12, true);
            bitsPerSample = data.getUint16(offset + 22, true);
            // WAVE_FORMAT_EXTENSIBLE stores the real format code at the start of the SubFormat GUID
            if (format === WAVE_FORMAT_EXTENSIBLE && chunkSize >= 40) format = data.getUint16(offset + 32, true);
        } else if (chunkId === 'data') {
            dataOffset = offset + 8;
            dataSize = Math.min(chunkSize, data.byteLength - dataOffset);
            break;
        }
        offset += 8 + chunkSize + (chunkSize % 2);
    }

    if (dataOffset === 0) throw new Error('No data chunk found in WAV file');
    const isFloat = format === WAVE_FORMAT_IEEE_FLOAT;
    if (isFloat ? ![32, 64].includes(bitsPerSample) : format !== WAVE_FORMAT_PCM || ![8, 16, 24, 32].includes(bitsPerSample)) {
        throw new Error(`Unsupported WAV encoding: format ${format}, ${bitsPerSample}-bit`);
    }

    const bytesPerSample = bitsPerSample / 8;
    const totalFrames = Math.floor(dataSize / (bytesPerSample * numChannels));
    const mono = new Float64Array(totalFrames);
    const readSample = (pos: number): number => {
        if (isFloat) return bitsPerSample === 32 ? data.getFloat32(pos, true) : data.getFloat64(pos, true);
        switch (bitsPerSample) {
            case 8: return (data.getUint8(pos) - 128) / 128;
            case 16: return data.getInt16(pos, true) / 32768;
            case 24: return (data.getUint8(pos) | (data.getUint8(pos + 1) << 8) | (data.getInt8(pos + 2) << 16)) / 8388608;
            default: return data.getInt32(pos, true) / 2147483648;
        }
    };

    for (let i = 0; i < totalFrames; i++) {
        let sum = 0;
        for (let ch = 0; ch < numChannels; ch++) sum += readSample(dataOffset + (i * numChannels + ch) * bytesPerSample);
        mono[i] = sum / numChannels;
    }

    return { samples: mono, sampleRate };
}

// ─── Signal preprocessing ─────────────────────────────────────

export function removeDcOffset(signal: Float64Array): Float64Array {
    let mean = 0;
    for (let i = 0; i < signal.length; i++) mean += signal[i];
    mean /= signal.length;
    const result = new Float64Array(signal.length);
    for (let i = 0; i < signal.length; i++) result[i] = signal[i] - mean;
    return result;
}

// Resampler: linear-phase Kaiser-windowed sinc, matched to librosa's default (soxr 'HQ')
const RESAMPLE_HALF_WIDTH = 80; // filter half-length, in output-rate samples
const RESAMPLE_CUTOFF = 0.9565; // fraction of the output Nyquist frequency
const RESAMPLE_KAISER_BETA = 10.06; // ~100 dB stopband
const RESAMPLE_TABLE_RES = 512; // table points per output-rate sample

let resampleTable: Float64Array | null = null;

function besselI0(x: number): number {
    let sum = 1;
    let term = 1;
    for (let k = 1; k < 50; k++) {
        term *= (x / (2 * k)) ** 2;
        sum += term;
        if (term < sum * 1e-17) break;
    }
    return sum;
}

/** Windowed-sinc filter sampled on a fine grid (interpolated at run time). */
function getResampleTable(): Float64Array {
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

/** Band-limited resampling (anti-aliased). Output length = ceil(n * targetSr / origSr), like librosa. */
export function resample(signal: Float64Array, origSr: number, targetSr: number): Float64Array {
    if (origSr === targetSr) return signal;
    const table = getResampleTable();
    const ratio = targetSr / origSr;
    const scale = Math.min(1, ratio); // filter runs at the lower of the two rates
    const halfWidthIn = RESAMPLE_HALF_WIDTH / scale;
    const outLen = Math.ceil(signal.length * ratio);
    const result = new Float64Array(outLen);

    for (let i = 0; i < outLen; i++) {
        const u = i / ratio; // position in input samples
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

export function normalizeAmplitude(signal: Float64Array, eps = 1e-8): Float64Array {
    let maxAbs = 0;
    for (let i = 0; i < signal.length; i++) maxAbs = Math.max(maxAbs, Math.abs(signal[i]));
    if (maxAbs < eps) return signal;
    const result = new Float64Array(signal.length);
    for (let i = 0; i < signal.length; i++) result[i] = signal[i] / maxAbs;
    return result;
}

// ─── Butterworth bandpass filter (scipy.signal.butter + filtfilt) ─────────

type Complex = [number, number];
const cAdd = (a: Complex, b: Complex): Complex => [a[0] + b[0], a[1] + b[1]];
const cSub = (a: Complex, b: Complex): Complex => [a[0] - b[0], a[1] - b[1]];
const cMul = (a: Complex, b: Complex): Complex => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
const cDiv = (a: Complex, b: Complex): Complex => {
    const d = b[0] * b[0] + b[1] * b[1];
    return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d];
};
const cSqrt = (a: Complex): Complex => {
    const r = Math.sqrt(Math.hypot(a[0], a[1]));
    const angle = Math.atan2(a[1], a[0]) / 2;
    return [r * Math.cos(angle), r * Math.sin(angle)];
};

function polyFromRoots(roots: Complex[]): number[] {
    let poly: Complex[] = [[1, 0]];
    for (const root of roots) {
        const next: Complex[] = Array.from({ length: poly.length + 1 }, () => [0, 0] as Complex);
        for (let i = 0; i < poly.length; i++) {
            next[i] = cAdd(next[i], poly[i]);
            next[i + 1] = cSub(next[i + 1], cMul(poly[i], root));
        }
        poly = next;
    }
    return poly.map((c) => c[0]);
}

/** Same coefficients as scipy.signal.butter(order, [low, high], btype='band'). */
export function butterBandpassCoefficients(low: number, high: number, fs: number, order: number): { b: number[]; a: number[] } {
    const fs2 = 4; // scipy designs with fs=2, so the bilinear transform uses 2*fs = 4
    const nyq = fs / 2;
    const wl = fs2 * Math.tan((Math.PI * (low / nyq)) / 2);
    const wh = fs2 * Math.tan((Math.PI * Math.min(high / nyq, 0.999)) / 2);
    const bw = wh - wl;
    const w0Sq = wl * wh;

    // Analog lowpass prototype poles → bandpass poles (lp2bp_zpk); bandpass zeros: `order` at s=0
    const poles: Complex[] = [];
    for (let k = 0; k < order; k++) {
        const theta = (Math.PI * (2 * k + 1 - order)) / (2 * order);
        const proto: Complex = [-Math.cos(theta), -Math.sin(theta)];
        const half = cMul(proto, [bw / 2, 0]);
        const disc = cSqrt(cSub(cMul(half, half), [w0Sq, 0]));
        poles.push(cAdd(half, disc), cSub(half, disc));
    }
    let gain = bw ** order;

    // Bilinear transform (bilinear_zpk): zeros at s=0 → z=1, zeros at infinity → z=-1
    let gainNum: Complex = [fs2 ** order, 0];
    let gainDen: Complex = [1, 0];
    for (const p of poles) gainDen = cMul(gainDen, cSub([fs2, 0], p));
    gain *= cDiv(gainNum, gainDen)[0];
    const digitalPoles = poles.map((p) => cDiv(cAdd([fs2, 0], p), cSub([fs2, 0], p)));
    const digitalZeros: Complex[] = [
        ...Array.from({ length: order }, () => [1, 0] as Complex),
        ...Array.from({ length: order }, () => [-1, 0] as Complex),
    ];

    return {
        b: polyFromRoots(digitalZeros).map((v) => v * gain),
        a: polyFromRoots(digitalPoles),
    };
}

/** Steady-state initial conditions for lfilter (scipy.signal.lfilter_zi). */
function lfilterZi(b: number[], a: number[]): number[] {
    const n = a.length - 1;
    // Solve (I - companion(a).T) zi = b[1:] - a[1:] * b[0]  (a[0] == 1)
    const m: number[][] = Array.from({ length: n }, (_, i) =>
        Array.from({ length: n }, (_, j) => (i === j ? 1 : 0) - (j === 0 ? -a[i + 1] : j === i + 1 ? 1 : 0)),
    );
    const rhs = Array.from({ length: n }, (_, i) => b[i + 1] - a[i + 1] * b[0]);
    // Gaussian elimination with partial pivoting
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
    const zi = new Array<number>(n).fill(0);
    for (let r = n - 1; r >= 0; r--) {
        let s = rhs[r];
        for (let c = r + 1; c < n; c++) s -= m[r][c] * zi[c];
        zi[r] = s / m[r][r];
    }
    return zi;
}

/** Transposed direct-form II IIR filter with initial state (scipy.signal.lfilter). */
function lfilter(b: number[], a: number[], x: Float64Array, zi: number[]): Float64Array {
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

/** Zero-phase filtering (scipy.signal.filtfilt defaults: odd padding, padlen = 3 * max(len(a), len(b))). */
function filtfilt(b: number[], a: number[], x: Float64Array): Float64Array {
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

let bandpassCache: { b: number[]; a: number[] } | null = null;

export function butterworthBandpass(signal: Float64Array): Float64Array {
    bandpassCache ??= butterBandpassCoefficients(20, 480, SR, 4);
    return filtfilt(bandpassCache.b, bandpassCache.a, signal);
}

// ─── Median filter (scipy.signal.medfilt: zero-padded edges) ──

export function medianFilter(signal: Float64Array, kernelSize = 5): Float64Array {
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

// ─── Segmentation ─────────────────────────────────────────────

export function segment(signal: Float64Array, sampleRate = SR, segSec = SEGMENT_SEC, overlap = SEGMENT_OVERLAP): Float64Array[] {
    const segLen = Math.floor(segSec * sampleRate);
    const step = Math.floor(segLen * (1 - overlap));

    if (signal.length < segLen) {
        const padded = new Float64Array(segLen);
        padded.set(signal, Math.floor((segLen - signal.length) / 2));
        return [padded];
    }

    const segments: Float64Array[] = [];
    for (let start = 0; start <= signal.length - segLen; start += step) {
        segments.push(signal.slice(start, start + segLen));
    }
    return segments;
}

// ─── FFT (in-place iterative radix-2) ─────────────────────────

export function fft(re: Float64Array, im: Float64Array): void {
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
        const angle = (-2 * Math.PI) / len;
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

/** Power spectrum (first size/2+1 bins) of `frame` multiplied by `window` (zero-padded to `size`). */
function powerSpectrum(frame: ArrayLike<number>, window: Float64Array, size: number): Float64Array {
    const re = new Float64Array(size);
    const im = new Float64Array(size);
    for (let i = 0; i < window.length; i++) re[i] = frame[i] * window[i];
    fft(re, im);
    const power = new Float64Array(size / 2 + 1);
    for (let i = 0; i <= size / 2; i++) power[i] = re[i] * re[i] + im[i] * im[i];
    return power;
}

// ─── MFCC (librosa.feature.mfcc with htk=True) ────────────────

let stftWindowCache: Float64Array | null = null;
let melFilterCache: Float64Array[] | null = null;

/** Periodic Hann window of WIN_LENGTH, centered inside N_FFT (librosa.stft window padding). */
function stftWindow(): Float64Array {
    if (stftWindowCache) return stftWindowCache;
    const w = new Float64Array(N_FFT);
    const offset = Math.floor((N_FFT - WIN_LENGTH) / 2);
    for (let i = 0; i < WIN_LENGTH; i++) w[offset + i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / WIN_LENGTH);
    stftWindowCache = w;
    return w;
}

const hzToMel = (hz: number) => 2595 * Math.log10(1 + hz / 700);
const melToHz = (mel: number) => 700 * (Math.pow(10, mel / 2595) - 1);

/** librosa.filters.mel(sr, n_fft, n_mels, htk=True, norm='slaney'). */
function melFilterbank(): Float64Array[] {
    if (melFilterCache) return melFilterCache;
    const fftBins = N_FFT / 2 + 1;
    const fftFreqs = Array.from({ length: fftBins }, (_, k) => (k * SR) / N_FFT);
    const melMax = hzToMel(SR / 2);
    const melF = Array.from({ length: N_MELS + 2 }, (_, i) => melToHz((i * melMax) / (N_MELS + 1)));

    const filters: Float64Array[] = [];
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

/** Orthonormal DCT-II. */
function dctII(x: Float64Array, nCoeffs: number): Float64Array {
    const n = x.length;
    const result = new Float64Array(nCoeffs);
    for (let k = 0; k < nCoeffs; k++) {
        let sum = 0;
        for (let i = 0; i < n; i++) sum += x[i] * Math.cos((Math.PI * k * (2 * i + 1)) / (2 * n));
        result[k] = sum * (k === 0 ? Math.sqrt(1 / n) : Math.sqrt(2 / n));
    }
    return result;
}

/** MFCC matrix (frames x N_MFCC) for one segment — centered STFT, mel power, power_to_db(top_db=80), DCT. */
export function extractMfcc(segmentData: Float64Array): Float64Array[] {
    const window = stftWindow();
    const melFilters = melFilterbank();

    // center=True: zero-pad N_FFT/2 on both sides
    const padded = new Float64Array(segmentData.length + N_FFT);
    padded.set(segmentData, N_FFT / 2);
    const nFrames = 1 + Math.floor((padded.length - N_FFT) / HOP_LENGTH);

    const melDb: Float64Array[] = [];
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

    // top_db=80 relative to the loudest value in the segment
    const floor = maxDb - 80;
    return melDb.map((frame) => dctII(frame.map((v) => Math.max(v, floor)), N_MFCC));
}

function trimToMaxDuration(signal: Float64Array, sampleRate: number): Float64Array {
    const maxSamples = Math.floor(MAX_DURATION_SEC * sampleRate);
    return signal.length > maxSamples ? signal.subarray(0, maxSamples) : signal;
}

/**
 * Full preprocessing pipeline: returns one (MAX_TIME_STEPS x N_MFCC) MFCC matrix per segment.
 * Audio longer than 30 seconds is cut to the first 30 seconds.
 */
export function processAudio({ samples, sampleRate }: DecodedAudio): Float64Array[][] {
    if (samples.length / sampleRate < 0.05) throw new Error('Audio too short');

    let signal = removeDcOffset(trimToMaxDuration(samples, sampleRate));
    signal = resample(signal, sampleRate, SR);
    signal = normalizeAmplitude(signal);
    signal = butterworthBandpass(signal);
    signal = medianFilter(signal);

    const segments = segment(signal);
    if (segments.length === 0) throw new Error('No segments extracted');

    return segments.map((seg) => {
        const mfcc = extractMfcc(seg);
        // Pad (with zeros) / truncate to MAX_TIME_STEPS
        return Array.from({ length: MAX_TIME_STEPS }, (_, i) => mfcc[i] ?? new Float64Array(N_MFCC));
    });
}

// ─── Signal Quality Assessment (SQA) ───────────────────────────

function symmetricHann(size: number): Float64Array {
    const w = new Float64Array(size);
    for (let i = 0; i < size; i++) w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    return w;
}

/**
 * Gatekeeper before the model (same rule as evaluate_audio_quality() in the AI service):
 * rejects silence and non-heart sounds (clapping, tapping, hiss). Energy shares are measured over
 * the audible band (>= 20 Hz) so harmless sub-20 Hz rumble doesn't count against a recording.
 */
export function evaluateSignalQuality(rawSignal: Float64Array, origSr: number): AudioQualityResult {
    const signal = trimToMaxDuration(rawSignal, origSr);

    // 1. Silence / muted mic
    let sumSq = 0;
    let maxAbs = 0;
    for (let i = 0; i < signal.length; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(signal[i]));
        sumSq += signal[i] * signal[i];
    }
    const rms = signal.length > 0 ? Math.sqrt(sumSq / signal.length) : 0;
    if (rms < MIN_RMS_THRESHOLD || maxAbs < 0.005) {
        return { isValidHeartSound: false, reason: 'silence', lowFreqEnergyRatio: 0, highFreqEnergyRatio: 0, rms };
    }

    // 2. Spectral energy shares: heart sounds live below 500 Hz, claps/hiss above 1 kHz
    let lowFreqRatio = 1;
    let highFreqRatio = 0;
    const fftSize = 1024;
    if (origSr >= 2000 && signal.length >= fftSize) {
        const step = Math.max(fftSize, Math.floor((signal.length - fftSize) / 6));
        const win = symmetricHann(fftSize);
        let totalLow = 0;
        let totalHigh = 0;
        let totalAudible = 0;
        for (let start = 0; start + fftSize <= signal.length; start += step) {
            const power = powerSpectrum(signal.subarray(start, start + fftSize), win, fftSize);
            for (let k = 0; k < power.length; k++) {
                const freq = (k * origSr) / fftSize;
                if (freq < 20) continue;
                totalAudible += power[k];
                if (freq <= 500) totalLow += power[k];
                else if (freq >= 1000 && freq <= Math.min(8000, origSr / 2)) totalHigh += power[k];
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
        reason: isNoise ? 'high_frequency_noise' : 'valid',
        lowFreqEnergyRatio: lowFreqRatio,
        highFreqEnergyRatio: highFreqRatio,
        rms,
    };
}
