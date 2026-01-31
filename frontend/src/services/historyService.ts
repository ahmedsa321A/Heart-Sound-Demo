import api from './api';
import { HistoryItem } from './apiTypes';

export const historyService = {
    getHistory: async (): Promise<HistoryItem[]> => {
        const response = await api.get<any>('/predections/getPredictions');
        // Check if response.data is the array or response.data.data
        const backendData = Array.isArray(response.data) ? response.data : response.data.data || [];

        return backendData.map((item: any) => ({
            id: item._id,
            date: new Date(item.createdAt).toLocaleDateString(),
            diagnosis: item.predictionResult,
            status: item.predictionResult === 'Normal' ? 'normal' : 'attention',
            audioUrl: '', // Add if available
        }));
    },

    getHistoryItem: async (id: string): Promise<HistoryItem> => {
        const response = await api.get<any>(`/predections/getPrediction/${id}`);
        const item = response.data;
        return {
            id: item._id,
            date: new Date(item.createdAt).toLocaleDateString(),
            diagnosis: item.predictionResult,
            status: item.predictionResult === 'Normal' ? 'normal' : 'attention',
            audioUrl: '',
        };
    }
};
