import api from './api';
import { AnalysisResult } from '@/store/slices/recordingSlice';

export const audioService = {
    uploadAudio: async (audioBlob: Blob): Promise<AnalysisResult> => {
        const formData = new FormData();
        formData.append('file', audioBlob, 'recording.wav');

        const response = await api.post<AnalysisResult>('/analysis/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        return response.data;
    },
};
