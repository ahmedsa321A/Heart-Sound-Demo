import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface User {
    id: string;
    email: string;
    fullName: string;
    age: number | string;
    gender: string;
    familyHistory?: string;
    hypertension?: string;
    diabetes?: string;
    chronicCardiac?: string[];
    renalPathologies?: string;
}

export interface RegistrationData {
    fullName?: string;
    email?: string;
    password?: string;
    age?: string | number;
    gender?: string;
    familyHistory?: string;
    hypertension?: string;
    diabetes?: string;
    chronicCardiac?: string[];
    renalPathologies?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    registrationData: RegistrationData | null;
}

// Initial State
const initialState: AuthState = {
    user: null,
    token: localStorage.getItem('token'),
    isLoading: false,
    error: null,
    registrationData: null,
};

// Async Thunks
// Login
export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: { email: string; password: string }, { rejectWithValue }) => {
        try {
            // Mock API call for now since we don't have a backend
            // const response = await api.post('/auth/login', credentials);
            // return response.data;

            // Simulating delay and success
            await new Promise(resolve => setTimeout(resolve, 1000));
            const mockResponse = {
                user: {
                    id: '1',
                    email: credentials.email,
                    fullName: 'Demo User',
                    age: 30,
                    gender: 'male',
                    name: 'User' // Keeping name for backward compatibility if needed, though strictly not in interface
                },
                token: 'mock-jwt-token'
            };
            return mockResponse;

        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

// Register
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: RegistrationData, { rejectWithValue }) => {
        try {
            // const response = await api.post('/auth/register', userData);
            // return response.data;

            await new Promise(resolve => setTimeout(resolve, 1000));
            const newUser: User = {
                id: '2',
                email: userData.email || '',
                fullName: userData.fullName || 'New User',
                age: userData.age || 0,
                gender: userData.gender || 'unknown',
                familyHistory: userData.familyHistory,
                hypertension: userData.hypertension,
                diabetes: userData.diabetes,
                chronicCardiac: userData.chronicCardiac,
                renalPathologies: userData.renalPathologies
            };
            return { user: newUser, token: 'mock-jwt-token-reg' };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

// Update Profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData: Partial<User>, { rejectWithValue }) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            return userData;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Update failed');
        }
    }
);

// Forgot Password
export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (_email: string, { rejectWithValue }) => {
        try {
            // Mock API call
            await new Promise(resolve => setTimeout(resolve, 1000));
            return { message: 'Password reset link sent to your email' };
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to process request');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.token = null;
            localStorage.removeItem('token');
            state.registrationData = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setRegistrationData: (state, action: PayloadAction<RegistrationData>) => {
            state.registrationData = { ...state.registrationData, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        // Login
        builder
            .addCase(loginUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(loginUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(loginUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });

        // Register
        builder
            .addCase(registerUser.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(registerUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                localStorage.setItem('token', action.payload.token);
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                if (state.user) {
                    state.user = { ...state.user, ...action.payload };
                }
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Forgot Password
            .addCase(forgotPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(forgotPassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(forgotPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { logout, clearError, setRegistrationData } = authSlice.actions;
export default authSlice.reducer;
