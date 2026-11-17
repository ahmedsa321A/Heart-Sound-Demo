import { useTranslation } from 'react-i18next';
import { ShieldCheck } from 'lucide-react';
import { getTerms } from '@/content/terms';

/** The Terms & Privacy Policy text in the current language (used by the signup dialog and /terms). */
export function TermsContent({ showTitle = true }: { showTitle?: boolean }) {
    const { i18n } = useTranslation();
    const terms = getTerms(i18n.language);

    return (
        <article className="text-gray-700 leading-relaxed">
            {showTitle && <h1 className="text-3xl font-bold text-gray-900 mb-1">{terms.title}</h1>}
            <p className="text-sm text-gray-500 mb-6">{terms.lastUpdated}</p>

            <div className="flex gap-3 p-4 mb-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-900">
                <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{terms.summary}</p>
            </div>

            <div className="space-y-6">
                {terms.sections.map((section) => (
                    <section key={section.title}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
                        {section.paragraphs?.map((p) => (
                            <p key={p} className="text-sm mb-2">{p}</p>
                        ))}
                        {section.bullets && (
                            <ul className="list-disc ps-5 space-y-1 text-sm">
                                {section.bullets.map((b) => <li key={b}>{b}</li>)}
                            </ul>
                        )}
                        {section.footer?.map((p) => (
                            <p key={p} className="text-sm mt-2">{p}</p>
                        ))}
                    </section>
                ))}
            </div>
        </article>
    );
}
