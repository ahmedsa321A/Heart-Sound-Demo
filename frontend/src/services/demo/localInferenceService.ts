import type { audioService } from '../audioService';
import { buildAnalysisReport } from '@/utils/analysisReport';
import { demoHistoryService } from './demoHistoryService';
import {
    DecodedAudio,
    MAX_TIME_STEPS,
    N_MFCC,
    OPTIMAL_THRESHOLD,
    QualityReason,
    evaluateSignalQuality,
    processAudio,
    readWav,
} from './mfccExtractor';
import { toYamnetRate, yamnetPatches, PATCH_FRAMES, PATCH_BANDS } from './yamnetFeatures';
import { judgeSound, selectPatches, SoundJudgement, SoundReason } from './soundGate';

/**
 * In-browser inference for demo mode — replaces the backend + AI service.
 * Same pipeline as the backend: quality gate (silence/noise, then YAMNet music/speech check) →
 * MFCC per segment → CNN (TensorFlow.js, exported from the Keras model) → top-3 mean → threshold.
 */

const MODEL_URL = `${import.meta.env.BASE_URL}models/heart_model/model.json`;
const YAMNET_URL = `${import.meta.env.BASE_URL}models/yamnet/model.json`;

type LoadedModel = {
    tf: typeof import('@tensorflow/tfjs-core');
    model: import('@tensorflow/tfjs-layers').LayersModel;
    yamnet: import('@tensorflow/tfjs-layers').LayersModel;
};

let modelPromise: Promise<LoadedModel> | null = null;

/** Lazily loads TensorFlow.js and the model so non-demo builds never download them. */
function loadModel(): Promise<LoadedModel> {
    modelPromise ??= (async () => {
        const [tf, tfl] = await Promise.all([
            import('@tensorflow/tfjs-core'),
            import('@tensorflow/tfjs-layers'),
            import('@tensorflow/tfjs-backend-cpu'),
        ]);
        // CPU backend computes in float32 like TFLite, so results match the app exactly
        await tf.setBackend('cpu');
        const [model, yamnet] = await Promise.all([tfl.loadLayersModel(MODEL_URL), tfl.loadLayersModel(YAMNET_URL)]);
        return { tf, model, yamnet };
    })().catch((error) => {
        modelPromise = null;
        throw error;
    });
    return modelPromise;
}

async function decodeAudio(blob: Blob): Promise<DecodedAudio> {
    const buffer = await blob.arrayBuffer();
    try {
        // Parse WAV directly to keep the original sample rate (same as the app / librosa sr=None)
        return readWav(buffer);
    } catch {
        const context = new AudioContext();
        try {
            const audio = await context.decodeAudioData(buffer);
            const samples = new Float64Array(audio.length);
            for (let ch = 0; ch < audio.numberOfChannels; ch++) {
                const data = audio.getChannelData(ch);
                for (let i = 0; i < data.length; i++) samples[i] += data[i] / audio.numberOfChannels;
            }
            return { samples, sampleRate: audio.sampleRate };
        } finally {
            context.close();
        }
    }
}

export interface Prediction {
    predictionResult: 'Normal' | 'Abnormal' | 'Noise';
    predictionScore: number;
    qualityReason?: QualityReason | SoundReason;
}

/** YAMNet check: is this clearly music or speech rather than a heart sound? */
function classifySound({ tf, yamnet }: LoadedModel, audio: DecodedAudio): SoundJudgement {
    const samples = audio.samples.subarray(0, Math.min(audio.samples.length, 30 * audio.sampleRate));
    const { data, numPatches } = yamnetPatches(toYamnetRate(samples, audio.sampleRate));
    const picked = selectPatches(numPatches);
    const size = PATCH_FRAMES * PATCH_BANDS;
    const input = new Float32Array(picked.length * size);
    picked.forEach((p, i) => input.set(data.subarray(p * size, (p + 1) * size), i * size));
    const scores = tf.tidy(() =>
        (yamnet.predict(tf.tensor3d(input, [picked.length, PATCH_FRAMES, PATCH_BANDS])) as import('@tensorflow/tfjs-core').Tensor).dataSync(),
    );
    return judgeSound(scores, picked.length);
}

/** Returns the same shape as the AI service: { predictionResult, predictionScore }. */
export async function predict(audio: DecodedAudio): Promise<Prediction> {
    // 1. Signal quality gate (silence / clapping / high-frequency noise)
    const quality = evaluateSignalQuality(audio.samples, audio.sampleRate);
    if (!quality.isValidHeartSound) {
        return { predictionResult: 'Noise', predictionScore: 0, qualityReason: quality.reason };
    }

    // 1b. Reject music and speech (YAMNet)
    const loaded = await loadModel();
    const sound = classifySound(loaded, audio);
    if (!sound.isHeartLike) {
        return { predictionResult: 'Noise', predictionScore: 0, qualityReason: sound.reason };
    }

    // 2. MFCC features per 2s segment
    const segments = processAudio(audio);
    if (segments.length === 0) throw new Error('No valid segments could be extracted from audio');

    // 3. Batch inference: (segments, 32, 40, 1)
    const { tf, model } = loaded;
    const input = new Float32Array(segments.length * MAX_TIME_STEPS * N_MFCC);
    segments.forEach((mfcc, s) => {
        mfcc.forEach((frame, t) => input.set(frame, (s * MAX_TIME_STEPS + t) * N_MFCC));
    });
    const probs = tf.tidy(() => {
        const x = tf.tensor4d(input, [segments.length, MAX_TIME_STEPS, N_MFCC, 1]);
        return (model.predict(x) as import('@tensorflow/tfjs-core').Tensor).dataSync();
    });

    // 4. Aggregate with top-3 mean (same as the Python API), then threshold
    const top = Array.from(probs).sort((a, b) => b - a).slice(0, 3);
    const score = top.reduce((sum, p) => sum + p, 0) / top.length;

    return {
        predictionResult: score >= OPTIMAL_THRESHOLD ? 'Abnormal' : 'Normal',
        predictionScore: Number(score.toFixed(4)),
    };
}

export const localInferenceService: typeof audioService = {
    uploadAudio: async (audioBlob: Blob) => {
        const audio = await decodeAudio(audioBlob);
        // Let the "analyzing" state paint before the CPU-heavy work starts
        await new Promise((resolve) => setTimeout(resolve, 50));
        const prediction = await predict(audio);

        const report = buildAnalysisReport({
            id: `demo_${Date.now()}`,
            diagnosis: prediction.predictionResult,
            confidence: prediction.predictionScore,
            createdAt: new Date().toISOString(),
        });
        demoHistoryService.addResult(report);
        return report;
    },
};
