import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { verifyOTP, clearError, resendVerificationOTP } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { getTranslatedMessage } from '@/utils/helper';

export function VerifyOTPPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { registrationData, isLoading, error } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();
    const location = useLocation();

    // Get email from Redux OR navigation state
    const email = registrationData?.email || location.state?.email;

    const [timer, setTimer] = useState(30);
    const [otp, setOtp] = useState('');
    const [localError, setLocalError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        if (!registrationData?.email && !location.state?.email) {
            navigate('/register');
        }
    }, [registrationData, location.state, navigate]);

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

        await dispatch(resendVerificationOTP(email));
        setTimer(30);
        setSuccessMessage(t('auth.otpResent'));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);

        if (!otp || otp.length < 6) {
            setLocalError(t('auth.invalidOTP') || 'Please enter a valid OTP');
            return;
        }

        if (!email) return;

        const resultAction = await dispatch(verifyOTP({
            email: email,
            otp
        }));

        if (verifyOTP.fulfilled.match(resultAction)) {
            const payload = resultAction.payload as any;
            const message = payload?.msg || payload?.message || t('auth.verifiedSuccess');
            setSuccessMessage(getTranslatedMessage(message, t));
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else if (verifyOTP.rejected.match(resultAction)) {
            const errorPayload = typeof resultAction.payload === 'string' ? resultAction.payload : 'Verification failed';
            setLocalError(errorPayload);
        }
    };
    const getErrorMessage = () => {
        const msg = localError || error;
        if (msg === 'Invalid OTP or OTP has expired') {
            return t('auth.invalidOrExpiredOTP');
        }
        return msg ? t(msg) : '';
    };

    return (
        <AuthLayout
            title={t('auth.verifyAccount')}
            subtitle={t('auth.enterCode')}
        >
            <div className="mb-8">
                <Link to="/register/step-2" className="inline-flex items-center gap-2 mb-6">
                    <span className="text-2xl font-semibold text-gray-900">{t('common.heartAI')}</span>
                </Link>

                {/* Progress Indicator */}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                        <p className="text-sm text-cyan-600 font-medium mt-2">{t('auth.verification')}</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <AlertCard
                    variant="success"
                    message={successMessage}
                    className="mb-6"
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            {(localError || error) && (
                <AlertCard
                    variant="error"
                    message={getErrorMessage()}
                    className="mb-6"
                    onClose={() => {
                        setLocalError(null);
                        dispatch(clearError());
                    }}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-700 mb-6">
                    {t('auth.codeSentTo')} <strong>{email}</strong>.
                </div>

                <FormInput
                    id="otp"
                    name="otp"
                    type="text"
                    label={t('auth.verificationCode')}
                    value={otp}
                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setOtp(e.target.value)}
                    placeholder={t('auth.enter6DigitCode')}
                    error={(localError || error) || undefined}
                    required
                />

                <div className="flex flex-col gap-4">
                    <div className="flex gap-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate('/register/step-2')}
                            className="flex-1 py-6 rounded-xl text-lg"
                        >
                            <ChevronLeft className="w-5 h-5 mr-2 rtl:rotate-180" />
                            {t('common.back')}
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                        >
                            {isLoading ? <Loader className="mr-2" /> : t('auth.verifyBtn')}
                        </Button>
                    </div>

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
