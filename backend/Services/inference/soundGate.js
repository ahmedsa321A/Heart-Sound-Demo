// GENERATED from frontend/src/services/demo/soundGate.ts by backend/scripts/sync-inference.sh — do not edit.
const SPEECH_CLASS = 0;
const MUSIC_CLASS = 132;
const NUM_CLASSES = 521;
const MAX_PATCHES = 20;
const GATE_THRESHOLDS = { speech: 0.3, music: 0.3 };
function selectPatches(numPatches) {
  if (numPatches <= MAX_PATCHES) return Array.from({ length: numPatches }, (_, i) => i);
  return Array.from({ length: MAX_PATCHES }, (_, i) => Math.round(i * (numPatches - 1) / (MAX_PATCHES - 1)));
}
function judgeSound(scores, numPatches) {
  let speech = 0;
  let music = 0;
  for (let p = 0; p < numPatches; p++) {
    speech += scores[p * NUM_CLASSES + SPEECH_CLASS];
    music += scores[p * NUM_CLASSES + MUSIC_CLASS];
  }
  speech /= Math.max(numPatches, 1);
  music /= Math.max(numPatches, 1);
  if (music > GATE_THRESHOLDS.music) return { isHeartLike: false, reason: "music", speech, music };
  if (speech > GATE_THRESHOLDS.speech) return { isHeartLike: false, reason: "speech", speech, music };
  return { isHeartLike: true, speech, music };
}
export {
  GATE_THRESHOLDS,
  MAX_PATCHES,
  MUSIC_CLASS,
  NUM_CLASSES,
  SPEECH_CLASS,
  judgeSound,
  selectPatches
};
