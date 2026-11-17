import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, Loader, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LABEL_OPTIONS, LabelSubmission, RecordingLabels } from '@/content/labelOptions';

interface LabelQuestionnaireProps {
    /** True once the analysis has finished in the background */
    analysisReady: boolean;
    onDone: (submission: LabelSubmission) => void;
}

// Standard auscultation points, drawn as if facing the person (their right side is on the left)
const CHEST_POINTS = [
    { key: 'aortic', n: 1, x: 86, y: 74 },
    { key: 'pulmonic', n: 2, x: 114, y: 74 },
    { key: 'tricuspid', n: 3, x: 108, y: 124 },
    { key: 'mitral', n: 4, x: 140, y: 136 },
] as const;

function Chips<T extends string>({ options, value, onChange, labelKey }: {
    options: readonly T[];
    value?: T;
    onChange: (value: T) => void;
    labelKey: (option: T) => string;
}) {
    const { t } = useTranslation();
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((option) => (
                <button
                    key={option}
                    type="button"
                    onClick={() => onChange(option)}
                    className={`px-4 py-2 rounded-full border-2 text-sm transition-colors cursor-pointer ${
                        value === option ? 'border-cyan-600 bg-cyan-50 text-cyan-800 font-medium' : 'border-gray-200 text-gray-700 hover:border-cyan-400'
                    }`}
                >
                    {t(labelKey(option))}
                </button>
            ))}
        </div>
    );
}

/** Optional questions shown while the analysis runs, before the result (answers become training labels). */
export function LabelQuestionnaire({ analysisReady, onDone }: LabelQuestionnaireProps) {
    const { t } = useTranslation();
    const [labels, setLabels] = useState<RecordingLabels>({});
    const set = <K extends keyof RecordingLabels>(key: K, value: RecordingLabels[K]) => setLabels((prev) => ({ ...prev, [key]: value }));

    const toggleCondition = (condition: NonNullable<RecordingLabels['conditions']>[number]) => {
        const current = labels.conditions ?? [];
        set('conditions', current.includes(condition) ? current.filter((c) => c !== condition) : [...current, condition]);
    };

    const handleSubmit = () => {
        // Only keep diagnosis details when the user said a doctor diagnosed them
        const diagnosed = labels.diagnosedByDoctor === 'yes';
        const cleaned: RecordingLabels = {
            ...labels,
            conditions: diagnosed ? labels.conditions : undefined,
            diagnosisMethod: diagnosed ? labels.diagnosisMethod : undefined,
            otherCondition: diagnosed && labels.conditions?.includes('other') ? labels.otherCondition?.trim() || undefined : undefined,
        };
        const answered = Object.values(cleaned).some((v) => (Array.isArray(v) ? v.length > 0 : v !== undefined));
        onDone(answered ? { labels: cleaned } : { skipped: true });
    };

    return (
        <div className="py-2">
            <div className="flex items-start gap-3 mb-2">
                <HeartHandshake className="w-7 h-7 text-cyan-600 shrink-0" />
                <div>
                    <h3 className="text-xl font-bold text-gray-900">{t('labels.title')}</h3>
                    <p className="text-sm text-gray-600">{t('labels.subtitle')}</p>
                </div>
            </div>
            <p className={`flex items-center gap-2 text-xs mb-6 ${analysisReady ? 'text-green-700' : 'text-gray-500'}`}>
                {analysisReady ? <CheckCircle className="w-4 h-4" /> : <Loader className="w-4 h-4 animate-spin" />}
                {t(analysisReady ? 'labels.analysisReady' : 'labels.analyzingInBackground')}
            </p>

            <div className="space-y-6">
                <div>
                    <p className="font-medium text-gray-900 mb-2">{t('labels.q.diagnosed')}</p>
                    <Chips
                        options={LABEL_OPTIONS.diagnosedByDoctor}
                        value={labels.diagnosedByDoctor}
                        onChange={(v) => set('diagnosedByDoctor', v)}
                        labelKey={(o) => `labels.answers.${o}`}
                    />
                </div>

                {labels.diagnosedByDoctor === 'yes' && (
                    <>
                        <div>
                            <p className="font-medium text-gray-900 mb-2">{t('labels.q.conditions')}</p>
                            <div className="grid sm:grid-cols-2 gap-2">
                                {LABEL_OPTIONS.conditions.map((condition) => {
                                    const checked = labels.conditions?.includes(condition) ?? false;
                                    return (
                                        <label
                                            key={condition}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                                                checked ? 'border-cyan-600 bg-cyan-50 text-cyan-900' : 'border-gray-200 hover:border-cyan-400'
                                            }`}
                                        >
                                            <input type="checkbox" checked={checked} onChange={() => toggleCondition(condition)} className="accent-cyan-600" />
                                            {t(`labels.conditions.${condition}`)}
                                        </label>
                                    );
                                })}
                            </div>
                            {labels.conditions?.includes('other') && (
                                <input
                                    type="text"
                                    maxLength={200}
                                    value={labels.otherCondition ?? ''}
                                    onChange={(e) => set('otherCondition', e.target.value)}
                                    placeholder={t('labels.otherPlaceholder')}
                                    className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500"
                                />
                            )}
                        </div>

                        <div>
                            <p className="font-medium text-gray-900 mb-2">{t('labels.q.method')}</p>
                            <Chips
                                options={LABEL_OPTIONS.diagnosisMethod}
                                value={labels.diagnosisMethod}
                                onChange={(v) => set('diagnosisMethod', v)}
                                labelKey={(o) => `labels.methods.${o}`}
                            />
                        </div>
                    </>
                )}

                <div>
                    <p className="font-medium text-gray-900 mb-2">{t('labels.q.location')}</p>
                    <div className="flex flex-col sm:flex-row gap-4 items-start">
                        <svg viewBox="0 0 200 200" className="w-40 h-40 shrink-0" role="img" aria-label={t('labels.q.location')}>
                            <path d="M40 190 C38 120 45 60 70 40 C85 30 115 30 130 40 C155 60 162 120 160 190 Z" fill="#ecfeff" stroke="#67e8f9" strokeWidth="2" />
                            <line x1="100" y1="45" x2="100" y2="150" stroke="#a5f3fc" strokeWidth="6" strokeLinecap="round" />
                            <text x="30" y="30" fontSize="12" fill="#6b7280">{t('labels.diagramRight')}</text>
                            <text x="160" y="30" fontSize="12" fill="#6b7280">{t('labels.diagramLeft')}</text>
                            {CHEST_POINTS.map((p) => (
                                <g key={p.key} onClick={() => set('chestLocation', p.key)} className="cursor-pointer">
                                    <circle cx={p.x} cy={p.y} r="11" fill={labels.chestLocation === p.key ? '#0891b2' : '#ffffff'} stroke="#0891b2" strokeWidth="2" />
                                    <text x={p.x} y={p.y + 4} textAnchor="middle" fontSize="11" fontWeight="bold" fill={labels.chestLocation === p.key ? '#ffffff' : '#0891b2'}>{p.n}</text>
                                </g>
                            ))}
                        </svg>
                        <div className="flex flex-col gap-2 w-full">
                            {LABEL_OPTIONS.chestLocation.map((location) => {
                                const point = CHEST_POINTS.find((p) => p.key === location);
                                const selected = labels.chestLocation === location;
                                return (
                                    <button
                                        key={location}
                                        type="button"
                                        onClick={() => set('chestLocation', location)}
                                        className={`text-start px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer ${
                                            selected ? 'border-cyan-600 bg-cyan-50 text-cyan-900' : 'border-gray-200 hover:border-cyan-400'
                                        }`}
                                    >
                                        {point && <span className="font-bold text-cyan-700 me-2">{point.n}</span>}
                                        {t(`labels.locations.${location}`)}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div>
                    <p className="font-medium text-gray-900 mb-2">{t('labels.q.device')}</p>
                    <Chips
                        options={LABEL_OPTIONS.device}
                        value={labels.device}
                        onChange={(v) => set('device', v)}
                        labelKey={(o) => `labels.devices.${o}`}
                    />
                </div>
            </div>

            <div className="flex gap-4 justify-end mt-8">
                <Button type="button" variant="outline" onClick={() => onDone({ skipped: true })} className="px-6 py-5 rounded-xl cursor-pointer">
                    {t('labels.skip')}
                </Button>
                <Button
                    type="button"
                    onClick={handleSubmit}
                    className="px-6 py-5 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white cursor-pointer"
                >
                    {t('labels.submit')}
                </Button>
            </div>
        </div>
    );
}
