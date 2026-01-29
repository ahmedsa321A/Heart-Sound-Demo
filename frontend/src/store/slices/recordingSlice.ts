import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type RecordingStatus = 'idle' | 'recording' | 'review' | 'analyzing' | 'complete' | 'error';

interface AnalysisResult {
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
            state.audioUrl = action.payload; // Store the Blob URL
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
});

export const { startRecording, stopRecording, startAnalyzing, setAnalysisResult, setRecordingError, resetRecording } = recordingSlice.actions;
export default recordingSlice.reducer;
