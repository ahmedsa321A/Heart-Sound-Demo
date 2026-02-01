import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Loader, CheckCircle, AlertCircle, Activity, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Button } from '@/components/ui/button';
import { useAppDispatch, useAppSelector } from '@/store';
import { startRecording, stopRecording, resetRecording, analyzeAudio, setRecordingError } from '@/store/slices/recordingSlice';
import instructionImage from '@/assets/instruction.jpg';
import { WaveformPlayer } from '@/components/ui/waveform-player';
import { audioBufferToWav } from '@/utils/audioUtils';
import AlertCard from '@/components/ui/alert-card';

import { historyService } from '@/services/historyService';
import { HistoryItem, AnalysisResponse, DashboardStatsResponse } from '@/services/apiTypes';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import i18n from '@/i18n';

export function Dashboard() {
    const dispatch = useAppDispatch();
    const { status, analysisResult, audioUrl, error } = useAppSelector((state) => state.recording);
    const { user } = useAppSelector((state) => state.auth);
    const { t } = useTranslation();
    const [recordingTime, setRecordingTime] = useState(0);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    // Dashboard Stats State
    const [statsData, setStatsData] = useState<DashboardStatsResponse | null>(null);
    const [selectedReport, setSelectedReport] = useState<AnalysisResponse | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await historyService.getDashboardStats();
                setStatsData(data);
            } catch (err) {
                console.error("Failed to fetch dashboard stats", err);
            }
        };
        fetchStats();
    }, [status]); 

    const generateReportFromHistory = (item: HistoryItem): AnalysisResponse => {
        const resultKey = item.diagnosis === 'Abnormal' ? 'audio.resultAbnormal' : 'audio.resultNormal';
        const translatedResult = t(resultKey);

        return {
            id: item.id,
            diagnosis: item.diagnosis,
            confidence: item.confidence || 0,
            createdAt: item.date,
            audioUrl: item.audioUrl || '',
            details: t('audio.analysisDetails', { result: translatedResult }),
            severity: item.diagnosis === 'Abnormal' ? 'high' : 'low',
            recommendations: item.diagnosis === 'Abnormal'
                ? [t('audio.consultCardiologist'), t('audio.monitorSymptoms')]
                : [t('audio.routineCheckup')]
        };
    };

    // Timer
    useEffect(() => {
        let timer: ReturnType<typeof setInterval>;
        if (status === 'recording') {
            timer = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
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

            recorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                try {
                    const arrayBuffer = await blob.arrayBuffer();
                    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
                    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                    const wavBlob = audioBufferToWav(audioBuffer);
                    const url = URL.createObjectURL(wavBlob);
                    dispatch(stopRecording(url));
                } catch (error) {
                    dispatch(setRecordingError('Error converting audio to WAV'));
                }
                streamRef.current?.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            };
            recorder.start();
            dispatch(startRecording());
        } catch (err) {
            dispatch(setRecordingError('Error accessing microphone'));
        }
    };

    const handleStop = useCallback(() => {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
        }
    }, [mediaRecorder]);

    useEffect(() => {
        if (status === 'recording' && recordingTime >= 30) {
            handleStop();
        }
    }, [recordingTime, status, handleStop]);

    const handleAnalyze = async () => {
        if (!audioUrl) return;
        try {
            // Fetch the blob from the object URL
            const response = await fetch(audioUrl);
            const blob = await response.blob();
            dispatch(analyzeAudio(blob));
        } catch (err) {
            dispatch(setRecordingError('Failed to prepare audio for upload'));
        }
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
                                                className="w-full rounded-lg shadow-sm"
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
                                    <div className="w-full max-w-md mx-auto">
                                        <WaveformPlayer audioUrl={audioUrl} />
                                    </div>
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
                                {analysisResult.diagnosis === 'Normal' ? (
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
                                    <Button variant="outline" onClick={handleReset} className="px-6 py-6 rounded-xl cursor-pointer">
                                        {t('dashboard.recordAgain')}
                                    </Button>
                                    <Button
                                        className="px-6 py-6 bg-gradient-to-r from-cyan-600 to-teal-600 rounded-xl cursor-pointer hover:shadow-lg transition-all"
                                        onClick={() => setSelectedReport(analysisResult)}
                                    >
                                        {t('dashboard.viewReport')}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {status === 'error' && (
                            <div className="text-center py-8">
                                <div className="mb-6 flex justify-center">
                                    <AlertCard title="Error" message={error || 'An unknown error occurred'} onClose={handleReset} />
                                </div>
                                <Button variant="outline" onClick={handleReset} className="px-6 py-4 rounded-xl">
                                    {t('dashboard.recordAgain')}
                                </Button>
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
                                value={statsData?.stats.totalRecordings?.toString() || "0"}
                            />
                            <StatItem
                                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                                label={t('dashboard.normalResults')}
                                value={statsData?.stats.normalResults?.toString() || "0"}
                            />
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                        <h3 className="font-semibold text-gray-900 mb-4">{t('dashboard.recentActivity')}</h3>
                        <div className="space-y-3">
                            {statsData?.recentActivity && statsData.recentActivity.length > 0 ? statsData.recentActivity.map((item) => (
                                <ActivityItem
                                    key={item.id}
                                    item={item}
                                    onViewReport={() => setSelectedReport(generateReportFromHistory(item))}
                                />
                            )) : (
                                <p className="text-sm text-gray-500 text-center py-4">{t('dashboard.noRecentActivity')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Analysis Report Dialog - Reused for both main view and history */}
            <Dialog open={!!selectedReport} onOpenChange={(open) => !open && setSelectedReport(null)}>
                <DialogContent className="sm:max-w-md">
                    {selectedReport && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-cyan-600" />
                                    {t('dashboard.analysisReport')}
                                </DialogTitle>
                                <DialogDescription className="text-gray-500">
                                    {new Date(selectedReport.createdAt).toLocaleString(i18n.language)}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6 py-4">
                                {/* Diagnosis Badge */}
                                <div className="flex justify-center">
                                    <span className={`px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 ${selectedReport.diagnosis === 'Normal'
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-amber-100 text-amber-700'
                                        }`}>
                                        {selectedReport.diagnosis === 'Normal' ? (
                                            <CheckCircle className="w-4 h-4" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4" />
                                        )}
                                        {selectedReport.diagnosis === 'Normal' ? t('dashboard.normalResult') : t('dashboard.needsAttention')}
                                    </span>
                                </div>

                                {/* Score */}
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm font-medium">
                                        <span className="text-gray-600">{t('dashboard.confidenceScore')}</span>
                                        <span className={`font-bold ${selectedReport.diagnosis === 'Normal' ? 'text-green-700' : 'text-amber-700'}`}>
                                            {(selectedReport.confidence * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${selectedReport.diagnosis === 'Normal' ? 'bg-green-600' : 'bg-amber-600'}`}
                                            style={{ width: `${selectedReport.confidence * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Details */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <p className="text-gray-700 text-sm leading-relaxed">
                                        {selectedReport.details}
                                    </p>
                                </div>

                                {/* Recommendations */}
                                {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="font-semibold text-gray-900 text-sm">{t('dashboard.recommendations')}</h4>
                                        <ul className="space-y-2">
                                            {selectedReport.recommendations.map((rec, idx) => (
                                                <li key={idx} className="flex gap-2 text-sm text-gray-600 items-start">
                                                    <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full mt-1.5 shrink-0" />
                                                    {rec}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </DialogContent>
            </Dialog>
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

function ActivityItem({ item, onViewReport }: { item: HistoryItem; onViewReport: () => void }) {
    const { t, i18n } = useTranslation();
    const formattedDate = new Date(item.date).toLocaleDateString(i18n.language);
    const translatedResult = item.diagnosis === 'Normal' ? t('audio.resultNormal') : t('audio.resultAbnormal');

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group hover:bg-gray-100 transition-colors">
            <div>
                <p className="text-sm font-medium text-gray-900">{formattedDate}</p>
                <p className="text-xs text-gray-500">{t('dashboard.heartSoundRecording')}</p>
            </div>
            <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.status === 'normal'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                    }`}>
                    {translatedResult}
                </span>
                <button
                    onClick={onViewReport}
                    className="p-2 text-gray-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-all cursor-pointer"
                    title={t('dashboard.viewReport')}
                >
                    <Eye className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
