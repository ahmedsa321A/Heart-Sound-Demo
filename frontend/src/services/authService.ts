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
        if (response.data.success) {
            // User is now persisted in Redux via Slice, not localStorage
        }
        return response.data;
    },

    logout: async (): Promise<ApiResponse> => {
        try {
            const response = await api.post<ApiResponse>('/auth/logout');
            return response.data;
        } finally {
            // localStorage cleanup not needed

        }
    },

    getCurrentUser: async (): Promise<User | null> => {
        try {
            const response = await api.get<{ success: boolean; data: User }>('/auth/me');
            return response.data.data;
        } catch (error) {
            return null;
        }
    }
};
