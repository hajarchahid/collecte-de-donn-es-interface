import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { ArrowLeft, Plus, Mic, Play, Pause, MessageSquare } from 'lucide-react';
import AudioRecorder from './AudioRecorder';
import SecureAudioPlayer from '../../components/SecureAudioPlayer';

const SessionDetails = () => {
    const { t } = useTranslation();
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [isRecordingMode, setIsRecordingMode] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchSession = async () => {
        try {
            const res = await api.get(`/sessions/${sessionId}`);
            setSession(res.data);
        } catch (error) {
            console.error("Error fetching session", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSession();
    }, [sessionId]);

    const handleUploadSuccess = async () => {
        setIsRecordingMode(false);
        await fetchSession(); // Refresh list
    };

    const [notes, setNotes] = useState('');
    const [savingNotes, setSavingNotes] = useState(false);

    useEffect(() => {
        if (session) setNotes(session.notes || '');
    }, [session]);

    const saveNotes = async () => {
        setSavingNotes(true);
        try {
            await api.put(`/sessions/${sessionId}`, { notes });
            setSession(prev => ({ ...prev, notes }));
        } catch (error) {
            console.error("Failed to save notes", error);
            alert("Erreur lors de l'enregistrement des notes");
        } finally {
            setSavingNotes(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">{t('patients.loading')}</div>;
    if (!session) return <div className="p-8 text-center text-red-500">{t('sessions.not_found')}</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <button
                onClick={() => navigate(`/dashboard/children/${session.child_id}`)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 transition-colors"
            >
                <ArrowLeft size={18} /> {t('sessions.details.back')}
            </button>

            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">{t('sessions.details.title')}</h1>
                    <p className="text-slate-500 mt-1">
                        {t('sessions.details.created_at', { date: new Date(session.created_at).toLocaleDateString(), time: new Date(session.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) })}
                    </p>
                </div>
                {!isRecordingMode && (
                    <button
                        onClick={() => setIsRecordingMode(true)}
                        className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 font-semibold"
                    >
                        <Plus size={20} /> {t('sessions.details.add_recording')}
                    </button>
                )}
            </div>

            {isRecordingMode ? (
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mb-8 animate-in fade-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Mic className="text-red-500" /> {t('sessions.details.new_recording')}
                        </h2>
                        <button
                            onClick={() => setIsRecordingMode(false)}
                            className="text-slate-400 hover:text-slate-600 text-sm font-medium"
                        >
                            {t('common.cancel')}
                        </button>
                    </div>
                    {/* We need to update AudioRecorder to accept sessionId and optionally patientId */}
                    <AudioRecorder
                        childId={session.child_id}
                        sessionId={session.id}
                        onUploadSuccess={handleUploadSuccess}
                    />
                </div>
            ) : null}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-bold text-slate-700 flex items-center gap-2">
                        {t('sessions.details.recordings_title', { count: session.recordings.length })}
                    </h3>
                </div>

                {session.recordings.length === 0 ? (
                    <div className="p-10 text-center text-slate-400">
                        {t('sessions.details.no_recordings')}
                    </div>
                ) : (
                    <div className="p-6 space-y-8">
                        {['1', '2', '3'].map(cls => {
                            const classRecordings = session.recordings.filter(r =>
                                r.classification === cls ||
                                r.classification === `Class ${cls}` ||
                                (cls === '1' && !r.classification)
                            );
                            if (classRecordings.length === 0) return null;

                            return (
                                <div key={cls}>
                                    <h4 className="font-bold text-slate-500 uppercase text-xs tracking-wider mb-3 ps-2 border-s-4 border-blue-500">
                                        {t('sessions.details.class_label', { class: cls })}
                                    </h4>
                                    <div className="space-y-3">
                                        {classRecordings.map(rec => (
                                            <div key={rec.id} className="p-4 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${cls === '1' ? 'bg-green-100 text-green-700' :
                                                        cls === '2' ? 'bg-orange-100 text-orange-700' :
                                                            'bg-red-100 text-red-700'
                                                        }`}>
                                                        C{cls}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-slate-800">{rec.original_name || rec.filename}</p>
                                                        <p className="text-xs text-slate-400">
                                                            {new Date(rec.created_at).toLocaleString('fr-FR', {
                                                                day: '2-digit',
                                                                month: '2-digit',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                second: '2-digit'
                                                            })}
                                                        </p>
                                                    </div>
                                                </div>

                                                <SecureAudioPlayer filename={rec.filename} />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Session Notes/Comments */}
            <div className="mt-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                    <MessageSquare size={18} className="text-blue-500" />
                    {t('sessions.details.notes_title')}
                </h3>
                <div className="space-y-3">
                    <textarea
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all min-h-[120px] resize-y"
                        placeholder={t('sessions.details.notes_placeholder')}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    />
                    <div className="flex justify-end">
                        <button
                            onClick={saveNotes}
                            disabled={savingNotes || notes === (session.notes || '')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {savingNotes ? t('common.loading') : t('common.save')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SessionDetails;
