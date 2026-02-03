import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { resetPassword, clearError } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { getTranslatedMessage, validateResetPassword, AuthErrors } from '@/utils/helper';

export function ResetPasswordPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [localError, setLocalError] = useState('');
    const [errors, setErrors] = useState<AuthErrors>({});
    const [successMessage, setSuccessMessage] = useState('');
    const [showPasswords, setShowPasswords] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');
        setErrors({});

        const newErrors: AuthErrors = {};
        validateResetPassword({ password, confirmPassword }, newErrors, t);

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            setLocalError(Object.values(newErrors).join('\n'));
            return;
        }

        const resultAction = await dispatch(resetPassword(password));
        if (resetPassword.fulfilled.match(resultAction)) {
            const payload = resultAction.payload as any;
            const message = payload?.msg || payload?.message || t('auth.resetSuccess');
            setSuccessMessage(getTranslatedMessage(message, t));
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        }
    };

    return (
        <AuthLayout
            title={t('auth.resetPasswordTitle')}
            subtitle={t('auth.resetPasswordSubtitle')}
        >
            {(error || localError) && (
                <AlertCard
                    variant="error"
                    message={getTranslatedMessage(localError || error || '', t)}
                    className="mb-6"
                    onClose={() => {
                        setLocalError('');
                        dispatch(clearError());
                    }}
                />
            )}

            {successMessage && (
                <AlertCard
                    variant="success"
                    message={successMessage}
                    className="mb-6"
                    onClose={() => setSuccessMessage('')}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="password"
                    name="password"
                    label={t('profile.newPassword')}
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    showPassword={showPasswords}
                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                    error={errors.password}
                />

                <FormInput
                    id="confirmPassword"
                    name="confirmPassword"
                    label={t('profile.confirmNewPassword')}
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    placeholder={t('auth.passwordPlaceholder')}
                    showPassword={showPasswords}
                    onTogglePassword={() => setShowPasswords(!showPasswords)}
                    error={errors.confirmPassword}
                />

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="mr-2" /> : t('auth.resetPasswordBtn')}
                </Button>
            </form>
        </AuthLayout>
    );
}
