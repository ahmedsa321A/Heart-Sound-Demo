import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { audioService } from '@/services/audioService';

export type RecordingStatus = 'idle' | 'recording' | 'review' | 'analyzing' | 'complete' | 'error';

export interface AnalysisResult {
    diagnosis: string;
    confidence: number;
    details: string;
}

interface RecordingState {
    status: RecordingStatus;
    audioUrl: string | null;
    analysisResult: AnalysisResult | null;
    error: string | null;
}

const initialState: RecordingState = {
    status: 'idle',
    audioUrl: null,
    analysisResult: null,
    error: null,
};

export const analyzeAudio = createAsyncThunk(
    'recording/analyze',
    async (audioBlob: Blob, { rejectWithValue }) => {
        try {
            const result = await audioService.uploadAudio(audioBlob);
            return result;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to analyze audio');
        }
    }
);

const recordingSlice = createSlice({
    name: 'recording',
    initialState,
    reducers: {
        startRecording: (state) => {
            state.status = 'recording';
            state.error = null;
        },
        stopRecording: (state, action: PayloadAction<string>) => {
            state.status = 'review';
            state.audioUrl = action.payload; 
        },
        startAnalyzing: (state) => {
            state.status = 'analyzing';
            state.error = null;
        },
        setAnalysisResult: (state, action: PayloadAction<AnalysisResult>) => {
            state.status = 'complete';
            state.analysisResult = action.payload;
        },
        setRecordingError: (state, action: PayloadAction<string>) => {
            state.status = 'error';
            state.error = action.payload;
        },
        resetRecording: (state) => {
            state.status = 'idle';
            state.audioUrl = null;
            state.analysisResult = null;
            state.error = null;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(analyzeAudio.pending, (state) => {
                state.status = 'analyzing';
                state.error = null;
            })
            .addCase(analyzeAudio.fulfilled, (state, action) => {
                state.status = 'complete';
                state.analysisResult = action.payload;
            })
            .addCase(analyzeAudio.rejected, (state, action) => {
                state.status = 'error';
                state.error = action.payload as string;
            });
    }
});

export const { startRecording, stopRecording, startAnalyzing, setAnalysisResult, setRecordingError, resetRecording } = recordingSlice.actions;
export default recordingSlice.reducer;
