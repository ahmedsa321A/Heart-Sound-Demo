import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { verifyResetOTP, forgotPassword } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { getTranslatedMessage } from '@/utils/helper';

export function VerifyResetOTP() {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();
    const { isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const email = location.state?.email;

    const [otp, setOtp] = useState('');
    const [localError, setLocalError] = useState('');
    const [timer, setTimer] = useState(30);

    // Timer effect
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timer]);

    const handleResend = async () => {
        if (timer > 0 || !email) return;

        // Use forgotPassword action to resend the code
        await dispatch(forgotPassword(email));
        setTimer(30);
        setSuccessMessage(t('auth.otpResent'));
    };

    if (!email) {
        return <Navigate to="/forgot-password" />;
    }

    const [successMessage, setSuccessMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');
        setSuccessMessage('');

        if (otp.length !== 6) {
            setLocalError(t('auth.otpLengthError'));
            return;
        }

        if (!/^\d+$/.test(otp)) {
            setLocalError('Verification code must contain only numbers.');
            return;
        }

        const resultAction = await dispatch(verifyResetOTP({ email, otp }));
        if (verifyResetOTP.fulfilled.match(resultAction)) {
            const payload = resultAction.payload as any;
            const message = payload?.msg || payload?.message || t('auth.verifiedSuccess');
            setSuccessMessage(getTranslatedMessage(message, t));
            setTimeout(() => {
                navigate('/reset-password');
            }, 3000);
        }
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
                    message={getTranslatedMessage(localError || error || '', t)}
                    className="mb-6"
                    onClose={() => {
                        setLocalError('');
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
                    id="otp"
                    name="otp"
                    label={t('auth.verificationCode')}
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder={t('auth.otpPlaceholder')}
                    maxLength={6}
                    className="text-center text-2xl tracking-widest"
                />

                <div className="flex flex-col gap-4">
                    <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader className="mr-2" /> : t('auth.verifyBtn')}
                    </Button>

                    <div className="text-center">
                        <button
                            type="button"
                            onClick={handleResend}
                            disabled={timer > 0 || isLoading}
                            className={`text-sm font-medium transition-colors ${timer > 0
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-cyan-600 hover:text-cyan-700 cursor-pointer'
                                }`}
                        >
                            {timer > 0
                                ? `${t('auth.resendIn')} ${timer}s`
                                : t('auth.resendOTP')}
                        </button>
                    </div>
                </div>
            </form>
        </AuthLayout>
    );
}


