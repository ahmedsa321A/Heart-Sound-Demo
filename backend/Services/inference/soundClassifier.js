import { tf, loadLocalModel } from './tfRuntime.js';
import { toYamnetRate, yamnetPatches, PATCH_FRAMES, PATCH_BANDS } from './yamnetFeatures.js';
import { judgeSound, selectPatches, NUM_CLASSES } from './soundGate.js';

/** Recognizes recordings that are clearly music or speech (YAMNet), before the heart model runs. */
const MODEL_DIR = new URL('./yamnet/', import.meta.url);
const MAX_SECONDS = 30;
let modelPromise = null;

const loadModel = () => {
    modelPromise ??= loadLocalModel(MODEL_DIR).catch((error) => {
        modelPromise = null;
        throw error;
    });
    return modelPromise;
};

/** @param {{samples: Float64Array, sampleRate: number}} audio */
export async function classifySound(audio) {
    const samples = audio.samples.subarray(0, Math.min(audio.samples.length, MAX_SECONDS * audio.sampleRate));
    const { data, numPatches } = yamnetPatches(toYamnetRate(samples, audio.sampleRate));
    const picked = selectPatches(numPatches);
    const size = PATCH_FRAMES * PATCH_BANDS;
    const input = new Float32Array(picked.length * size);
    picked.forEach((p, i) => input.set(data.subarray(p * size, (p + 1) * size), i * size));

    const model = await loadModel();
    const scores = tf.tidy(() => model.predict(tf.tensor3d(input, [picked.length, PATCH_FRAMES, PATCH_BANDS])).dataSync());
    if (scores.length !== picked.length * NUM_CLASSES) throw new Error('Unexpected YAMNet output size');
    return judgeSound(scores, picked.length);
}

export const warmUpSoundClassifier = () => loadModel();
