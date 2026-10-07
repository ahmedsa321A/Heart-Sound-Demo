import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { Loader } from '@/components/ui/loader';
import { isDemoMode } from '@/config';

export const PublicRoute = () => {
    const { user, isInitialized } = useAppSelector((state) => state.auth);
    const { pathname } = useLocation();

    // Demo mode: no auth screens — landing stays reachable, everything else goes to the dashboard
    if (isDemoMode) {
        return pathname === '/' ? <Outlet /> : <Navigate to="/dashboard" replace />;
    }

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader className="w-10 h-10" />
            </div>
        );
    }

    if (user) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
};
