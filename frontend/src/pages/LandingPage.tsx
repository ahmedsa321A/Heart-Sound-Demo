import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Activity, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/navbar';

export function LandingPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar */}
            <Navbar transparent isAuthenticated={false} />

            {/* Hero Section */}
            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
                
                <div className="absolute top-0 right-0 -z-10 opacity-10">
                    <svg width="800" height="800" viewBox="0 0 800 800" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="400" cy="400" r="400" fill="url(#paint0_radial_1_5)" />
                        <defs>
                            <radialGradient id="paint0_radial_1_5" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(400 400) rotate(90) scale(400)">
                                <stop stopColor="#0891B2" />
                                <stop offset="1" stopColor="white" stopOpacity="0" />
                            </radialGradient>
                        </defs>
                    </svg>
                </div>

                <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-50 rounded-full text-cyan-700 font-medium text-sm mb-6">
                            <span className="relative flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                            </span>
                            {t('landing.aiPowered')}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                            {t('landing.heroTitle')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
                                {t('landing.heroTitleAccent')}
                            </span>
                        </h1>
                        <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                            {t('landing.heroDesc')}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Button
                                onClick={() => navigate('/register')}
                                className="h-14 px-8 text-lg rounded-full bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-700 hover:to-teal-700 shadow-lg shadow-cyan-500/30"
                            >
                                {t('landing.startFreeAssessment')}
                                <ChevronRight className="ml-2 w-5 h-5 rtl:rotate-180" />
                            </Button>

                        </div>

                    </div>

                    <div className="relative">
                        <div className="relative z-10 bg-white rounded-3xl shadow-2xl p-6 border border-gray-100">
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-teal-100 rounded-full blur-2xl opacity-60"></div>
                            <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-cyan-100 rounded-full blur-2xl opacity-60"></div>

                            <img
                                src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&q=80&w=2070"
                                alt="Doctor using digital tablet"
                                className="rounded-2xl w-full object-cover h-[500px]"
                            />

                            {/* Floating Card */}
                            <div className="absolute bottom-12 left-12 right-12 bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-lg border border-gray-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                                        <Activity className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900">{t('landing.analysisComplete')}</p>
                                        <p className="text-sm text-green-600">{t('landing.normalSinusRhythm')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
