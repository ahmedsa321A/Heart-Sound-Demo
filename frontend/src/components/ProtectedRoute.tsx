import { Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Loader } from '@/components/ui/loader';

export const ProtectedRoute = () => {
    const { user, isInitialized } = useSelector((state: RootState) => state.auth);

    if (!isInitialized) {
        return <Loader fullScreen />;
    }

    return user ? <Outlet /> : <Navigate to="/login" replace />;
};
