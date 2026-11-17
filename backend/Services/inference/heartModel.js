import { tf, loadLocalModel } from './tfRuntime.js';
import { classifySound, warmUpSoundClassifier } from './soundClassifier.js';
import {
    readWav,
    evaluateSignalQuality,
    processAudio,
    MAX_TIME_STEPS,
    N_MFCC,
    OPTIMAL_THRESHOLD,
} from './mfccExtractor.js';

/**
 * Heart sound prediction, run in-process (replaces the separate Python ai-service).
 * Same pipeline and model as ai-service/Services/mfcc_api.py: quality gate → MFCC per 2 s segment →
 * CNN → top-3 mean → threshold. Returns the same shape the AI service returned.
 */

const MODEL_DIR = new URL('./model/', import.meta.url);
let modelPromise = null;

function loadModel() {
    modelPromise ??= loadLocalModel(MODEL_DIR).catch((error) => {
        modelPromise = null;
        throw error;
    });
    return modelPromise;
}

export class InvalidAudioError extends Error {}

/**
 * Decodes an uploaded WAV file into mono samples.
 * @param {Buffer} wavBuffer
 * @returns {{samples: Float64Array, sampleRate: number}}
 */
export function decodeUpload(wavBuffer) {
    let audio;
    try {
        audio = readWav(wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength));
    } catch (error) {
        throw new InvalidAudioError(error.message);
    }
    if (audio.samples.length / audio.sampleRate < 0.05) {
        throw new InvalidAudioError('Audio file is empty or invalid. Please record audio for at least 1 second.');
    }
    return audio;
}

/**
 * @param {{samples: Float64Array, sampleRate: number}} audio - from decodeUpload()
 * @returns {Promise<{predictionResult: 'Normal'|'Abnormal'|'Noise', predictionScore: number, qualityReason?: string}>}
 */
export async function predictHeartSound(audio) {
    // 1. Quality gate (silence / clapping / high-frequency noise)
    const quality = evaluateSignalQuality(audio.samples, audio.sampleRate);
    if (!quality.isValidHeartSound) {
        return { predictionResult: 'Noise', predictionScore: 0, qualityReason: quality.reason };
    }

    // 1b. Sound recognition: reject music and speech (YAMNet)
    const sound = await classifySound(audio);
    if (!sound.isHeartLike) {
        return { predictionResult: 'Noise', predictionScore: 0, qualityReason: sound.reason };
    }

    // 2. MFCC features per segment → batch (segments, 32, 40, 1)
    const segments = processAudio(audio);
    const input = new Float32Array(segments.length * MAX_TIME_STEPS * N_MFCC);
    segments.forEach((mfcc, s) => mfcc.forEach((frame, t) => input.set(frame, (s * MAX_TIME_STEPS + t) * N_MFCC)));

    // 3. Segment probabilities → top-3 mean → threshold
    const model = await loadModel();
    const probs = tf.tidy(() => model.predict(tf.tensor4d(input, [segments.length, MAX_TIME_STEPS, N_MFCC, 1])).dataSync());
    const top = Array.from(probs).sort((a, b) => b - a).slice(0, 3);
    const score = top.reduce((sum, p) => sum + p, 0) / top.length;

    return {
        predictionResult: score >= OPTIMAL_THRESHOLD ? 'Abnormal' : 'Normal',
        predictionScore: Number(score.toFixed(4)),
    };
}

/** Loads both models ahead of the first request so they don't slow the first analysis. */
export const warmUpModel = () => Promise.all([loadModel(), warmUpSoundClassifier()]);
