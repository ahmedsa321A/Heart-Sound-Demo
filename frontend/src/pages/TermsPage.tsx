import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/navbar';
import { Button } from '@/components/ui/button';
import { TermsContent } from '@/components/legal/terms-content';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { isDemoMode } from '@/config';

export function TermsPage() {
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();
    const dispatch = useAppDispatch();
    const { user } = useAppSelector((state) => state.auth);
    const isRTL = i18n.dir() === 'rtl';

    const handleLogout = async () => {
        if (!isDemoMode) await dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
            <Navbar isAuthenticated={!!user} userName={user?.fullName} onLogout={handleLogout} />
            <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    {isRTL ? <ArrowRight className="w-5 h-5" /> : <ArrowLeft className="w-5 h-5" />}
                    {t('common.back')}
                </Button>
                <div className="bg-white rounded-3xl shadow-xl p-6 sm:p-10">
                    <TermsContent />
                </div>
            </main>
        </div>
    );
}
