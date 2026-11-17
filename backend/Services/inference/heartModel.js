import { readFile } from 'node:fs/promises';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-cpu';
import * as tfl from '@tensorflow/tfjs-layers';
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
    modelPromise ??= (async () => {
        await tf.setBackend('cpu');
        const [modelJson, weights] = await Promise.all([
            readFile(new URL('model.json', MODEL_DIR), 'utf8').then(JSON.parse),
            readFile(new URL('weights.bin', MODEL_DIR)),
        ]);
        return tfl.loadLayersModel(tf.io.fromMemory({
            modelTopology: modelJson.modelTopology,
            weightSpecs: modelJson.weightsManifest[0].weights,
            weightData: weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength),
        }));
    })().catch((error) => {
        modelPromise = null;
        throw error;
    });
    return modelPromise;
}

export class InvalidAudioError extends Error {}

/**
 * @param {Buffer} wavBuffer - uploaded WAV file
 * @returns {Promise<{predictionResult: 'Normal'|'Abnormal'|'Noise', predictionScore: number, qualityReason?: string}>}
 */
export async function predictHeartSound(wavBuffer) {
    let audio;
    try {
        audio = readWav(wavBuffer.buffer.slice(wavBuffer.byteOffset, wavBuffer.byteOffset + wavBuffer.byteLength));
    } catch (error) {
        throw new InvalidAudioError(error.message);
    }
    if (audio.samples.length / audio.sampleRate < 0.05) {
        throw new InvalidAudioError('Audio file is empty or invalid. Please record audio for at least 1 second.');
    }

    // 1. Quality gate (silence / clapping / high-frequency noise)
    const quality = evaluateSignalQuality(audio.samples, audio.sampleRate);
    if (!quality.isValidHeartSound) {
        return { predictionResult: 'Noise', predictionScore: 0, qualityReason: quality.reason };
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

/** Loads the model ahead of the first request so it doesn't slow the first analysis. */
export const warmUpModel = () => loadModel();
