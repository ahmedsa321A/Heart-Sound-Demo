import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { authService } from '@/services/authService';
import { profileService } from '@/services/profileService';
import { User, RegisterData, LoginCredentials } from '@/services/apiTypes';

interface AuthState {
    user: User | null;
    isLoading: boolean;
    error: string | null;
    registrationData: Partial<RegisterData> | null;
    isInitialized: boolean;
}

// Initial State
const initialState: AuthState = {
    user: null,
    isLoading: false,
    error: null,
    registrationData: null,
    isInitialized: false,
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
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Login failed');
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
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Registration failed');
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
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Verification failed');
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
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Update failed');
        }
    }
);

// Forgot Password
export const forgotPassword = createAsyncThunk(
    'auth/forgotPassword',
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await authService.forgotPassword(email);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Failed to process request');
        }
    }
);

// Verify Reset OTP
export const verifyResetOTP = createAsyncThunk(
    'auth/verifyResetOTP',
    async (data: { email: string; otp: string }, { rejectWithValue }) => {
        try {
            const response = await authService.verifyResetOTP(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Verification failed');
        }
    }
);

// Reset Password
export const resetPassword = createAsyncThunk(
    'auth/resetPassword',
    async (newPassword: string, { rejectWithValue }) => {
        try {
            const response = await authService.resetPassword(newPassword);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Reset failed');
        }
    }
);

// Change Password
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (data: { currentPassword: string; newPassword: string; confirmPassword: string }, { rejectWithValue }) => {
        try {
            const response = await authService.changePassword(data);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Change password failed');
        }
    }
);

// Resend Verification OTP
export const resendVerificationOTP = createAsyncThunk(
    'auth/resendVerificationOTP',
    async (email: string, { rejectWithValue }) => {
        try {
            const response = await authService.resendVerificationOTP(email);
            return response;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.msg || error.response?.data?.message || 'Failed to resend OTP');
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

// Logout User
export const logoutUser = createAsyncThunk(
    'auth/logout',
    async (_, { rejectWithValue }) => {
        try {
            await authService.logout();
        } catch (error: any) {
            return rejectWithValue('Logout failed');
        }
    }
);

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        logout: (state) => {
            state.user = null;
            state.registrationData = null;
        },
        clearError: (state) => {
            state.error = null;
        },
        setRegistrationData: (state, action: PayloadAction<Partial<RegisterData>>) => {
            state.registrationData = { ...state.registrationData, ...action.payload };
        },
        clearRegistrationData: (state) => {
            state.registrationData = null;
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
                state.isInitialized = true;
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
            // Verify Reset OTP
            .addCase(verifyResetOTP.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(verifyResetOTP.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(verifyResetOTP.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Reset Password
            .addCase(resetPassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })
            // Change Password
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(changePassword.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Resend Verification OTP
            .addCase(resendVerificationOTP.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(resendVerificationOTP.fulfilled, (state) => {
                state.isLoading = false;
            })
            .addCase(resendVerificationOTP.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            })

            // Logout
            .addCase(logoutUser.fulfilled, (state) => {
                state.user = null;
                state.registrationData = null;
            })
            // Check Auth
            .addCase(checkAuth.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(checkAuth.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isInitialized = true;
                state.user = action.payload;
            })
            .addCase(checkAuth.rejected, (state) => {
                state.isLoading = false;
                state.isInitialized = true;
                if (!state.user) {
                    state.user = null;
                }
            });
    },
});

export const { logout, clearError, setRegistrationData, clearRegistrationData } = authSlice.actions;
export default authSlice.reducer;
