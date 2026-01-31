import api from './api';
import { AnalysisResponse } from './apiTypes';
import i18n from '../i18n';

export const audioService = {
    uploadAudio: async (audioBlob: Blob): Promise<AnalysisResponse> => {
        const formData = new FormData();
        formData.append('audio', audioBlob, 'recording.wav');

        const response = await api.post('/predections/makePrediction', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        const backendData = response.data;
        const resultKey = backendData.predictionResult === 'Abnormal' ? 'audio.resultAbnormal' : 'audio.resultNormal';
        const translatedResult = i18n.t(resultKey);

        // Map backend response to AnalysisResponse
        return {
            id: backendData._id,
            diagnosis: backendData.predictionResult,
            confidence: backendData.predictionScore,
            createdAt: backendData.createdAt,
            audioUrl: '', // Not returned by backend yet
            details: i18n.t('audio.analysisDetails', { result: translatedResult }),
            severity: backendData.predictionResult === 'Abnormal' ? 'high' : 'low',
            recommendations: backendData.predictionResult === 'Abnormal'
                ? [i18n.t('audio.consultCardiologist'), i18n.t('audio.monitorSymptoms')]
                : [i18n.t('audio.routineCheckup')]
        };
    },
};
