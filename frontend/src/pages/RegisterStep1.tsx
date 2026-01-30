import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronRight } from 'lucide-react';
import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import FormSelect from '@/components/ui/form-select';
import { useAppDispatch, useAppSelector } from '@/store';
import { setRegistrationData } from '@/store/slices/authSlice';
import { validateRegisterStep1, AuthErrors } from '@/utils/helper';

export function RegisterStep1() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { registrationData } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const [formData, setFormData] = useState({
        fullName: registrationData?.fullName || '',
        email: registrationData?.email || '',
        password: registrationData?.password || '',
        age: registrationData?.age || '',
        gender: registrationData?.gender || '',
    });
    const [errors, setErrors] = useState<AuthErrors>({});

    const [showPassword, setShowPassword] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { name: string; value: string } }) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: AuthErrors = {};
        validateRegisterStep1(formData, newErrors);

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        const dataToDispatch = {
            ...formData,
            age: formData.age ? Number(formData.age) : undefined
        };
        dispatch(setRegistrationData(dataToDispatch));

        console.log(formData);
        navigate('/register/step-2');
    };

    return (
        <AuthLayout
            title={t('auth.createAccount')}
            subtitle={t('auth.step1Subtitle')}
        >
            <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                    <span className="text-2xl font-semibold text-gray-900">{t('common.heartAI')}</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.createAccount')}</h1>

                {/* Progress Indicator */}
                <div className="mt-4 flex items-center gap-4">
                    <div className="flex-1">
                        <div className="h-2 bg-cyan-600 rounded-full"></div>
                        <p className="text-sm text-cyan-600 font-medium mt-2">{t('auth.personalInfo')}</p>
                    </div>
                    <div className="flex-1">
                        <div className="h-2 bg-gray-200 rounded-full"></div>
                        <p className="text-sm text-gray-400 mt-2">{t('auth.medicalInfo')}</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    id="fullName"
                    name="fullName"
                    label={t('auth.fullName')}
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Your Full Name"
                    error={errors.fullName}
                />

                <FormInput
                    id="email"
                    name="email"
                    label={t('auth.email')}
                    type="text"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    error={errors.email}
                />

                <FormInput
                    id="password"
                    name="password"
                    label={t('auth.password')}
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    error={errors.password}
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                />
                {!errors.password && <p className="text-sm text-gray-500 mt-1">{t('auth.passwordHint')}</p>}

                <div className="grid md:grid-cols-2 gap-6">
                    <FormInput
                        id="age"
                        name="age"
                        label={t('auth.age')}
                        type="number"
                        value={formData.age}
                        onChange={handleChange}
                        placeholder="25"
                        error={errors.age}
                    />

                    <FormSelect
                        id="gender"
                        name="gender"
                        label={t('auth.gender')}
                        value={formData.gender}
                        onChange={handleChange}
                        options={[
                            { value: 'male', label: t('auth.male') },
                            { value: 'female', label: t('auth.female') }
                        ]}
                        error={errors.gender}
                    />
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 text-lg"
                >
                    {t('auth.nextStep')}
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-600">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link to="/login" className="text-cyan-600 hover:text-cyan-700 font-medium">
                        {t('auth.signIn')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
