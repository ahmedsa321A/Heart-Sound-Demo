import api from './api';
import { HistoryItem, ApiResponse } from './apiTypes';

export const historyService = {
    getHistory: async (): Promise<HistoryItem[]> => {
        const response = await api.get<ApiResponse<HistoryItem[]>>('/users/history');
        return response.data.data || [];
    },

    getHistoryItem: async (id: string): Promise<HistoryItem> => {
        const response = await api.get<ApiResponse<HistoryItem>>(`/users/history/${id}`);
        return response.data.data!;
    }
};
