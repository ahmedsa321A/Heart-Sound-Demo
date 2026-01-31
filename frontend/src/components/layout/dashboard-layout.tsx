import { Navbar } from './navbar';
import { useAppDispatch, useAppSelector } from '@/store';
import { logoutUser } from '@/store/slices/authSlice';
import { useNavigate } from 'react-router-dom';

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { user } = useAppSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logoutUser());
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-50 to-teal-50">
            <Navbar onLogout={handleLogout} userName={user?.fullName} isAuthenticated={true} />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
}
