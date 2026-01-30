import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { User, RegisterData, LoginCredentials } from '@/services/apiTypes';

interface AuthState {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    error: string | null;
    registrationData: Partial<RegisterData> | null;
}

// Initial State
const initialState: AuthState = {
    user: null,
    token: null,
    isLoading: false,
    error: null,
    registrationData: null,
};


export const loginUser = createAsyncThunk(
    'auth/login',
    async (credentials: LoginCredentials, { rejectWithValue }) => {
        try {
            const response = await authService.login(credentials);
            if (!response.success) {
                return rejectWithValue(response.msg || 'Login failed');
            }
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Login failed');
        }
    }
);

// Register
export const registerUser = createAsyncThunk(
    'auth/register',
    async (userData: RegisterData, { rejectWithValue }) => {
        try {
            const response = await authService.register(userData);
            if (!response.success) {
                return rejectWithValue(response.msg || 'Registration failed');
            }
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const verifyOTP = createAsyncThunk(
    'auth/verifyOTP',
    async (data: { email: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await authService.verifyOTP(data);
            if (!response.success) {
                return rejectWithValue(response.msg || 'Verification failed');
            }
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Verification failed');
        }
    }
);

// Update Profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData: Partial<User>, { rejectWithValue }) => {
        try {
            const response = await profileService.updateProfile(userData as any);
            return response;
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

// Check Auth Status
export const checkAuth = createAsyncThunk(
    'auth/checkAuth',
    async (_, { rejectWithValue }) => {
        try {
            const user = await authService.getCurrentUser();
            if (!user) {
                return rejectWithValue('Not authenticated');
            }
            return user;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to check auth');
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
            state.registrationData = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setRegistrationData: (state, action: PayloadAction<Partial<RegisterData>>) => {
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
            .addCase(registerUser.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(registerUser.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Verify OTP
            .addCase(verifyOTP.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyOTP.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
            })
            .addCase(verifyOTP.rejected, (state, action) => {
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
            })
            // Check Auth
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.user = null;
            });
    },
});

export const { logout, clearError, setRegistrationData } = authSlice.actions;
export default authSlice.reducer;
