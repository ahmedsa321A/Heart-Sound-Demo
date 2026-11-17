import { readFile } from 'node:fs/promises';
import * as tf from '@tensorflow/tfjs-core';
import '@tensorflow/tfjs-backend-wasm';
import '@tensorflow/tfjs-backend-cpu';
import * as tfl from '@tensorflow/tfjs-layers';

/**
 * TensorFlow.js setup shared by the heart model and YAMNet. Prefers the WASM backend (~10x faster
 * than the pure-JS CPU backend, same float32 math) and falls back to CPU if WASM can't start.
 */
let readyPromise = null;

export function tfReady() {
    readyPromise ??= (async () => {
        try {
            if (!(await tf.setBackend('wasm'))) throw new Error('wasm backend unavailable');
        } catch (error) {
            console.warn('TensorFlow.js WASM backend unavailable, using CPU:', error.message);
            await tf.setBackend('cpu');
        }
        await tf.ready();
        return tf;
    })();
    return readyPromise;
}

/** Loads a layers model stored next to the code (model.json + weights.bin in `dirUrl`). */
export async function loadLocalModel(dirUrl) {
    await tfReady();
    const [modelJson, weights] = await Promise.all([
        readFile(new URL('model.json', dirUrl), 'utf8').then(JSON.parse),
        readFile(new URL('weights.bin', dirUrl)),
    ]);
    return tfl.loadLayersModel(tf.io.fromMemory({
        modelTopology: modelJson.modelTopology,
        weightSpecs: modelJson.weightsManifest[0].weights,
        weightData: weights.buffer.slice(weights.byteOffset, weights.byteOffset + weights.byteLength),
    }));
}

export { tf };
