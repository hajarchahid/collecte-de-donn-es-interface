import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AdminStats from './AdminStats';

const AdminHome = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchUsers = async () => {
        try {
            // Request high limit to get all users for proper client-side stats
            const response = await api.get('/users/', { params: { per_page: 1000 } });

            if (response.data.users) {
                setUsers(response.data.users);
            } else if (Array.isArray(response.data)) {
                setUsers(response.data);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">{t('admin.dashboard.title')}</h1>
                <p className="text-slate-500 mt-2">{t('admin.dashboard.subtitle')}</p>
            </div>

            <AdminStats users={users} />
        </div>
    );
};

export default AdminHome;
