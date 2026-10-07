import api from './api';
import { AnalysisResponse } from './apiTypes';
import { buildAnalysisReport } from '@/utils/analysisReport';

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
        return buildAnalysisReport({
            id: backendData._id,
            diagnosis: backendData.predictionResult,
            confidence: backendData.predictionScore,
            createdAt: backendData.createdAt,
        });
    },
};
