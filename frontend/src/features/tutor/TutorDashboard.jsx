import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Play, Lock, CheckCircle, BarChart, Mic, ArrowLeft, User } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

const TutorDashboard = () => {
    const { user } = useAuth();
    const { t } = useTranslation();
    const { childId } = useParams();
    const navigate = useNavigate();

    const [child, setChild] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!childId) return;
        fetchChild();
    }, [childId]);

    const fetchChild = async () => {
        try {
            // Fetch specific child details
            // We can use the existing /children/:id endpoint which allows tutors to see their assigned child
            const res = await api.get(`/children/${childId}`);
            setChild(res.data);
        } catch (error) {
            console.error("Failed to fetch child", error);
            setError("Impossible de charger les données de l'enfant.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center text-slate-500">
            {t('common.loading')}...
        </div>
    );

    if (error || !child) return (
        <div className="p-8 text-center">
            <div className="text-red-500 mb-4">{error || "Enfant introuvable"}</div>
            <button
                onClick={() => navigate('/dashboard/tutor/select-child')}
                className="text-blue-600 hover:underline"
            >
                Retour à la sélection
            </button>
        </div>
    );

    return (
        <div className="p-6 max-w-6xl mx-auto">
            {/* Header with Switch Child Icon */}
            <div className="flex items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">
                        {t('dashboard.welcome_back', { name: child.first_name })}
                    </h1>
                    <p className="text-slate-500 text-sm">
                        {t('dashboard.track_progress')}
                    </p>
                </div>

                <div className="ml-auto flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full border border-blue-100 group hover:border-blue-300 transition-colors cursor-pointer" onClick={() => navigate('/tutor/selection')} title={t('dashboard.actions.switch_child')}>
                    <User size={16} className="text-blue-500" />
                    <span className="font-bold text-blue-700 text-sm">{child.first_name} {child.last_name}</span>
                    <div className="w-px h-4 bg-blue-200 mx-1"></div>
                    <ArrowLeft size={16} className="text-blue-400 group-hover:text-blue-600 transition-colors" />
                </div>
            </div>

            <ChildSection child={child} t={t} />
        </div>
    );
};

// Reusable Stat Card Component matches Admin Dashboard
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

const ChildSection = ({ child, t }) => {
    const levelRaw = child.evaluation_level;
    const hasTest = child.has_initial_test;

    const progression = child.progression_score || 0;
    // const audiosRemaining = 20; // Placeholder

    return (
        <div className="animate-fade-in">
            {!hasTest && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-8 rounded-r-xl flex items-start gap-4">
                    <div className="p-2 bg-red-100 rounded-full text-red-600 mt-1">
                        <Lock size={20} />
                    </div>
                    <div>
                        <h3 className="font-bold text-red-800 mb-1">{t('dashboard.alerts.test_required')}</h3>
                        <p className="text-red-600 text-sm">
                            {t('dashboard.alerts.test_required_desc')}
                        </p>
                    </div>
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard
                    title={t('dashboard.cards.progression')}
                    value={`${progression}%`}
                    icon={CheckCircle}
                    color="bg-gradient-to-br from-emerald-500 to-green-600"
                    subColor="emerald-500"
                />

                <StatCard
                    title="Score"
                    value={child.score_total || 0}
                    icon={BarChart}
                    color="bg-gradient-to-br from-purple-500 to-indigo-600"
                    subColor="purple-500"
                />

                <StatCard
                    title={t('dashboard.cards.level')}
                    value={hasTest && levelRaw ? t(`levels.${levelRaw}`) : '-'}
                    icon={Mic}
                    color="bg-gradient-to-br from-blue-500 to-cyan-600"
                    subColor="blue-500"
                />
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Test Card */}
                <div className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-300 ${!hasTest ? 'bg-gradient-to-br from-indigo-600 to-blue-700 text-white shadow-xl shadow-indigo-200 scale-[1.02]' : 'bg-white border border-slate-100 text-slate-400 grayscale opacity-80'}`}>
                    <div className="relative z-10">
                        <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-6 backdrop-blur-sm">
                            <Mic size={32} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-2">{t('dashboard.actions.start_test')}</h3>
                        <p className="mb-8 opacity-90">
                            {hasTest ? t('dashboard.cards.test_completed') : t('dashboard.cards.test_desc')}
                        </p>

                        {!hasTest ? (
                            <Link
                                to={`/dashboard/tutor/test/${child.id}`}
                                className="inline-flex items-center gap-2 bg-white text-indigo-700 px-6 py-3 rounded-xl font-bold hover:bg-indigo-50 transition shadow-sm"
                            >
                                <Play size={20} fill="currentColor" /> {t('common.start')}
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-2 text-slate-400 font-bold border border-slate-200 px-4 py-2 rounded-xl">
                                <CheckCircle size={18} /> {t('common.completed')}
                            </span>
                        )}
                    </div>
                </div>

                {/* Training Card */}
                <div className={`relative overflow-hidden rounded-3xl p-8 transition-all duration-300 ${hasTest ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-200 scale-[1.02]' : 'bg-white border border-slate-100 text-slate-400'}`}>
                    <div className="relative z-10">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm ${hasTest ? 'bg-white/20' : 'bg-slate-100'}`}>
                            <Play size={32} className={hasTest ? "text-white" : "text-slate-400"} />
                        </div>
                        <h3 className={`text-2xl font-bold mb-2 ${!hasTest && 'text-slate-700'}`}>{t('dashboard.actions.continue_training')}</h3>
                        <p className={`mb-8 ${hasTest ? 'opacity-90' : 'text-slate-500'}`}>
                            {hasTest ? t('dashboard.cards.training_desc') : t('dashboard.cards.training_locked')}
                        </p>

                        {hasTest ? (
                            <Link
                                to={`/dashboard/tutor/training/${child.id}`}
                                className="inline-flex items-center gap-2 bg-white text-emerald-700 px-6 py-3 rounded-xl font-bold hover:bg-emerald-50 transition shadow-sm"
                            >
                                <Play size={20} fill="currentColor" /> {t('common.continue')}
                            </Link>
                        ) : (
                            <span className="inline-flex items-center gap-2 text-slate-400 font-bold bg-slate-50 px-4 py-2 rounded-xl">
                                <Lock size={18} /> {t('common.locked')}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TutorDashboard;

