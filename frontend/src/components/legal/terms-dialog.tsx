import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TermsContent } from './terms-content';
import { getTerms } from '@/content/terms';

interface TermsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Called when the user clicks "I agree" at the bottom of the terms */
    onAccept?: () => void;
}

/** Terms & Privacy Policy in a scrollable dialog, so signup progress isn't lost. */
export function TermsDialog({ open, onOpenChange, onAccept }: TermsDialogProps) {
    const { t, i18n } = useTranslation();
    const terms = getTerms(i18n.language);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
                <div className="px-6 pt-6 pb-2 border-b">
                    <DialogTitle className="text-2xl font-bold">{terms.title}</DialogTitle>
                    <DialogDescription className="sr-only">{terms.summary}</DialogDescription>
                </div>
                <div className="overflow-y-auto px-6 py-4">
                    <TermsContent showTitle={false} />
                </div>
                <div className="flex justify-end gap-3 px-6 py-4 border-t">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl cursor-pointer">
                        {t('terms.close')}
                    </Button>
                    {onAccept && (
                        <Button
                            type="button"
                            onClick={() => { onAccept(); onOpenChange(false); }}
                            className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 text-white cursor-pointer"
                        >
                            {t('terms.agree')}
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
