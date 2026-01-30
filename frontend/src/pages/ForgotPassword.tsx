import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { forgotPassword, clearError } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { CheckCircle2 } from 'lucide-react';

export function ForgotPassword() {
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [validationError, setValidationError] = useState('');

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError('');

        if (!email) {
            setValidationError(t('auth.emailRequired') || 'Email is required');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setValidationError(t('auth.emailInvalid') || 'Invalid email address');
            return;
        }

        const resultAction = await dispatch(forgotPassword(email));
        if (forgotPassword.fulfilled.match(resultAction)) {
            setIsSubmitted(true);
        }
    };

    return (
        <AuthLayout
            title={t('auth.forgotPasswordTitle')}
            subtitle={t('auth.forgotPasswordSubtitle')}
        >
            <div className="mb-8">
                <Link to="/login" className="inline-flex items-center gap-2 mb-6 text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                    ← {t('auth.backToLogin')}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.forgotPasswordTitle')}</h1>
                <p className="text-gray-600">
                    {isSubmitted
                        ? t('auth.forgotPasswordSuccess')
                        : t('auth.forgotPasswordSubtitle')}
                </p>
            </div>

            {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <AlertCard
                        variant="success"
                        title="Check your email"
                        message={t('auth.forgotPasswordSuccess')}
                        dismissible={false}
                    />
                    <Link to="/login" className="w-full">
                        <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                            {t('auth.backToLogin')}
                        </Button>
                    </Link>
                </div>
            ) : (
                <>
                    {error && (
                        <AlertCard
                            variant="error"
                            message={error}
                            className="mb-6"
                        />
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <FormInput
                            id="email"
                            name="email"
                            label={t('auth.email')}
                            type="email"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (validationError) setValidationError('');
                            }}
                            placeholder="you@example.com"
                            error={validationError}
                        />

                        <Button
                            type="submit"
                            className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                            disabled={isLoading}
                        >
                            {isLoading ? <Loader className="mr-2" /> : t('auth.sendResetLink')}
                        </Button>
                    </form>
                </>
            )}
        </AuthLayout>
    );
}
