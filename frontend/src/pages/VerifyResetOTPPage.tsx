import { useState } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { verifyResetOTP } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';

export function VerifyResetOTP() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const email = location.state?.email;

    const [otp, setOtp] = useState('');
    const [localError, setLocalError] = useState('');

    if (!email) {
        return <Navigate to="/forgot-password" />;
    }

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (otp.length !== 6) {
            setLocalError(t('auth.otpLengthError'));
            return;
        }

        const resultAction = await dispatch(verifyResetOTP({ email, otp }));
        if (verifyResetOTP.fulfilled.match(resultAction)) {
            navigate('/reset-password');
        }
    };

    const getErrorMessage = () => {
        if (localError) return localError;
        if (error === 'Invalid or expired OTP') return t('auth.invalidOrExpiredOTP');
        return error || '';
    };

    return (
        <AuthLayout
            title={t('auth.verifyAccount')}
            subtitle={`${t('auth.codeSentTo')} ${email}`}
        >
            <div className="mb-8">
                <Link to="/forgot-password" className="inline-flex items-center gap-2 mb-6 text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                    ← {t('common.back')}
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.verifyAccount')}</h1>
                <p className="text-gray-600">{t('auth.enterCode')}</p>
            </div>

            {(error || localError) && (
                <AlertCard
                    variant="error"
                    message={getErrorMessage()}
                    className="mb-6"
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="otp"
                    name="otp"
                    label="Verification Code"
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t('auth.otpPlaceholder')}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                />

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="mr-2" /> : t('auth.verifyBtn')}
                </Button>
            </form>
        </AuthLayout>
    );
}


