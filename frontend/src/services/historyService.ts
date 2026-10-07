import api from './api';
import { HistoryItem, DashboardStatsResponse } from './apiTypes';
import { toHistoryStatus } from '@/utils/analysisReport';

export const historyService = {
    getDashboardStats: async (): Promise<DashboardStatsResponse> => {
        const response = await api.get<any>('/predections/dashboard-stats');
        const data = response.data;

        const recentActivity = (data.recentActivity || []).map((item: any) => ({
            id: item._id,
            date: item.createdAt,
            diagnosis: item.predictionResult,
            status: toHistoryStatus(item.predictionResult),
            audioUrl: '',
            confidence: item.predictionScore
        }));

        return {
            recentActivity,
            stats: data.stats || { totalRecordings: 0, normalResults: 0 }
        };
    },


    getHistoryItem: async (id: string): Promise<HistoryItem> => {
        const response = await api.get<any>(`/predections/getPrediction/${id}`);
        const item = response.data;
        return {
            id: item._id,
            date: item.createdAt,
            diagnosis: item.predictionResult,
            status: toHistoryStatus(item.predictionResult),
            audioUrl: '',
        };
    }
};
