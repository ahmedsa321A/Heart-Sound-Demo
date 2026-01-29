import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { AuthLayout } from '@/components/layout/auth-layout';
import { Button } from '@/components/ui/button';
import FormInput from '@/components/ui/form-input';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { validateLogin, AuthErrors } from '@/utils/helper';

export function LoginPage() {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { isLoading, error, user } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();

    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [errors, setErrors] = useState<AuthErrors>({});

    useEffect(() => {
        dispatch(clearError());
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors: AuthErrors = {};
        validateLogin(formData, newErrors);

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        console.log(formData);

        // const resultAction = await dispatch(loginUser(formData));
        // if (loginUser.fulfilled.match(resultAction)) {
        //     navigate('/dashboard');
        // }
    };

    return (
        <AuthLayout
            title={t('auth.welcomeBack')}
            subtitle={t('auth.accessDashboard')}
        >
            <div className="mb-8">
                <Link to="/" className="inline-flex items-center gap-2 mb-6">
                    <span className="text-2xl font-semibold text-gray-900">{t('common.heartAI')}</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.signInTitle')}</h1>
                <p className="text-gray-600">{t('auth.enterCredentials')}</p>
            </div>

            {error && (
                <Alert variant="destructive" className="mb-6">
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    showPassword={showPassword}
                    onTogglePassword={() => setShowPassword(!showPassword)}
                    error={errors.password}
                />

                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            className="w-4 h-4 text-cyan-600 border-gray-300 rounded focus:ring-cyan-500"
                        />
                        <span className="text-sm text-gray-600">{t('auth.rememberMe')}</span>
                    </label>
                    <Link to="/forgot-password" className="text-sm text-cyan-600 hover:text-cyan-700 font-medium">
                        {t('auth.forgotPassword')}
                    </Link>
                </div>

                <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-cyan-600 to-teal-600 text-white py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all font-medium shadow-lg shadow-cyan-500/30 text-lg"
                    disabled={isLoading}
                >
                    {isLoading ? <Loader className="mr-2" /> : t('auth.signIn')}
                </Button>
            </form>

            <div className="mt-6 text-center">
                <p className="text-gray-600">
                    {t('auth.dontHaveAccount')}{' '}
                    <Link to="/register" className="text-cyan-600 hover:text-cyan-700 font-medium">
                        {t('auth.register')}
                    </Link>
                </p>
            </div>
        </AuthLayout>
    );
}
