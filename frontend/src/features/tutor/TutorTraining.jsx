import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import AudioRecorder from '../ortho/AudioRecorder';
import { Play, Mic, CheckCircle } from 'lucide-react';

const TutorTraining = () => {
    const { t } = useTranslation();
    const { childId } = useParams();
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [child, setChild] = useState(null);

    const [selectedExercise, setSelectedExercise] = useState(null);

    useEffect(() => {
        // Fetch Child Level & Exercises
        const fetchData = async () => {
            try {
                const childRes = await api.get(`/children/${childId}`);
                setChild(childRes.data);

                const level = childRes.data.evaluation_level || 'classe_1';

                const exRes = await api.get(`/training/?level=${level}`);
                setExercises(exRes.data);
            } catch (error) {
                console.error("Failed to load training", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [childId]);

    const handleUploadSuccess = () => {
        setSelectedExercise(null);
        // Could trigger confetti or success message
    };

    if (loading) return <div className="p-8 text-center">{t('tutor.test.loading')}</div>;

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <Link to={`/dashboard/tutor/child/${childId}`} className="text-slate-500 hover:text-slate-700"> &larr; {t('tutor.training.back_dashboard')}</Link>
                <h1 className="text-2xl font-bold">{t('tutor.training.title', { name: child?.first_name })}</h1>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl mb-6">
                <p className="font-bold text-blue-800">{t('tutor.training.current_level', { level: child?.evaluation_level ? t(`levels.${child.evaluation_level}`) : '' })}</p>
            </div>

            <div className="space-y-4">
                {exercises.length === 0 ? (
                    <p>{t('tutor.training.no_exercises')}</p>
                ) : (
                    exercises.map(ex => (
                        <div key={ex.id} className={`bg-white p-6 rounded-xl shadow-sm border transition ${selectedExercise === ex.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-100'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">{ex.title}</h3>
                                    <p className="text-slate-500">{ex.description}</p>
                                </div>
                                <button className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-200 transition">
                                    <Play size={14} /> {t('tutor.training.model_button')}
                                </button>
                            </div>

                            {selectedExercise === ex.id ? (
                                <div className="mt-4 bg-slate-50 p-4 rounded-xl">
                                    <h4 className="text-sm font-bold text-slate-700 mb-2 text-center">{t('tutor.training.start_turn')}</h4>
                                    <AudioRecorder
                                        childId={childId}
                                        uploadEndpoint="/recordings/upload"
                                        showClassification={false}
                                        defaultClassification={child?.evaluation_level?.replace('classe_', '') || '1'}
                                        onUploadSuccess={handleUploadSuccess}
                                    />
                                    <button
                                        onClick={() => setSelectedExercise(null)}
                                        className="mt-2 w-full py-2 text-sm text-slate-400 hover:text-slate-600"
                                    >
                                        {t('tutor.training.cancel')}
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setSelectedExercise(ex.id)}
                                    className="w-full py-2 border-2 border-dashed border-slate-200 rounded-lg text-slate-400 font-bold hover:border-blue-400 hover:text-blue-500 transition flex items-center justify-center gap-2"
                                >
                                    <Mic size={18} /> {t('tutor.training.train_button')}
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TutorTraining;
