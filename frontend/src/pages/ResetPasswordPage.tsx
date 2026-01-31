import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetPassword } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { CheckCircle2 } from 'lucide-react';

export function ResetPassword() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (password.length < 8) {
            setLocalError('Password must be at least 8 characters');
            return;
        }

        if (password !== confirmPassword) {
            setLocalError('Passwords do not match');
            return;
        }

        const resultAction = await dispatch(resetPassword(password));
        if (resetPassword.fulfilled.match(resultAction)) {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <AuthLayout title="Password Reset" subtitle="Your password has been updated">
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <AlertCard
                        variant="success"
                        title="Success"
                        message="Your password has been reset successfully."
                        dismissible={false}
                    />
                    <Button onClick={() => navigate('/login')} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                        Back to Login
                    </Button>
                </div>
            </AuthLayout>
        );
    }

    return (
        <AuthLayout
            title="Reset Password"
            subtitle="Enter your new password"
        >
            {(error || localError) && (
                <AlertCard
                    variant="error"
                    message={localError || error || ''}
                    className="mb-6"
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="password"
                    name="password"
                    label="New Password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                />

                <FormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label="Confirm New Password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.passwordPlaceholder')}
                />

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="mr-2" /> : "Reset Password"}
                </Button>
            </form>
        </AuthLayout>
    );
}
