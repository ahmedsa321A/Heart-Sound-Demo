import { Loader2 } from 'lucide-react';

interface LoaderProps {
    size?: number;
    className?: string;
    fullScreen?: boolean;
}

export function Loader({ size = 24, className = '', fullScreen = false }: LoaderProps) {
    if (fullScreen) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-white/80 backdrop-blur-sm z-50">
                <Loader2 className={`animate-spin text-cyan-600 ${className}`} size={48} />
            </div>
        );
    }

    return <Loader2 className={`animate-spin ${className}`} size={size} />;
}
