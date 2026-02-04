import { configureStore } from '@reduxjs/toolkit';
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import authReducer from './slices/authSlice';
import recordingReducer from './slices/recordingSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        recording: recordingReducer,
    },
    devTools: import.meta.env.VITE_ENABLE_REDUX_DEVTOOLS === 'true',
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
