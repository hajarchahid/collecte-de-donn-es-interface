import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Clock, FileAudio, Calendar, User, Activity, MessageSquare } from 'lucide-react';

const ChildDetails = () => {
    const { t } = useTranslation();
    const { patientId } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSessions, setTotalSessions] = useState(0);

    const fetchPatient = async () => {
        try {
            const response = await api.get(`/children/${patientId}`);
            setPatient(response.data);
        } catch (err) {
            console.error(err);
            setError("Impossible de charger le patient");
        }
    };

    const fetchSessions = async () => {
        try {
            const res = await api.get(`/sessions/child/${patientId}`, {
                params: { page: currentPage, per_page: 5 }
            });
            if (res.data.sessions) {
                setSessions(res.data.sessions);
                setTotalPages(res.data.pages);
                setTotalSessions(res.data.total);
            } else {
                setSessions(res.data); // Fallback
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await Promise.all([fetchPatient(), fetchSessions()]);
            setLoading(false);
        };
        init();
    }, [patientId]);

    useEffect(() => {
        fetchSessions();
    }, [currentPage]);

    const createSession = async () => {
        try {
            const res = await api.post('/sessions/', { child_id: patientId });
            navigate(`/dashboard/sessions/${res.data.id}`);
        } catch (error) {
            console.error("Failed to create session", error);
        }
    };

    const [comments, setComments] = useState('');
    const [savingComments, setSavingComments] = useState(false);

    useEffect(() => {
        if (patient) setComments(patient.comments || '');
    }, [patient]);

    const saveComments = async () => {
        setSavingComments(true);
        try {
            await api.put(`/children/${patientId}`, { comments });
            // Update patient state locally to reflect "saved" state (disable button)
            setPatient(prev => ({ ...prev, comments }));
        } catch (error) {
            console.error("Failed to save comments", error);
            alert("Erreur lors de l'enregistrement des remarques");
        } finally {
            setSavingComments(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">{t('patients.loading')}</div>;
    if (error) return (
        <div className="p-8 max-w-2xl mx-auto mt-10 bg-red-50 border border-red-200 rounded-2xl text-center">
            <h3 className="text-red-700 font-bold text-lg mb-2">Erreur lors du chargement</h3>
            <p className="text-red-600 font-mono text-sm break-all">{error}</p>
            <button onClick={() => navigate('/dashboard/children')} className="mt-4 px-4 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50">Retour liste</button>
        </div>
    );
    if (!patient) return <div className="p-8 text-center text-red-500">{t('patients.not_found')}</div>;

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <button
                        onClick={() => navigate('/dashboard/children')}
                        className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-2 transition-colors"
                    >
                        <ArrowLeft size={18} /> {t('patients.details.back')}
                    </button>
                    <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-3">
                        {patient.name || t('patients.unnamed')}
                        <span className="text-lg font-normal text-slate-400 bg-slate-100 px-3 py-1 rounded-full font-mono">{patient.code}</span>
                    </h1>
                </div>
                <button
                    onClick={createSession}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/30 font-semibold"
                >
                    <FileAudio size={20} /> {t('patients.details.new_session')}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Info Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">{t('patients.details.tabs.info')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-500"><User size={16} /></div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-semibold">{t('patients.details.age_sex')}</p>
                                    <p className="font-medium">{patient.age} {t('common.years')}, {patient.sex === 'M' ? t('common.male') : t('common.female')}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-slate-600">
                                <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500"><Calendar size={16} /></div>
                                <div>
                                    <p className="text-xs text-slate-400 uppercase font-semibold">{t('patients.table.registered_at')}</p>
                                    <p className="font-medium">{new Date(patient.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Tutor Card */}
                    {patient.tutor_id && (
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                            <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                                <User size={18} className="text-green-500" />
                                {t('patients.details.tutor_title')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center text-green-600 font-bold">
                                        {patient.tutor_name ? patient.tutor_name[0].toUpperCase() : 'T'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-slate-800">{patient.tutor_name}</p>
                                        <p className="text-xs text-slate-400">{t('patients.details.tutor_name_label')}</p>
                                    </div>
                                </div>
                                {patient.tutor_email && (
                                    <div className="flex items-center gap-3 ps-2">
                                        <div className="text-slate-400 text-xs w-6">@</div>
                                        <p className="text-sm text-slate-600">{patient.tutor_email}</p>
                                    </div>
                                )}
                                {patient.tutor_phone && (
                                    <div className="flex items-center gap-3 ps-2">
                                        <div className="text-slate-400 text-xs w-auto min-w-[30px]">{t('patients.details.tutor_phone_label')}</div>
                                        <p className="text-sm text-slate-600">{patient.tutor_phone}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Remarks & Comments Section */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-500" />
                            {t('patients.details.remarks_title')}
                        </h3>
                        <div className="space-y-3">
                            <textarea
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px] resize-y"
                                placeholder={t('patients.details.remarks_placeholder')}
                                value={comments}
                                onChange={(e) => setComments(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={saveComments}
                                    disabled={savingComments || comments === patient.comments}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {savingComments ? t('common.loading') : t('common.save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-slate-800">{t('patients.details.session_history')}</h3>
                            <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">{t('patients.details.stats.sessions', { count: totalSessions })} ({t('common.total')}: {totalSessions})</span>
                        </div>

                        {sessions.length === 0 ? (
                            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
                                <FileAudio size={48} className="mb-4 text-slate-200" />
                                <p>{t('patients.details.no_sessions')}</p>
                                <button
                                    onClick={createSession}
                                    className="mt-4 text-blue-500 hover:underline text-sm font-semibold"
                                >
                                    {t('patients.details.start_session')}
                                </button>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {sessions.map((session) => (
                                    <div key={session.id} className="p-5 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center font-bold">
                                                {new Date(session.created_at).getDate()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700">{t('patients.details.session_date', { date: new Date(session.created_at).toLocaleDateString() })}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-slate-400">{new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                                        {t('patients.details.recordings_count', { count: session.recordings_count || 0 })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => navigate(`/dashboard/sessions/${session.id}`)}
                                            className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-colors"
                                        >
                                            {t('common.view')}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-4 p-6 border-t border-slate-100">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => p - 1)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                                >
                                    {t('common.prev')}
                                </button>
                                <span className="text-slate-600 text-sm">{t('common.page_info', { current: currentPage, total: totalPages })}</span>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => p + 1)}
                                    className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                                >
                                    {t('common.next')}
                                </button>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChildDetails;
