import { Heart, User, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NavbarProps {
    onLogout?: () => void;
    userName?: string;
    isAuthenticated?: boolean;
    transparent?: boolean;
}

export function Navbar({ onLogout, userName, isAuthenticated = false, transparent = false }: NavbarProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();

    return (
        <header className={`${transparent ? 'fixed w-full bg-white/80 backdrop-blur-md border-b border-gray-100' : 'bg-white border-b border-gray-200 sticky top-0'} z-30 transition-all duration-300`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
                        <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-xl flex items-center justify-center">
                            <Heart className="w-6 h-6 text-white" fill="white" />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                            {t('common.heartAI')}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <LanguageSwitcher />

                        {!isAuthenticated ? (
                            <>
                                <Button variant="ghost" onClick={() => navigate('/login')} >
                                    {t('common.signIn')}
                                </Button>
                                <Button
                                    onClick={() => navigate('/register')}
                                    className="bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 text-white rounded-full px-6"
                                >
                                    {t('common.getStarted')}
                                </Button>
                            </>
                        ) : (
                            <>
                                {userName && (
                                    <span className="hidden sm:inline text-sm text-gray-600">
                                        {t('common.welcomeBack', { name: userName })}
                                    </span>
                                )}
                                <button
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                    title={t('common.userProfile')}
                                    onClick={() => navigate('/profile')}
                                >
                                    <User className="w-5 h-5 text-gray-600" />
                                </button>
                                <button
                                    onClick={onLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-5 h-5" />
                                    <span className="hidden sm:inline">{t('common.logout')}</span>
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
