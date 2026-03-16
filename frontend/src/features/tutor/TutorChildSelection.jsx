import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';
import { User, ChevronRight, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const TutorChildSelection = () => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/children/');
                const childList = res.data.children || [];
                setChildren(childList);

                if (childList.length === 1) {
                    // Auto-redirect if single child
                    navigate(`/dashboard/tutor/child/${childList[0].id}`, { replace: true });
                }
            } catch (error) {
                console.error("Failed to fetch children", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, [navigate]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="text-xl text-slate-500 font-medium animate-pulse">{t('common.loading')}...</div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto p-6 relative">
            <button
                onClick={handleLogout}
                className="absolute top-6 right-6 flex items-center gap-2 text-slate-500 hover:text-red-500 transition-colors font-medium"
            >
                <LogOut size={20} />
                <span>{t('sidebar.logout')}</span>
            </button>

            <div className="text-center mb-12 mt-8">
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">
                    {t('dashboard.welcome_tutor', { name: user?.first_name })}
                </h1>
            </div>

            {children.length === 0 ? (
                <div className="bg-blue-50 border border-blue-100 rounded-3xl p-10 text-center max-w-2xl mx-auto">
                    <User size={48} className="mx-auto text-blue-400 mb-4" />
                    <h3 className="text-xl font-bold text-blue-900 mb-2">{t('tutor.selection.no_children_title')}</h3>
                    <p className="text-blue-700">
                        {t('tutor.selection.no_children_desc')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                    {children.map(child => (
                        <div
                            key={child.id}
                            onClick={() => navigate(`/dashboard/tutor/child/${child.id}`)}
                            className="group bg-white rounded-3xl p-6 shadow-sm border border-slate-100 cursor-pointer hover:shadow-xl hover:border-blue-200 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="bg-blue-500 text-white p-2 rounded-full shadow-lg">
                                    <ChevronRight size={20} />
                                </div>
                            </div>

                            <div className="flex flex-col items-center text-center">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border-4 border-white shadow-sm">
                                    {child.photo_url ? (
                                        <img src={child.photo_url} alt={child.first_name} className="w-full h-full object-cover rounded-full" />
                                    ) : (
                                        <span className="text-3xl font-bold text-blue-600">
                                            {child.first_name.charAt(0)}
                                        </span>
                                    )}
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-1 group-hover:text-blue-600 transition-colors">
                                    {child.first_name} {child.last_name}
                                </h3>
                                <p className="text-sm font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full">
                                    {child.code}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TutorChildSelection;
