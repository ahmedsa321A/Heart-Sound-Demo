import test from 'node:test';
import assert from 'node:assert/strict';
import {
    readWav,
    segment,
    processAudio,
    evaluateSignalQuality,
    MAX_TIME_STEPS,
    N_MFCC,
} from '../services/demo/mfccExtractor.ts';

const SR = 44100;

function makeSignal(seconds, fn, sampleRate = SR) {
    const signal = new Float64Array(Math.round(seconds * sampleRate));
    for (let i = 0; i < signal.length; i++) signal[i] = fn(i / sampleRate);
    return signal;
}

// 60 Hz carrier with a lub-dub style envelope (same fixture as the mobile app tests)
const cardiac = (t) => {
    const carrier = Math.sin(2 * Math.PI * 60 * t) + 0.5 * Math.sin(2 * Math.PI * 120 * t);
    return carrier * (Math.abs(Math.sin(2 * Math.PI * 1.2 * t)) > 0.4 ? 0.6 : 0.05);
};

function encodeWav16(channels, sampleRate) {
    const frames = channels[0].length;
    const view = new DataView(new ArrayBuffer(44 + frames * channels.length * 2));
    const tag = (o, s) => [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
    tag(0, 'RIFF'); view.setUint32(4, 36 + frames * channels.length * 2, true); tag(8, 'WAVE');
    tag(12, 'fmt '); view.setUint32(16, 16, true); view.setUint16(20, 1, true);
    view.setUint16(22, channels.length, true); view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * channels.length * 2, true); view.setUint16(32, channels.length * 2, true);
    view.setUint16(34, 16, true);
    tag(36, 'data'); view.setUint32(40, frames * channels.length * 2, true);
    for (let i = 0; i < frames; i++) {
        channels.forEach((ch, c) => view.setInt16(44 + (i * channels.length + c) * 2, Math.round(ch[i] * 32767), true));
    }
    return view.buffer;
}

test('SQA rejects silence', () => {
    const quality = evaluateSignalQuality(new Float64Array(SR), SR);
    assert.equal(quality.isValidHeartSound, false);
    assert.equal(quality.reason, 'silence');
});

test('SQA rejects a sharp broadband impulse (clapping / tapping)', () => {
    const signal = new Float64Array(SR);
    signal[1000] = 0.95;
    signal[1001] = -0.85;
    const quality = evaluateSignalQuality(signal, SR);
    assert.equal(quality.isValidHeartSound, false);
    assert.equal(quality.reason, 'high_frequency_noise');
});

test('SQA rejects high-frequency noise', () => {
    const quality = evaluateSignalQuality(makeSignal(1, (t) => 0.5 * Math.sin(2 * Math.PI * 3500 * t)), SR);
    assert.equal(quality.isValidHeartSound, false);
    assert.equal(quality.reason, 'high_frequency_noise');
});

test('SQA accepts a low-frequency cardiac-like sound', () => {
    const quality = evaluateSignalQuality(makeSignal(1, cardiac), SR);
    assert.equal(quality.isValidHeartSound, true);
    assert.equal(quality.reason, 'valid');
});

test('SQA accepts a heart sound with sharp beats and sub-20 Hz rumble', () => {
    // Sharp beats give a high crest factor and rumble adds energy below 20 Hz — both common in real recordings
    const beat = (t) => {
        const phase = t % 0.8;
        return phase < 0.04 ? 0.9 * Math.sin(2 * Math.PI * 50 * phase) : 0.01 * Math.sin(2 * Math.PI * 80 * t);
    };
    const quality = evaluateSignalQuality(makeSignal(5, (t) => beat(t) + 0.5 * Math.sin(2 * Math.PI * 3 * t), 4000), 4000);
    assert.equal(quality.isValidHeartSound, true);
    assert.equal(quality.reason, 'valid');
});

test('readWav decodes 16-bit stereo to mono at the file sample rate', () => {
    const left = Float64Array.from([0.5, -0.5, 0.25]);
    const right = Float64Array.from([0.5, 0.5, -0.25]);
    const { samples, sampleRate } = readWav(encodeWav16([left, right], 8000));
    assert.equal(sampleRate, 8000);
    assert.equal(samples.length, 3);
    assert.ok(Math.abs(samples[0] - 0.5) < 1e-3);
    assert.ok(Math.abs(samples[1]) < 1e-3);
    assert.ok(Math.abs(samples[2]) < 1e-3);
});

test('readWav rejects non-WAV data', () => {
    assert.throws(() => readWav(new TextEncoder().encode('not a wav file at all').buffer));
});

test('segment: 30 s at 1 kHz → 29 overlapping 2 s windows; short audio is padded', () => {
    const segments = segment(new Float64Array(30000));
    assert.equal(segments.length, 29);
    assert.ok(segments.every((s) => s.length === 2000));
    assert.equal(segment(new Float64Array(500)).length, 1);
});

test('processAudio returns (32 x 40) MFCC per segment and trims audio to 30 s', () => {
    const features = processAudio({ samples: makeSignal(35, cardiac, 4000), sampleRate: 4000 });
    assert.equal(features.length, 29);
    for (const mfcc of features) {
        assert.equal(mfcc.length, MAX_TIME_STEPS);
        assert.ok(mfcc.every((frame) => frame.length === N_MFCC && frame.every(Number.isFinite)));
    }
});
