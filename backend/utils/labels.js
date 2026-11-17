// Optional answers users give before seeing a result (training labels). Keep in sync with
// frontend/src/content/labelOptions.ts.
export const LABEL_OPTIONS = {
    diagnosedByDoctor: ['yes', 'no', 'not_sure'],
    conditions: [
        'murmur', 'aortic_stenosis', 'mitral_regurgitation', 'mitral_stenosis', 'mitral_valve_prolapse',
        'arrhythmia', 'heart_failure', 'coronary_artery_disease', 'congenital', 'valve_surgery', 'other'
    ],
    diagnosisMethod: ['echo', 'ecg', 'stethoscope', 'not_sure'],
    chestLocation: ['aortic', 'pulmonic', 'tricuspid', 'mitral', 'not_sure'],
    device: ['phone', 'stethoscope', 'other']
};
