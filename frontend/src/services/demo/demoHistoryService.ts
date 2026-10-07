import type { historyService } from '../historyService';
import { AnalysisResponse, HistoryItem } from '../apiTypes';
import { toHistoryStatus } from '@/utils/analysisReport';
import { loadJson, saveJson } from './demoStorage';

/** Demo history — results are kept in the browser (localStorage). No backend or database needed. */
const STORAGE_KEY = 'heartai.demoHistory';
// Same page size as the backend's dashboard-stats endpoint
const RECENT_LIMIT = 4;

let history: HistoryItem[] = loadJson<HistoryItem[]>(STORAGE_KEY, []);

export const demoHistoryService: typeof historyService & {
    addResult: (result: AnalysisResponse) => void;
    clear: () => void;
} = {
    getDashboardStats: async () => ({
        recentActivity: history.slice(0, RECENT_LIMIT),
        stats: {
            totalRecordings: history.length,
            normalResults: history.filter((item) => item.status === 'normal').length,
        },
    }),

    getHistoryItem: async (id: string) => {
        const item = history.find((h) => h.id === id);
        if (!item) throw new Error('History item not found');
        return item;
    },

    addResult: (result: AnalysisResponse) => {
        history = [
            {
                id: result.id,
                date: result.createdAt,
                diagnosis: result.diagnosis,
                status: toHistoryStatus(result.diagnosis),
                confidence: result.confidence,
            },
            ...history,
        ];
        saveJson(STORAGE_KEY, history);
    },

    clear: () => {
        history = [];
        saveJson(STORAGE_KEY, history);
    },
};
