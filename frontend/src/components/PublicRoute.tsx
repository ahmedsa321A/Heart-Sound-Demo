import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '@/store';
import { Loader } from '@/components/ui/loader';

export const PublicRoute = () => {
    const { user, isInitialized } = useAppSelector((state) => state.auth);

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
