import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, FileAudio, Activity } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const OrthoDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        patientsCount: 0,
        sessionsCount: 0,
        recordingsCount: 0,
        genderDist: {},
        classDist: {}
    });
    const [loading, setLoading] = useState(true);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchStats = async () => {
        try {
            const response = await api.get('/stats/ortho');
            const data = response.data;
            setStats({
                patientsCount: data.patients_count,
                sessionsCount: data.sessions_count,
                recordingsCount: data.recordings_count,
                genderDist: data.gender_distribution,
                classDist: data.class_distribution
            });
        } catch (error) {
            console.error("Failed to fetch ortho stats", error);
        }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/');
            if (res.data) {
                setNotifications(res.data);
                setUnreadCount(res.data.filter(n => !n.is_read).length);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    useEffect(() => {
        const loadAll = async () => {
            await Promise.all([fetchStats(), fetchNotifications()]);
            setLoading(false);
        };
        loadAll();
    }, []);

    const markAsRead = async (id, link) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
            if (link) {
                // Determine if we are using react-router or full reload
                // For internal links:
                window.location.href = link;
            }
        } catch (err) {
            console.error("Failed to mark notification as read", err);
        }
    };

    const StatCard = ({ title, value, icon: Icon, color, subColor }) => (
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between hover:translate-y-[-2px] transition-all duration-300">
            <div>
                <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-${subColor}/30`}>
                <Icon size={32} className="text-white" strokeWidth={2} />
            </div>
        </div>
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">{t('dashboard.welcome', 'Bienvenue')}</h1>
                    <p className="text-slate-500 mt-2">{t('dashboard.subtitle', 'Votre espace de suivi')}</p>
                </div>
                {unreadCount > 0 && (
                    <div className="bg-red-50 text-red-600 px-4 py-2 rounded-xl border border-red-100 flex items-center gap-2 animate-pulse">
                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        <span className="font-bold">{unreadCount} Notification(s)</span>
                    </div>
                )}
            </div>

            {/* Notifications Section */}
            {/* Notifications Section - Moved to dedicated page */}
            {/*
            {notifications.length > 0 && (
                <div className="mb-10">
                    <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" /> Notifications Récentes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notifications.slice(0, 3).map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => markAsRead(notif.id, notif.link)}
                                className={`p-4 rounded-xl border cursor-pointer transition hover:shadow-md ${notif.is_read ? 'bg-white border-slate-100 opacity-60' : 'bg-blue-50 border-blue-100 shadow-sm transform scale-[1.02]'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className={`font-bold ${notif.is_read ? 'text-slate-700' : 'text-blue-800'}`}>{notif.title}</h4>
                                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-blue-500"></span>}
                                </div>
                                <p className="text-sm text-slate-600 line-clamp-2">{notif.message}</p>
                                <div className="text-xs text-slate-400 mt-2 text-right">
                                    {new Date(notif.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            */}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <StatCard
                    title={t('dashboard.stats.patients', 'Nombre des Enfants')}
                    value={stats.patientsCount || 0}
                    icon={Users}
                    color="bg-gradient-to-br from-blue-500 to-blue-600"
                    subColor="blue-500"
                />
                <StatCard
                    title={t('dashboard.stats.sessions', 'Séances')}
                    value={stats.sessionsCount || 0}
                    icon={Activity}
                    color="bg-gradient-to-br from-purple-500 to-purple-600"
                    subColor="purple-500"
                />
                <StatCard
                    title={t('dashboard.stats.recordings', 'Enregistrements')}
                    value={stats.recordingsCount || 0}
                    icon={FileAudio}
                    color="bg-gradient-to-br from-indigo-500 to-indigo-600"
                    subColor="indigo-500"
                />
                <div onClick={() => navigate('/dashboard/notifications')} className="cursor-pointer">
                    <StatCard
                        title="Notifications"
                        value={unreadCount}
                        icon={Activity}
                        color="bg-gradient-to-br from-orange-500 to-orange-600"
                        subColor="orange-500"
                    />
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
                {/* Gender Distribution - Pie-like Visual */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Users size={20} className="text-blue-500" /> {t('dashboard.charts.gender_dist', 'Répartition Sexe')}
                    </h3>
                    <div className="flex items-center justify-around">
                        <div className="relative w-40 h-40">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                {/* Background Circle (Boys - Blue) */}
                                <path className="text-blue-500" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                                {/* Girls Circle (Pink) */}
                                <path className="text-pink-400" strokeDasharray={`${((stats.genderDist?.['F'] || 0) / (stats.patientsCount || 1)) * 100}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3.8" />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-slate-700">{stats.patientsCount}</span>
                                <span className="text-xs text-slate-400 uppercase">{t('common.total', 'Total')}</span>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full bg-pink-400"></span>
                                <div>
                                    <p className="font-bold text-slate-700">{stats.genderDist?.['F'] || 0} {t('common.female', 'Filles')}</p>
                                    <p className="text-xs text-slate-400">{Math.round(((stats.genderDist?.['F'] || 0) / (stats.patientsCount || 1)) * 100)}%</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="w-4 h-4 rounded-full bg-blue-500"></span>
                                <div>
                                    <p className="font-bold text-slate-700">{stats.genderDist?.['M'] || 0} {t('common.male', 'Garçons')}</p>
                                    <p className="text-xs text-slate-400">{Math.round(((stats.genderDist?.['M'] || 0) / (stats.patientsCount || 1)) * 100)}%</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Class Distribution - Simple Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(cls => {
                        const count = stats.classDist?.[`Classe ${cls}`] || 0;
                        const color = cls === 1 ? 'bg-green-500' : cls === 2 ? 'bg-orange-500' : 'bg-red-500';
                        const textColor = cls === 1 ? 'text-green-600' : cls === 2 ? 'text-orange-600' : 'text-red-600';
                        const borderColor = cls === 1 ? 'border-green-100' : cls === 2 ? 'border-orange-100' : 'border-red-100';

                        return (
                            <div key={cls} className={`bg-white p-6 rounded-2xl shadow-sm border ${borderColor} flex flex-col items-center justify-center`}>
                                <div className={`w-12 h-12 rounded-full ${color} bg-opacity-10 flex items-center justify-center mb-3`}>
                                    <span className={`font-bold text-xl ${textColor}`}>C{cls}</span>
                                </div>
                                <h4 className="text-slate-400 font-semibold text-xs uppercase tracking-wider mb-1">{t('dashboard.class', { class: cls })}</h4>
                                <span className="text-3xl font-extrabold text-slate-800">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
            {/* Quick Actions or Recent List could go here */}
        </div>
    );
};

export default OrthoDashboard;
