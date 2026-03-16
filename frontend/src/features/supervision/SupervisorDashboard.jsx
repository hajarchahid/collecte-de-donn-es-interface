import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Users, FileAudio, ClipboardList, Activity, Play, Pause, Loader2, ShieldCheck, Info, GraduationCap } from 'lucide-react';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer
} from 'recharts';

const SupervisorDashboard = () => {
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [temporalData, setTemporalData] = useState([]);
    const [samples, setSamples] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAllData = async () => {
            try {
                const [summaryRes, temporalRes, sampleRes] = await Promise.all([
                    api.get('/stats/summary'),
                    api.get('/stats/temporal'),
                    api.get('/stats/sample')
                ]);

                setStats(summaryRes.data);
                setTemporalData(temporalRes.data);
                setSamples(sampleRes.data);
            } catch (error) {
                console.error("Failed to load supervisor data", error);
            } finally {
                setLoading(false);
            }
        };

        loadAllData();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-96 text-slate-400">
            <Loader2 className="animate-spin me-2" /> {t('supervisor.loading')}
        </div>
    );

    if (!stats) return <div className="p-10 text-center text-red-500">{t('common.error_load')}</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto pb-10">
            {/* Header with Ethical Badge */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">{t('supervisor.title')}</h2>
                    <p className="text-slate-500">{t('supervisor.subtitle')}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck size={16} />
                    {t('supervisor.badge')}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard
                    icon={FileAudio}
                    title={t('supervisor.stats.recordings')}
                    value={stats.total_recordings}
                    color="bg-blue-500"
                />
                <StatCard
                    icon={Users}
                    title={t('supervisor.stats.patients')}
                    value={stats.total_patients}
                    color="bg-emerald-500"
                />
                <StatCard
                    icon={Activity}
                    title={t('supervisor.stats.orthos')}
                    value={stats.total_ortho}
                    color="bg-purple-500"
                />
                <StatCard
                    icon={GraduationCap}
                    title={t('supervisor.stats.researchers')}
                    value={stats.total_researchers}
                    color="bg-orange-500"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Evolution Chart (2 cols) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 flex items-center gap-2">
                        <Activity size={20} className="text-blue-500" />
                        {t('supervisor.charts.evolution')}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={temporalData}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                                />
                                <RechartsTooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="total"
                                    stroke="#3B82F6"
                                    strokeWidth={3}
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                    name={t('supervisor.charts.total')}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Class Distribution (1 col) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 w-full text-start">{t('supervisor.charts.class_dist')}</h3>
                    <div className="space-y-6 w-full">
                        {Object.entries(stats.class_distribution).map(([label, count]) => (
                            <div key={label}>
                                <div className="flex justify-between text-sm mb-2 font-medium text-slate-600">
                                    <span>{t('sessions.details.class_label', { class: label.replace('Classe ', '') })}</span>
                                    <span className="font-bold text-slate-800">{count} ({stats.total_recordings > 0 ? ((count / stats.total_recordings) * 100).toFixed(1) : 0}%)</span>
                                </div>
                                <div className="w-full bg-slate-100 rounded-full h-3">
                                    <div
                                        className="h-3 rounded-full transition-all duration-1000 ease-out shadow-sm"
                                        style={{
                                            width: `${stats.total_recordings > 0 ? (count / stats.total_recordings) * 100 : 0}%`,
                                            backgroundColor: label.includes('1') ? '#10B981' : label.includes('2') ? '#F59E0B' : '#EF4444'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                        {Object.keys(stats.class_distribution).length === 0 && <div className="text-slate-400 italic text-center py-4">{t('researcher.exploration.no_results')}</div>}
                    </div>
                </div>
            </div>

            {/* Methodological Listening Section */}
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileAudio className="text-purple-500" />
                            {t('supervisor.listening.title')}
                        </h3>
                        <p className="text-slate-500 text-sm mt-1">
                            {t('supervisor.listening.description')}
                        </p>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-slate-400 hover:text-blue-500 transition-colors flex items-center gap-1"
                    >
                        <Loader2 size={14} /> {t('supervisor.listening.refresh')}
                    </button>
                </div>

                <div className="space-y-3">
                    {samples.map((rec) => (
                        <SupervisorAudioPlayer key={rec.id} recording={rec} t={t} />
                    ))}
                    {samples.length === 0 && <p className="text-slate-400 italic">Aucun enregistrement disponible.</p>}
                </div>

                <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-sm text-blue-700">
                    <Info size={20} className="shrink-0" />
                    <p>
                        {t('supervisor.listening.disclaimer')}
                    </p>
                </div>
            </div>
        </div>
    );
};

// Sub-component for Supervisor Player
const SupervisorAudioPlayer = ({ recording, t }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);

    const togglePlay = async () => {
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            if (!audioUrl) {
                setLoading(true);
                try {
                    const response = await api.get(`/stats/listen/${recording.id}`, { responseType: 'blob' });
                    const url = URL.createObjectURL(response.data);
                    setAudioUrl(url);
                    // Need to wait for state update before playing? 
                    // Better to set src directly on audio element or use Effect.
                    // But ref access is immediate? No, url state takes a render tick.
                    // Let's use a temp variable for immediate play or useEffect.

                    // Actually, let's just use the url directly in the audio tag but we need to wait for render.
                } catch (err) {
                    console.error("Audio load failed", err);
                    alert(t('researcher.exploration.error_audio')); // Simple alert for now
                } finally {
                    setLoading(false);
                }
            } else {
                audioRef.current.play();
                setIsPlaying(true);
            }
        }
    };

    // Effect to auto-play when URL is set (first load on play click)
    useEffect(() => {
        if (audioUrl && audioRef.current && !isPlaying && !loading) {
            audioRef.current.play().then(() => setIsPlaying(true)).catch(e => console.error(e));
        }
    }, [audioUrl]);

    // Cleanup
    useEffect(() => {
        return () => {
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    return (
        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 group">
            <div className="flex items-center gap-4">
                <button
                    onClick={togglePlay}
                    disabled={loading}
                    className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 hover:text-blue-600 hover:border-blue-200 shadow-sm transition-all"
                >
                    {loading ? <Loader2 size={18} className="animate-spin" /> : isPlaying ? <Pause size={18} /> : <Play size={18} className="ms-1" />}
                </button>
                <div>
                    <div className="font-bold text-slate-700 text-sm">{t('supervisor.player.recording', { id: recording.id })}</div>
                    <div className="text-xs text-slate-500 font-mono">
                        {t('sessions.details.class_label', { class: recording.classification.replace('Classe ', '') })} • {Math.floor(recording.duration)}{t('supervisor.player.seconds_short')} • {new Date(recording.created_at).toLocaleDateString()}
                    </div>
                </div>
            </div>

            {/* Hidden Audio Element */}
            <audio
                ref={audioRef}
                src={audioUrl || ""}
                onEnded={() => setIsPlaying(false)}
                onPause={() => setIsPlaying(false)}
                onPlay={() => setIsPlaying(true)}
            />

            <div className="text-xs text-slate-400 font-semibold px-3 py-1 bg-slate-200/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                {t('supervisor.player.secure_badge')}
            </div>
        </div>
    );
};

const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between transition-transform hover:scale-[1.01]">
        <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
        </div>
        <div className={`p-4 rounded-xl ${color} shadow-lg shadow-black/5`}>
            <Icon size={24} className="text-white" />
        </div>
    </div>
);

export default SupervisorDashboard;
