export interface ApiResponse<T = any> {
    success?: boolean;
    msg?: string;
    data?: T;
}

// Authentication Types
export interface RegisterData {
    fullName: string;
    email: string;
    password?: string;
    age?: number;
    gender?: string;
    familyHistory?: string;
    hypertension?: string;
    diabetes?: string;
    renalPathologies?: string;
    chronicCardiac?: string[];
}

export interface LoginCredentials {
    email: string;
    password?: string;
}

export interface User {
    id: string;
    fullName: string;
    email: string;
    age?: number;
    gender?: string;
}

export interface AuthResponse {
    token: string;
    user: User;
    msg: string;
    success: boolean;
}

export interface VerifyOtpData {
    email: string;
    otp: string;
}

// Profile Types
export interface UserProfile extends User {
    avatar?: string;
    phoneNumber?: string;
    address?: string;
    dateOfBirth?: string;
}

// Analysis Types
export interface AnalysisResultDetails {
    diagnosis: string;
    confidence: number;
    details: string;
    severity?: 'low' | 'medium' | 'high';
    recommendations?: string[];
}

export interface AnalysisResponse extends AnalysisResultDetails {
    id: string;
    createdAt: string;
    audioUrl: string;
}

// History Types
export interface HistoryItem {
    id: string;
    date: string;
    diagnosis: string;
    status: 'normal' | 'attention';
    audioUrl?: string; // Optional if we don't always load the audio for list items
}
