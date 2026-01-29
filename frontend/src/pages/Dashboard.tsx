import { useState, useEffect, useRef } from 'react'; // 🔧 added useRef
import { useTranslation } from 'react-i18next';
import { Mic, Square, Loader, CheckCircle, AlertCircle, Activity, FileText } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { startRecording, stopRecording, startAnalyzing, setAnalysisResult, resetRecording } from '@/store/slices/recordingSlice';
import instructionImage from '@/assets/instruction.jpg';

export function Dashboard() {
    const dispatch = useAppDispatch();
    const { status, analysisResult, audioUrl } = useAppSelector((state) => state.recording);
    const { user } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();
    const [recordingTime, setRecordingTime] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (status === 'recording') {
            timer = setInterval(() => {
                setRecordingTime((prev) => {
                    if (prev >= 30) {
                        handleStop();
                        return 30;
                    }
                    return prev + 1;
                });
            }, 1000);
        } else {
            setRecordingTime(0);
        }
        return () => clearInterval(timer);
    }, [status]);

    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

    const handleStart = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const mimeType = MediaRecorder.isTypeSupported('audio/webm')
                ? 'audio/webm'
                : 'audio/ogg';

            const recorder = new MediaRecorder(stream, { mimeType });
            setMediaRecorder(recorder);
            chunksRef.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: mimeType });
                const url = URL.createObjectURL(blob);

                dispatch(stopRecording(url));

                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            };

            recorder.start();
            dispatch(startRecording());
        } catch (err) {
            console.error('Error accessing microphone:', err);
        }
    };

    const handleStop = () => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    };

    const handleAnalyze = () => {
        if (!audioUrl) return;
        console.log('Analyzing audio...');
        
        dispatch(startAnalyzing());

        setTimeout(() => {
            const isNormal = Math.random() > 0.5;
            dispatch(setAnalysisResult({
                diagnosis: isNormal ? 'Normal Result' : 'Needs Attention',
                confidence: 0.95,
                details: isNormal
                    ? 'Your heart sounds appear normal. No immediate concerns detected.'
                    : 'Some irregularities detected. We recommend consulting with a healthcare provider.'
            }));
        }, 3000);
    };

    const handleReset = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        dispatch(resetRecording());
    };

    return (
        <DashboardLayout>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('common.welcomeBack', { name: user?.fullName || 'User' })}</h1>
                <p className="text-gray-600">{t('dashboard.monitorHealth')}</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Recording Card */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100 h-full">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.recordTitle')}</h2>



                        {status === 'idle' && (
                            <>
                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8">
                                    <div className="flex flex-col md:flex-row gap-6 items-center">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-blue-900 mb-4 text-lg">{t('dashboard.instructions')}</h3>
                                            <ul className="space-y-4 text-blue-800">
                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">1</span>
                                                    <span>{t('dashboard.steps.step1')}</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">2</span>
                                                    <span>{t('dashboard.steps.step2')}</span>
                                                </li>
                                                <li className="flex gap-3">
                                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-200 rounded-full flex items-center justify-center text-blue-700 font-semibold text-sm">3</span>
                                                    <span>{t('dashboard.steps.step3')}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="w-full md:w-48 shrink-0">
                                            <img
                                                src={instructionImage}
                                                alt="Placement Instruction"
                                                className="w-full rounded-lg shadow-md border-2 border-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-center">
                                    <button
                                        onClick={handleStart}
                                        className="w-32 h-32 bg-gradient-to-br from-cyan-500 to-teal-600 rounded-full flex items-center justify-center hover:from-cyan-600 hover:to-teal-700 transition-all shadow-2xl shadow-cyan-500/50 group"
                                    >
                                        <Mic className="w-16 h-16 text-white group-hover:scale-110 transition-transform cursor-pointer" />
                                    </button>
                                </div>
                                <p className="text-center text-sm text-gray-500 mt-6">
                                    {t('dashboard.clickToStart')}
                                </p>
                            </>
                        )}

                        {status === 'recording' && (
                            <>
                                <div className="mb-8">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                                        <span className="text-gray-900 font-medium">{t('dashboard.recording')}</span>
                                    </div>
                                    <div className="relative h-24 bg-gray-50 rounded-xl overflow-hidden">
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <WaveformAnimation />
                                        </div>
                                    </div>
                                </div>

                                <div className="text-center">
                                    <div className="text-5xl font-bold text-cyan-600 mb-4">
                                        {recordingTime}s / 30s
                                    </div>
                                    <Button
                                        onClick={handleStop}
                                        variant="destructive"
                                        className="px-8 py-6 text-lg rounded-xl cursor-pointer"
                                    >
                                        <Square className="w-5 h-5 mr-2" fill="currentColor" />
                                        {t('dashboard.stopRecording')}
                                    </Button>
                                </div>
                            </>
                        )}

                        {status === 'review' && (
                            <div className="text-center py-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.reviewRecording')}</h3>

                                <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                                    <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Mic className="w-8 h-8 text-cyan-600" />
                                    </div>
                                    <p className="text-gray-600 mb-4">{t('dashboard.clickToListen')}</p>
                                    <audio controls src={audioUrl || ''} className="w-full max-w-md mx-auto" />
                                </div>

                                <div className="flex gap-4 justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={handleReset}
                                        className="px-6 py-4 rounded-xl cursor-pointer"
                                    >
                                        {t('dashboard.discard')}
                                    </Button>
                                    <Button
                                        onClick={handleAnalyze}
                                        className="px-8 py-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-xl cursor-pointer hover:shadow-lg transition-all"
                                    >
                                        {t('dashboard.submitAnalysis')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {status === 'analyzing' && (
                            <div className="text-center py-12">
                                <Loader className="w-16 h-16 text-cyan-600 animate-spin mx-auto mb-4" />
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.analyzing')}</h3>
                                <p className="text-gray-600">{t('dashboard.processing')}</p>
                            </div>
                        )}

                        {status === 'complete' && analysisResult && (
                            <div className="text-center py-8">
                                {analysisResult.diagnosis === 'Normal Result' ? (
                                    <>
                                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <CheckCircle className="w-12 h-12 text-green-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.normalResult')}</h3>
                                        <p className="text-gray-600 mb-6">
                                            {analysisResult.details}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <AlertCircle className="w-12 h-12 text-amber-600" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.needsAttention')}</h3>
                                        <p className="text-gray-600 mb-6">
                                            {analysisResult.details}
                                        </p>
                                    </>
                                )}

                                <div className="flex gap-4 justify-center">
                                    <Button variant="outline" onClick={handleReset} className="px-6 py-6 rounded-xl">
                                        {t('dashboard.recordAgain')}
                                    </Button>
                                    <Button className="px-6 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl">
                                        {t('dashboard.viewReport')}
                                    </Button>
                                </div>
                            </div>
                        )}

                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="space-y-6">
                    {/* Quick Stats */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.quickStats')}</h3>
                        <div className="space-y-4">
                            <StatItem
                                icon={<Activity className="w-5 h-5 text-cyan-600" />}
                                label={t('dashboard.totalRecordings')}
                                value="12"
                            />
                            <StatItem
                                icon={<FileText className="w-5 h-5 text-cyan-600" />}
                                label={t('dashboard.reportsGenerated')}
                                value="8"
                            />
                            <StatItem
                                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                                label={t('dashboard.normalResults')}
                                value="10"
                            />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h3>
                        <div className="space-y-3">
                            <ActivityItem
                                date="Jan 28, 2026"
                                result="Normal"
                                status="normal"
                            />
                            <ActivityItem
                                date="Jan 24, 2026"
                                result="Normal"
                                status="normal"
                            />
                            <ActivityItem
                                date="Jan 20, 2026"
                                result="Attention"
                                status="attention"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
}

function WaveformAnimation() {
    return (
        <div className="flex items-center gap-1 h-full">
            {[...Array(40)].map((_, i) => (
                <div
                    key={i}
                    className="w-1 bg-cyan-600 rounded-full animate-pulse"
                    style={{
                        height: `${Math.random() * 60 + 20}%`,
                        animationDelay: `${i * 0.05}s`,
                        animationDuration: '0.8s'
                    }}
                />
            ))}
        </div>
    );
}

function StatItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-cyan-50 rounded-xl flex items-center justify-center">
                    {icon}
                </div>
                <span className="text-gray-600">{label}</span>
            </div>
            <span className="text-xl font-bold text-gray-900">{value}</span>
        </div>
    );
}

function ActivityItem({ date, result, status }: { date: string; result: string; status: 'normal' | 'attention' }) {
    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div>
                <p className="text-sm font-medium text-gray-900">{date}</p>
                <p className="text-xs text-gray-500">Heart sound recording</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${status === 'normal'
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
                }`}>
                {result}
            </span>
        </div>
    );
}
