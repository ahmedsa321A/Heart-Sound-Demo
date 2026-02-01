import { Heart, Activity, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { useNavigate } from 'react-router-dom';

interface AuthLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const isRTL = i18n.dir() === 'rtl';

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50 flex items-center justify-center p-4 relative">
            <div className="absolute top-4 left-4 rtl:right-4 rtl:left-auto z-10 flex items-center gap-2">
                <button className="bg-white/10 backdrop-blur-sm rounded-full p-2 hover:bg-gray-100 cursor-pointer" onClick={() => navigate('/')}>
                    {isRTL ? <ArrowRight /> : <ArrowLeft />}
                </button>
                <LanguageSwitcher />

            </div>

            <div className="w-full max-w-5xl grid md:grid-cols-2 gap-8 items-center">
                {/* Left side - Illustration */}
                <div className="hidden md:flex flex-col items-center justify-center bg-gradient-to-br from-cyan-600 to-teal-700 rounded-3xl p-12 text-white min-h-[600px]">
                    <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-6">
                        <Heart className="w-16 h-16 text-white" fill="white" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4 text-center">{title}</h2>
                    <p className="text-cyan-100 text-center text-lg">
                        {subtitle}
                    </p>
                    <div className="mt-8 space-y-4 w-full px-8">
                        <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4">
                            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                                <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <p className="font-semibold">{t('auth.realTimeMonitoring')}</p>
                                <p className="text-sm text-cyan-100">{t('auth.trackHeartHealth')}</p>
                            </div>
                        </div>
                        {/* Can add more features here */}
                    </div>
                </div>

                {/* Right side - Form */}
                <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12">
                    {children}
                </div>
            </div>
        </div>
    );
}
