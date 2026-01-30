import api from './api';
import { UserProfile, ApiResponse } from './apiTypes';

export const profileService = {
    getProfile: async (): Promise<UserProfile> => {
        const response = await api.get<ApiResponse<UserProfile>>('/users/profile');
        return response.data.data!;
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        const response = await api.put<ApiResponse<UserProfile>>('/users/profile', data);
        return response.data.data!;
    }
};
