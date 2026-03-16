import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Bell, Check, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const NotificationsPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const res = await api.get('/notifications/');
            setNotifications(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/notifications/${id}/read`);
            setNotifications(notifications.map(n =>
                n.id === id ? { ...n, is_read: true } : n
            ));
        } catch (err) {
            console.error(err);
        }
    };

    const markAllRead = async () => {
        try {
            await api.put('/notifications/read-all');
            setNotifications(notifications.map(n => ({ ...n, is_read: true })));
        } catch (err) {
            console.error(err);
        }
    };

    const handleNotificationClick = (notif) => {
        if (!notif.is_read) markAsRead(notif.id);
        // Navigation disabled as requested
        // if (notif.link) navigate(notif.link);
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        <Bell className="text-blue-500" size={32} />
                        Notifications
                    </h1>
                    <p className="text-slate-500 mt-2">
                        Vous avez <strong className="text-blue-600">{unreadCount}</strong> nouvelles notifications.
                    </p>
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={markAllRead}
                        className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-4 py-2 rounded-lg hover:bg-slate-50 transition"
                    >
                        <CheckCircle size={16} /> Tout marquer comme lu
                    </button>
                )}
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-slate-400">Chargement...</div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 italic">Aucune notification pour le moment.</div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {notifications.map(notif => (
                            <div
                                key={notif.id}
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-6 flex gap-4 transition ${!notif.is_read ? 'cursor-pointer hover:bg-slate-50 bg-blue-50/50' : ''}`}
                            >
                                <div className={`mt-1 min-w-[10px] h-[10px] rounded-full ${!notif.is_read ? 'bg-blue-500' : 'bg-slate-200'}`}></div>
                                <div className="flex-1">
                                    <h3 className={`text-lg ${!notif.is_read ? 'font-bold text-slate-900' : 'font-medium text-slate-600'}`}>
                                        {notif.title}
                                    </h3>
                                    <p className="text-slate-500 mt-1">{notif.message}</p>
                                    <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 font-mono">
                                        <Clock size={12} />
                                        {new Date(notif.created_at).toLocaleString()}
                                    </div>
                                </div>
                                {!notif.is_read && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); markAsRead(notif.id); }}
                                        className="self-center p-2 text-slate-300 hover:text-blue-500 transition"
                                        title="Marquer comme lu"
                                    >
                                        <Check size={18} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotificationsPage;
