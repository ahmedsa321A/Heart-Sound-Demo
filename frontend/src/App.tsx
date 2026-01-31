import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Outlet } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { checkAuth } from '@/store/slices/authSlice';


export default function App() {
    const { i18n } = useTranslation();
    const dispatch = useDispatch<AppDispatch>();

    useEffect(() => {
        document.documentElement.dir = i18n.dir();
        document.documentElement.lang = i18n.language;
    }, [i18n.language]);

    useEffect(() => {
        dispatch(checkAuth());
    }, [dispatch]);

    return (
        <Outlet />
    );
}

