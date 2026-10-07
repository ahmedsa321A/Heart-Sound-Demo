import type { authService } from '../authService';
import type { profileService } from '../profileService';
import { User, UserProfile } from '../apiTypes';
import { loadJson, saveJson } from './demoStorage';

/**
 * Demo auth — always signed in as a demo user. No network calls, no database.
 * Implements the same interface as authService/profileService so the auth slice can swap them.
 */
const STORAGE_KEY = 'heartai.demoUser';

const DEFAULT_USER: User = {
    id: 'demo_user_001',
    fullName: 'Demo User',
    email: 'demo@heartai.app',
    age: 30,
    gender: 'Male',
};

let demoUser: User = loadJson(STORAGE_KEY, DEFAULT_USER);

const ok = async () => ({ success: true, msg: 'Demo mode' });

export const demoAuthService: typeof authService = {
    register: ok,
    verifyOTP: async () => ({ user: demoUser, msg: 'Demo mode', success: true }),
    login: async () => {
        await new Promise((resolve) => setTimeout(resolve, 300));
        return { user: demoUser, msg: 'Demo login successful', success: true };
    },
    logout: ok,
    getCurrentUser: async () => demoUser,
    forgotPassword: ok,
    verifyResetOTP: ok,
    resetPassword: ok,
    changePassword: ok,
    resendVerificationOTP: ok,
};

export const demoProfileService: typeof profileService = {
    getProfile: async () => demoUser,
    updateProfile: async (data: Partial<UserProfile>) => {
        demoUser = { ...demoUser, ...data };
        saveJson(STORAGE_KEY, demoUser);
        return demoUser;
    },
};
