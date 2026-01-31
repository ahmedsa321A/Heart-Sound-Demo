import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Mail, Save, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppSelector, useAppDispatch } from '@/store';
import { updateProfile, changePassword } from '@/store/slices/authSlice';
import { Loader } from '@/components/ui/loader';
import AlertCard from '@/components/ui/alert-card';
import { Navbar } from '@/components/layout/navbar';
import { logout } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

export function ProfilePage() {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { user, isLoading, error } = useAppSelector((state) => state.auth);

    const [name, setName] = useState(user?.fullName || '');
    const [email, setEmail] = useState(user?.email || '');
    const [successMessage, setSuccessMessage] = useState('');

    const isRTL = i18n.dir() === 'rtl';

    useEffect(() => {
        if (user) {
            setName(user.fullName || '');
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

        const resultAction = await dispatch(updateProfile({ fullName: name }));
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

                        {error && (
                            <AlertCard
                                variant="error"
                                message={error}
                                className="mb-6"
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
                                            className="pl-12 py-6 rounded-xl rtl:pr-12 rtl:pl-3"
                                        />
                                    </div>
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
                                        Email cannot be changed
                                    </p>
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
                            const form = e.target as HTMLFormElement;
                            const currentPassword = (form.elements.namedItem('currentPassword') as HTMLInputElement).value;
                            const newPassword = (form.elements.namedItem('newPassword') as HTMLInputElement).value;
                            const confirmPassword = (form.elements.namedItem('confirmPassword') as HTMLInputElement).value;

                            if (newPassword !== confirmPassword) {
                                alert("New passwords do not match");
                                return;
                            }

                            const result = await dispatch(changePassword({ currentPassword, newPassword, confirmPassword }));
                            if (changePassword.fulfilled.match(result)) {
                                setSuccessMessage('Password changed successfully');
                                form.reset();
                                setTimeout(() => setSuccessMessage(''), 3000);
                            }
                        }} className="space-y-6 max-w-2xl">
                            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b pb-2">
                                Change Password
                            </h2>

                            <div className="grid gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Current Password
                                    </label>
                                    <Input
                                        name="currentPassword"
                                        type="password"
                                        className="py-6 rounded-xl"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        New Password
                                    </label>
                                    <Input
                                        name="newPassword"
                                        type="password"
                                        className="py-6 rounded-xl"
                                        required
                                        minLength={8}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Confirm New Password
                                    </label>
                                    <Input
                                        name="confirmPassword"
                                        type="password"
                                        className="py-6 rounded-xl"
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>
                            <div className="pt-4">
                                <Button
                                    type="submit"
                                    variant="outline"
                                    className="px-8 py-6 rounded-xl border-cyan-600 text-cyan-700 hover:bg-cyan-50"
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader className="w-5 h-5" /> : 'Update Password'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}
