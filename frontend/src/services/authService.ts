import api from './api';
import { RegisterData, LoginCredentials, AuthResponse, VerifyOtpData, ApiResponse, User } from './apiTypes';

export const authService = {
    register: async (userData: RegisterData): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/register', userData);
        return response.data;
    },

    verifyOTP: async (data: VerifyOtpData): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/verify', data);
        return response.data;
    },

    login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', credentials);
        return response.data;
    },

    logout: async (): Promise<ApiResponse> => {
        try {
            const response = await api.post<ApiResponse>('/auth/logout');
            return response.data;
        } finally {


        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await api.get<{ success: boolean; data: User }>('/auth/me');
            return response.data.data;
        } catch (error) {
            return null;
        }
    },

    forgotPassword: async (email: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/forgot-password', { email });
        return response.data;
    },

    verifyResetOTP: async (data: { email: string; otp: string }): Promise<ApiResponse & { expiresIn?: number }> => {
        const response = await api.post<ApiResponse & { expiresIn?: number }>('/auth/verify-reset-otp', data);
        return response.data;
    },

    resetPassword: async (newPassword: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/reset-password', { newPassword });
        return response.data;
    },

    changePassword: async (data: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/change-password', data);
        return response.data;
    },

    resendVerificationOTP: async (email: string): Promise<ApiResponse> => {
        const response = await api.post<ApiResponse>('/auth/resend-otp', { email });
        return response.data;
    }
};
