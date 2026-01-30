import api from './api';
import { AnalysisResponse } from './apiTypes';

export const audioService = {
    uploadAudio: async (audioBlob: Blob): Promise<AnalysisResponse> => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        const response = await api.post<AnalysisResponse>('/analysis/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};
