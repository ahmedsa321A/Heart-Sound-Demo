import test from 'node:test';
import assert from 'node:assert/strict';
import { judgeSound, selectPatches, MAX_PATCHES, NUM_CLASSES, SPEECH_CLASS, MUSIC_CLASS } from '../services/demo/soundGate.ts';
import { yamnetPatches, toYamnetRate, PATCH_FRAMES, PATCH_BANDS } from '../services/demo/yamnetFeatures.ts';

const scoresFor = (patches, { speech = 0, music = 0 }) => {
    const s = new Float32Array(patches * NUM_CLASSES);
    for (let p = 0; p < patches; p++) { s[p * NUM_CLASSES + SPEECH_CLASS] = speech; s[p * NUM_CLASSES + MUSIC_CLASS] = music; }
    return s;
};

test('judgeSound rejects music and speech, accepts everything else', () => {
    assert.deepEqual(judgeSound(scoresFor(4, { music: 0.9 }), 4).reason, 'music');
    assert.deepEqual(judgeSound(scoresFor(4, { speech: 0.9 }), 4).reason, 'speech');
    const heart = judgeSound(scoresFor(4, { speech: 0.02, music: 0.01 }), 4);
    assert.equal(heart.isHeartLike, true);
    assert.equal(heart.reason, undefined);
});

test('selectPatches keeps all patches up to the limit, else spreads them evenly', () => {
    assert.deepEqual(selectPatches(3), [0, 1, 2]);
    const many = selectPatches(61);
    assert.equal(many.length, MAX_PATCHES);
    assert.equal(many[0], 0);
    assert.equal(many[many.length - 1], 60);
});

test('yamnetPatches: one patch for short audio, 0.48 s hop after that', () => {
    assert.equal(yamnetPatches(new Float64Array(8000)).numPatches, 1);           // 0.5 s → padded to one patch
    const { data, numPatches } = yamnetPatches(new Float64Array(16000 * 10));     // 10 s
    assert.equal(numPatches, 20);
    assert.equal(data.length, numPatches * PATCH_FRAMES * PATCH_BANDS);
    assert.ok(data.every((v) => v === Math.fround(Math.log(0.001))));           // silence → log(offset)
});

test('toYamnetRate converts length to 16 kHz', () => {
    assert.equal(toYamnetRate(new Float64Array(48000), 48000).length, 16000);
    assert.equal(toYamnetRate(new Float64Array(4000), 4000).length, 16000);
});
