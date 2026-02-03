import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Save, ArrowLeft, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateProfile, changePassword, logout, clearError } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { Navbar } from '@/components/layout/navbar';

import { useNavigate } from 'react-router-dom';

import { AuthErrors, validateProfile, validateChangePassword, getTranslatedMessage } from '@/utils/helper';

export function ProfilePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user, isLoading, error } = useAppSelector((state) => state.auth);

    const [name, setName] = useState(user?.fullName || '');
    const [age, setAge] = useState<string | number>(user?.age || '');
    const [email, setEmail] = useState(user?.email || '');
    const [successMessage, setSuccessMessage] = useState('');
    const [profileErrors, setProfileErrors] = useState<AuthErrors>({});
    const [passwordErrors, setPasswordErrors] = useState<AuthErrors>({});
    const [validationError, setValidationError] = useState<string | null>(null);
    const [passwordFeedback, setPasswordFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPasswords, setShowNewPasswords] = useState(false);

    const isRTL = i18n.dir() === 'rtl';

    useEffect(() => {
        if (user) {
            setName(user.fullName || '');
            setAge(user.age || '');
            setEmail(user.email || '');
        }
    }, [user]);

    const handleLogout = () => {
        dispatch(logout());
        navigate('/login');
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setSuccessMessage('');
        setValidationError(null);
        setProfileErrors({});
        setPasswordFeedback(null);

        const errors: AuthErrors = {};
        validateProfile({ fullName: name, age }, errors, t);

        if (Object.keys(errors).length > 0) {
            setProfileErrors(errors);
            setValidationError(Object.values(errors).join('\n'));
            return;
        }

        const resultAction = await dispatch(updateProfile({ fullName: name, age: Number(age) }));
        if (updateProfile.fulfilled.match(resultAction)) {
            setSuccessMessage(t('profile.updateSuccess'));
            setTimeout(() => setSuccessMessage(''), 3000);
        }
    };



    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
            <Navbar onLogout={handleLogout} userName={user?.fullName} isAuthenticated={true} />

            <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6 flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                    >
                        {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                        {t('common.back')}
                    </Button>
                </div>

                <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-8 py-10 text-white">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                                <User className="w-10 h-10 text-white" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold mb-2">{t('profile.title')}</h1>
                                <p className="text-cyan-100">{t('profile.subtitle')}</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-8">
                        {successMessage && (
                            <AlertCard
                                variant="success"
                                message={successMessage}
                                onClose={() => setSuccessMessage('')}
                                className="mb-6"
                            />
                        )}

                        {(error || validationError) && (
                            <AlertCard
                                variant="error"
                                message={getTranslatedMessage(error || '', t) || validationError || ''}
                                className="mb-6"
                                onClose={() => {
                                    setValidationError(null);
                                    dispatch(clearError());
                                }}
                            />
                        )}

                        <form onSubmit={handleUpdate} className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
                                {t('profile.personalInfo')}
                            </h2>

                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.name')}
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rtl:right-4 rtl:left-auto" />
                                        <Input
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className={`pl-12 py-6 rounded-xl rtl:pr-12 rtl:pl-3 ${profileErrors.fullName ? 'border-red-500' : ''}`}
                                        />
                                    </div>
                                    {profileErrors.fullName && <p className="text-red-500 text-sm mt-1">{profileErrors.fullName}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.email')}
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 rtl:right-4 rtl:left-auto" />
                                        <Input
                                            value={email}
                                            disabled
                                            className="pl-12 py-6 rounded-xl bg-gray-50 text-gray-500 rtl:pr-12 rtl:pl-3"
                                        />
                                    </div>
                                    <p className="mt-1 text-sm text-gray-500">
                                        {t('profile.emailCannotChange')}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('auth.age')}
                                        </label>
                                        <Input
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            type="number"
                                            className={`py-6 rounded-xl ${profileErrors.age ? 'border-red-500' : ''}`}
                                        />
                                        {profileErrors.age && <p className="text-red-500 text-sm mt-1">{profileErrors.age}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            {t('auth.gender')}
                                        </label>
                                        <Input
                                            value={user?.gender ? t(`auth.${user.gender.toLowerCase()}`) : ''}
                                            disabled
                                            className="py-6 rounded-xl bg-gray-50 text-gray-500"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white px-8 py-6 rounded-xl hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-500/30 flex items-center gap-2"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <Loader className="w-5 h-5" />
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            {t('profile.saveChanges')}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>

                    <div className="p-8 border-t bg-gray-50/50">
                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            setPasswordErrors({});
                            setPasswordFeedback(null);
                            const form = e.target as HTMLFormElement;
                            const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                            const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                            const errors: AuthErrors = {};
                            validateChangePassword({ currentPassword, newPassword, confirmPassword }, errors, t);

                            if (Object.keys(errors).length > 0) {
                                setPasswordErrors(errors);
                                setPasswordFeedback({ type: 'error', message: Object.values(errors).join('\n') });
                                return;
                            }

                            const result = await dispatch(changePassword({ currentPassword, newPassword, confirmPassword }));

                            // Prevent global error from showing at top
                            dispatch(clearError());

                            if (changePassword.fulfilled.match(result)) {
                                const payload = result.payload as any;
                                const message = payload?.msg || payload?.message || t('profile.passwordChangedSuccess');
                                setPasswordFeedback({ type: 'success', message: getTranslatedMessage(message, t) });
                                form.reset();
                                setTimeout(() => {
                                    setPasswordFeedback(null);
                                    dispatch(logout());
                                    navigate('/login');
                                }, 2000);
                            } else if (changePassword.rejected.match(result)) {
                                const payload = result.payload as any;
                                const errorMessage = typeof payload === 'string' ? payload : (payload?.msg || payload?.message || 'Change password failed');
                                setPasswordFeedback({ type: 'error', message: getTranslatedMessage(errorMessage, t) });
                            }
                        }} className="space-y-6 max-w-2xl">
                            {passwordFeedback && (
                                <AlertCard
                                    variant={passwordFeedback.type}
                                    message={passwordFeedback.message}
                                    onClose={() => setPasswordFeedback(null)}
                                    className="mb-6"
                                />
                            )}
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
                                {t('profile.changePasswordTitle')}
                            </h2>

                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.currentPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="currentPassword"
                                            type={showCurrentPassword ? "text" : "password"}
                                            className={`py-6 rounded-xl pr-12 ${passwordErrors.currentPassword ? 'border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-4"
                                        >
                                            {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordErrors.currentPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.currentPassword}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.newPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="newPassword"
                                            type={showNewPasswords ? "text" : "password"}
                                            className={`py-6 rounded-xl pr-12 ${passwordErrors.newPassword ? 'border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPasswords(!showNewPasswords)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-4"
                                        >
                                            {showNewPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordErrors.newPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.newPassword}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        {t('profile.confirmNewPassword')}
                                    </label>
                                    <div className="relative">
                                        <Input
                                            name="confirmPassword"
                                            type={showNewPasswords ? "text" : "password"}
                                            className={`py-6 rounded-xl pr-12 ${passwordErrors.confirmPassword ? 'border-red-500' : ''}`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPasswords(!showNewPasswords)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 rtl:right-auto rtl:left-4"
                                        >
                                            {showNewPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                    {passwordErrors.confirmPassword && <p className="text-red-500 text-sm mt-1">{passwordErrors.confirmPassword}</p>}
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="px-8 py-6 rounded-xl border-cyan-600 text-cyan-700 hover:bg-cyan-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5" /> : t('profile.updatePasswordBtn')}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
