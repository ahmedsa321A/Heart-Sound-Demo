import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { RegisterStep1 } from '@/pages/RegisterStep1';
import { RegisterStep2 } from '@/pages/RegisterStep2';
import { Dashboard } from '@/pages/Dashboard';
import { ProfilePage } from '@/pages/ProfilePage';
import { useAppSelector } from '@/store';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAppSelector((state) => state.auth);
    const token = localStorage.getItem('token');

    if (!user && !token) {
        return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
};

export default function App() {
    const { i18n } = useTranslation();

    useEffect(() => {
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/register" element={<RegisterStep1 />} />
            <Route path="/register/step-2" element={<RegisterStep2 />} />
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <ProfilePage />
                    </ProtectedRoute>
                }
            />
            {/* Redirect unknown routes to landing */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
