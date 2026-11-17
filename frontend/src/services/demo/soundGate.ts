/**
 * Second stage of the quality gate: uses YAMNet (AudioSet sound classifier) scores to reject recordings
 * that are clearly music or speech instead of a heart sound. YAMNet ignores content below 125 Hz, where
 * most heart-sound energy is, so it is used only to recognize what a recording IS NOT.
 * Shared by the website (demo mode) and the backend (synced by backend/scripts/sync-inference.sh).
 */

// AudioSet class indices (yamnet_class_map.csv)
export const SPEECH_CLASS = 0;
export const MUSIC_CLASS = 132;
export const NUM_CLASSES = 521;

/** At most this many 0.96 s patches are classified, spread evenly over the recording (keeps it fast). */
export const MAX_PATCHES = 20;

/** Mean score over the analyzed patches above which a recording is rejected (tuned on heart vs music/speech data). */
export const GATE_THRESHOLDS = { speech: 0.3, music: 0.3 };

export type SoundReason = 'speech' | 'music';

export interface SoundJudgement {
    isHeartLike: boolean;
    reason?: SoundReason;
    speech: number;
    music: number;
}

/** Indices of the patches to classify: all of them, or MAX_PATCHES spread evenly. */
export function selectPatches(numPatches: number): number[] {
    if (numPatches <= MAX_PATCHES) return Array.from({ length: numPatches }, (_, i) => i);
    return Array.from({ length: MAX_PATCHES }, (_, i) => Math.round((i * (numPatches - 1)) / (MAX_PATCHES - 1)));
}

/** @param scores flat [numPatches, NUM_CLASSES] YAMNet sigmoid scores */
export function judgeSound(scores: ArrayLike<number>, numPatches: number): SoundJudgement {
    let speech = 0;
    let music = 0;
    for (let p = 0; p < numPatches; p++) {
        speech += scores[p * NUM_CLASSES + SPEECH_CLASS];
        music += scores[p * NUM_CLASSES + MUSIC_CLASS];
    }
    speech /= Math.max(numPatches, 1);
    music /= Math.max(numPatches, 1);

    if (music > GATE_THRESHOLDS.music) return { isHeartLike: false, reason: 'music', speech, music };
    if (speech > GATE_THRESHOLDS.speech) return { isHeartLike: false, reason: 'speech', speech, music };
    return { isHeartLike: true, speech, music };
}
