import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { FileAudio, Users, UserCheck, TrendingUp, Activity, Sparkles, Home } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Colors for Gender: Pink (Girls), Blue (Boys)
const GENDER_COLORS = ['#EC4899', '#3B82F6'];

const ResearcherDashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await api.get('/stats/researcher');
                setStats(response.data);
            } catch (error) {
                console.error("Failed to fetch researcher stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-slate-500">{t('common.loading')}</div>;
    if (!stats) return <div className="p-8 text-center text-red-500">{t('common.error_load')}</div>;

    // Transform Data
    const genderData = Object.entries(stats.gender_distribution).map(([name, value]) => ({
        name: name === 'F' ? t('common.female') : t('common.male'),
        value
    }));

    // Calculate percentages for Gender
    const totalGender = genderData.reduce((acc, curr) => acc + curr.value, 0);
    const genderWithPercent = genderData.map(d => ({
        ...d,
        percent: totalGender > 0 ? Math.round((d.value / totalGender) * 100) : 0
    }));

    // ... (rest of code)

    const KPICard = ({ title, value, icon: Icon, color, onClick }) => (
        <div
            onClick={onClick}
            className={`bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.01] ${onClick ? 'cursor-pointer hover:ring-2 hover:ring-emerald-100' : ''}`}
        >
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
                    {title === 'Nouveaux Audios' && value > 0 && (
                        <span className="bg-emerald-100 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">NEW</span>
                    )}
                </div>
            </div>
            <div className={`p-4 rounded-xl ${color} shadow-lg shadow-blue-500/10`}>
                <Icon size={24} className="text-white" />
            </div>
        </div>
    );

    const ClassCard = ({ label, count, colorClass, borderColor }) => (
        <div className={`bg-white p-6 rounded-2xl border-s-[6px] ${borderColor} shadow-sm flex flex-col justify-between h-32`}>
            <div className="flex justify-between items-start">
                <span className="text-slate-500 font-medium uppercase text-xs tracking-wider">{t('researcher.exploration.table.class')}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${colorClass}`}>
                    {label}
                </span>
            </div>
            <div className="mt-2">
                <span className="text-3xl font-bold text-slate-800">{count}</span>
                <span className="text-slate-400 text-sm ms-2">{t('researcher.cards.patients_label')}</span>
            </div>
        </div>
    );

    return (
        <div className="space-y-8 w-full max-w-[1600px] mx-auto">
            <div className="flex justify-between items-end">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('researcher.dashboard.title')}</h2>
                    <p className="text-slate-500">{t('researcher.dashboard.subtitle')}</p>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <KPICard
                    title={t('researcher.kpi.new_audios')}
                    value={stats.new_audios || 0}
                    icon={Sparkles}
                    color="bg-emerald-500"
                    onClick={() => navigate('/dashboard/researcher/explore?status=new')}
                />
                <KPICard title={t('researcher.kpi.total_audios')} value={stats.total_audios} icon={FileAudio} color="bg-blue-500" />
                <KPICard title={t('researcher.kpi.patients')} value={stats.total_patients} icon={Users} color="bg-emerald-500" />
                <KPICard title={t('researcher.kpi.orthos')} value={stats.total_orthos} icon={UserCheck} color="bg-purple-500" />
                <KPICard title={t('researcher.kpi.tutors')} value={stats.total_tutors || 0} icon={Home} color="bg-amber-500" />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Gender Donut Chart (Takes 1 Col) */}
                <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center relative min-h-[400px]">
                    <h3 className="absolute top-6 start-6 text-sm font-bold text-slate-700">{t('researcher.charts.gender')}</h3>

                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none pt-4">
                        <div className="text-center">
                            <span className="block text-4xl font-bold text-slate-800">{totalGender}</span>
                            <span className="text-xs text-slate-400 uppercase font-semibold">{t('common.total')}</span>
                        </div>
                    </div>

                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={genderData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {genderData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={GENDER_COLORS[index % GENDER_COLORS.length]} strokeWidth={0} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            />
                            <Legend
                                layout="horizontal"
                                verticalAlign="bottom"
                                align="center"
                                iconType="circle"
                                formatter={(value, entry) => {
                                    const item = genderWithPercent.find(g => g.name === value);
                                    return <span className="text-slate-600 font-medium ms-1">{value} ({item?.percent}%)</span>;
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Class Distribution Cards (Takes 2 Cols) */}
                <div className="lg:col-span-2 flex flex-col gap-6">
                    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-6">
                            <TrendingUp size={20} className="text-blue-500" />
                            <h3 className="text-lg font-bold text-slate-700">{t('researcher.charts.class_dist')}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                            <ClassCard
                                label={t('sessions.details.class_label', { class: '1' })}
                                count={stats.class_distribution['Classe 1'] || 0}
                                colorClass="bg-green-100 text-green-600"
                                borderColor="border-green-500"
                            />
                            <ClassCard
                                label={t('sessions.details.class_label', { class: '2' })}
                                count={stats.class_distribution['Classe 2'] || 0}
                                colorClass="bg-orange-100 text-orange-600"
                                borderColor="border-orange-500"
                            />
                            <ClassCard
                                label={t('sessions.details.class_label', { class: '3' })}
                                count={stats.class_distribution['Classe 3'] || 0}
                                colorClass="bg-red-100 text-red-600"
                                borderColor="border-red-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResearcherDashboard;
