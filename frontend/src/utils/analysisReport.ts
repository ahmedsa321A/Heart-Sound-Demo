import i18n from '@/i18n';
import { AnalysisResponse, HistoryStatus } from '@/services/apiTypes';

/** The AI service returns 'Noise' (older versions: 'Invalid') when no clear heart sound is found. */
export const isNoiseDiagnosis = (diagnosis: string) => diagnosis === 'Noise' || diagnosis === 'Invalid';

export const toHistoryStatus = (diagnosis: string): HistoryStatus => {
    if (diagnosis === 'Normal') return 'normal';
    if (isNoiseDiagnosis(diagnosis)) return 'noise';
    return 'attention';
};

interface ReportInput {
    id: string;
    diagnosis: string;
    confidence: number;
    createdAt: string;
    audioUrl?: string;
}

/** Builds the translated report (details, severity, recommendations) for a prediction. */
export function buildAnalysisReport({ id, diagnosis, confidence, createdAt, audioUrl = '' }: ReportInput): AnalysisResponse {
    const base = { id, diagnosis, confidence, createdAt, audioUrl };

    if (isNoiseDiagnosis(diagnosis)) {
        return {
            ...base,
            details: i18n.t('audio.noiseDetails'),
            severity: 'medium',
            recommendations: [i18n.t('audio.placeFirmly'), i18n.t('audio.quietEnvironment'), i18n.t('audio.removeCover')],
        };
    }

    const isAbnormal = diagnosis === 'Abnormal';
    const result = i18n.t(isAbnormal ? 'audio.resultAbnormal' : 'audio.resultNormal');
    return {
        ...base,
        details: i18n.t('audio.analysisDetails', { result }),
        severity: isAbnormal ? 'high' : 'low',
        recommendations: isAbnormal
            ? [i18n.t('audio.consultCardiologist'), i18n.t('audio.monitorSymptoms')]
            : [i18n.t('audio.routineCheckup')],
    };
}
