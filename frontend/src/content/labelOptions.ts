// Optional answers asked before a result (training labels). Keep in sync with backend/utils/labels.js.
export const LABEL_OPTIONS = {
    diagnosedByDoctor: ['yes', 'no', 'not_sure'],
    conditions: [
        'murmur', 'aortic_stenosis', 'mitral_regurgitation', 'mitral_stenosis', 'mitral_valve_prolapse',
        'arrhythmia', 'heart_failure', 'coronary_artery_disease', 'congenital', 'valve_surgery', 'other',
    ],
    diagnosisMethod: ['echo', 'ecg', 'stethoscope', 'not_sure'],
    chestLocation: ['aortic', 'pulmonic', 'tricuspid', 'mitral', 'not_sure'],
    device: ['phone', 'stethoscope', 'other'],
} as const;

export interface RecordingLabels {
    diagnosedByDoctor?: (typeof LABEL_OPTIONS.diagnosedByDoctor)[number];
    conditions?: (typeof LABEL_OPTIONS.conditions)[number][];
    otherCondition?: string;
    diagnosisMethod?: (typeof LABEL_OPTIONS.diagnosisMethod)[number];
    chestLocation?: (typeof LABEL_OPTIONS.chestLocation)[number];
    device?: (typeof LABEL_OPTIONS.device)[number];
}

export type LabelSubmission = { skipped: true } | { labels: RecordingLabels };
