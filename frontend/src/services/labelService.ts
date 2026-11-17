import api from './api';
import { LabelSubmission } from '@/content/labelOptions';

export const labelService = {
    /** Saves the optional answers for a prediction, or records that the user skipped them. */
    submit: async (predictionId: string, submission: LabelSubmission): Promise<void> => {
        await api.patch(`/predections/${predictionId}/labels`, submission);
    },
};
