import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation, Trans } from 'react-i18next';
import { ChevronLeft, Check } from 'lucide-react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, setRegistrationData } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import { RegisterData } from '@/services/apiTypes';
import AlertCard from '@/components/ui/alert-card';

import { FormRadioGroup } from '@/components/ui/form-radio-group';
import { FormCheckboxGroup } from '@/components/ui/form-checkbox-group';
import { validateRegisterStep2, AuthErrors, getTranslatedMessage } from '@/utils/helper';
import { TermsDialog } from '@/components/legal/terms-dialog';

export function RegisterStep2() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { registrationData, isLoading } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    useEffect(() => {
        if (!registrationData?.email) {
            navigate('/register');
        }
    }, [registrationData, navigate]);

    const [formData, setFormData] = useState({
        familyHistory: registrationData?.familyHistory || '',
        hypertension: registrationData?.hypertension || '',
        diabetes: registrationData?.diabetes || '',
        chronicCardiac: registrationData?.chronicCardiac || [],
        renalPathologies: registrationData?.renalPathologies || '',
        acceptTerms: registrationData?.acceptTerms || false,
    });
    const [termsOpen, setTermsOpen] = useState(false);

    const setAcceptTerms = (acceptTerms: boolean) => {
        setFormData(prev => ({ ...prev, acceptTerms }));
        if (acceptTerms && errors.acceptTerms) {
            setErrors(prev => ({ ...prev, acceptTerms: undefined }));
        }
    };
    const [errors, setErrors] = useState<AuthErrors>({});
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleRadioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleCheckboxChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            chronicCardiac: prev.chronicCardiac.includes(value)
                ? prev.chronicCardiac.filter(item => item !== value)
                : [...prev.chronicCardiac, value]
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: AuthErrors = {};
        validateRegisterStep2(formData, newErrors, t);

        if (Object.keys(newErrors).length > 0) {
            setErrors({ ...newErrors, general: Object.values(newErrors).join('\n') });
            return;
        }

        dispatch(setRegistrationData(formData));
        const fullData = { ...registrationData, ...formData } as RegisterData;

        try {
            const resultAction = await dispatch(registerUser(fullData));

            if (registerUser.fulfilled.match(resultAction)) {
                setSuccessMessage(t('auth.registrationSuccess'));
                setTimeout(() => {
                    navigate('/verify-otp', { state: { email: registrationData?.email, mode: 'register' } });
                }, 2000);
            } else {
                if (registerUser.rejected.match(resultAction)) {
                    const errorPayload = typeof resultAction.payload === 'string' ? resultAction.payload : 'Unknown error';
                    setErrors({ ...errors, general: `Registration failed: ${errorPayload}` } as any);
                }
            }
        } catch (err) {
            setErrors({ ...errors, general: 'Unexpected error during registration' } as any);
        }
    };

    const yesNoOptions = [
        { label: t('auth.yes'), value: 'yes' },
        { label: t('auth.no'), value: 'no' }
    ];

    const cardiacOptions = [
        { label: t('auth.mi'), value: 'mi' },
        { label: t('auth.heartFailure'), value: 'heart-failure' },
        { label: t('auth.ischemia'), value: 'ischemia' },
    ];

    return (
        <AuthLayout
            title={t('auth.medicalInfo')}
            subtitle={t('auth.step2Subtitle')}
        >
            <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                    <span className="text-2xl font-semibold text-gray-900">{t('common.heartAI')}</span>
                </Link>

                {/* Progress Indicator */}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                        <p className="text-sm text-cyan-600 font-medium mt-2">{t('auth.personalInfo')}</p>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                        <p className="text-sm text-cyan-600 font-medium mt-2">{t('auth.medicalInfo')}</p>
                    </div>
                </div>
            </div>

            {successMessage && (
                <AlertCard
                    variant="success"
                    message={getTranslatedMessage(successMessage, t)}
                    className="mb-6"
                    onClose={() => setSuccessMessage(null)}
                />
            )}

            {errors.general && (
                <AlertCard
                    variant="error"
                    message={getTranslatedMessage(errors.general, t)}
                    className="mb-6"
                    onClose={() => setErrors({ ...errors, general: undefined })}
                />
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormRadioGroup
                    label={t('auth.familyHistory')}
                    name="familyHistory"
                    value={formData.familyHistory}
                    options={yesNoOptions}
                    onChange={handleRadioChange}
                    error={errors.familyHistory}
                    required
                />

                <FormRadioGroup
                    label={t('auth.hypertension')}
                    name="hypertension"
                    value={formData.hypertension}
                    options={yesNoOptions}
                    onChange={handleRadioChange}
                    error={errors.hypertension}
                    required
                />

                <FormRadioGroup
                    label={t('auth.diabetes')}
                    name="diabetes"
                    value={formData.diabetes}
                    options={yesNoOptions}
                    onChange={handleRadioChange}
                    error={errors.diabetes}
                    required
                />

                <FormCheckboxGroup
                    label={t('auth.chronicCardiac')}
                    selectedValues={formData.chronicCardiac}
                    options={cardiacOptions}
                    onChange={handleCheckboxChange}
                />

                <FormRadioGroup
                    label={t('auth.renalPathologies')}
                    name="renalPathologies"
                    value={formData.renalPathologies}
                    options={yesNoOptions}
                    onChange={handleRadioChange}
                    error={errors.renalPathologies}
                    required
                />

                {/* Consent: Terms & Privacy Policy (analysis + de-identified training use + medical disclaimer) */}
                <div>
                    <label
                        className={`flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-colors ${
                            formData.acceptTerms ? 'border-cyan-600 bg-cyan-50' : errors.acceptTerms ? 'border-red-500' : 'border-gray-300 hover:border-cyan-500'
                        }`}
                    >
                        <input
                            type="checkbox"
                            checked={formData.acceptTerms}
                            onChange={(e) => setAcceptTerms(e.target.checked)}
                            className="sr-only"
                        />
                        <span
                            className={`mt-0.5 w-6 h-6 shrink-0 border-2 rounded-md flex items-center justify-center transition-colors ${
                                formData.acceptTerms ? 'bg-cyan-600 border-cyan-600' : 'border-gray-300'
                            }`}
                        >
                            {formData.acceptTerms && <Check className="w-4 h-4 text-white" />}
                        </span>
                        <span className="text-sm text-gray-700 leading-relaxed">
                            <Trans
                                i18nKey="terms.consent"
                                components={{
                                    termsLink: (
                                        <button
                                            type="button"
                                            onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                                            className="text-cyan-700 font-semibold underline hover:text-cyan-800 cursor-pointer"
                                        />
                                    ),
                                }}
                            />
                        </span>
                    </label>
                    {errors.acceptTerms && <p className="text-red-500 text-sm mt-1">{errors.acceptTerms}</p>}
                </div>

                <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} onAccept={() => setAcceptTerms(true)} />

                <div className="flex gap-4 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            dispatch(setRegistrationData(formData));
                            navigate('/register');
                        }}
                        className="flex-1 py-6 rounded-xl text-lg"
                    >
                        <ChevronLeft className="w-5 h-5 mr-2 rtl:rotate-180" />
                        {t('auth.back')}
                    </Button>
                    <Button
                        type="submit"
                        disabled={isLoading}
                        className="flex-1 bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                    >
                        {isLoading ? <Loader className="mr-2" /> : t('auth.createAccount')}
                    </Button>
                </div>
            </form>
        </AuthLayout>
    );
}
