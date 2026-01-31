import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { ForgotPassword } from '@/pages/ForgotPassword';
import { RegisterStep1 } from '@/pages/RegisterStep1';
import { RegisterStep2 } from '@/pages/RegisterStep2';
import { VerifyOTPPage } from '@/pages/VerifyOTPPage';
import { VerifyResetOTP } from '@/pages/VerifyResetOTPPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { Dashboard } from '@/pages/Dashboard';
import { ProfilePage } from '@/pages/ProfilePage';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PublicRoute } from '@/components/PublicRoute';

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
        children: [
            {
                element: <PublicRoute />,
                children: [
                    {
                        index: true,
                        element: <LandingPage />,
                    },
                    {
                        path: "login",
                        element: <LoginPage />,
                    },
                    {
                        path: "forgot-password",
                        element: <ForgotPassword />,
                    },
                    {
                        path: "register",
                        element: <RegisterStep1 />,
                    },
                    {
                        path: "register/step-2",
                        element: <RegisterStep2 />,
                    },
                    {
                        path: "verify-otp",
                        element: <VerifyOTPPage />,
                    },
                    {
                        path: "verify-reset-otp",
                        element: <VerifyResetOTP />,
                    },
                    {
                        path: "reset-password",
                        element: <ResetPasswordPage />,
                    },
                ]
            },
            {
                element: <ProtectedRoute />,
                children: [
                    {
                        path: "dashboard",
                        element: <Dashboard />,
                    },
                    {
                        path: "profile",
                        element: <ProfilePage />,
                    },
                ],
            },
            {
                path: "*",
                element: <Navigate to="/" replace />,
            },
        ],
    },
]);
