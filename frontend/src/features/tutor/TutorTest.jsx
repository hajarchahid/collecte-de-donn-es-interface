import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import AudioRecorder from '../ortho/AudioRecorder';
import api from '../../services/api';

const TutorTest = () => {
    const { childId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [child, setChild] = useState(null);
    const [result, setResult] = useState(null);

    useEffect(() => {
        const loadChild = async () => {
            const res = await api.get(`/children/${childId}`);
            setChild(res.data);
        };
        loadChild();
    }, [childId]);

    const handleTestSuccess = (data) => {
        // data contains: { msg, level, score, filename }
        setResult(data);
    };

    const finish = () => {
        navigate(`/dashboard/tutor/child/${childId}`);
    };

    if (!child) return <div className="p-8 text-center">{t('tutor.test.loading')}</div>;

    if (result) {
        return (
            <div className="max-w-xl mx-auto p-8 text-center bg-white rounded-2xl shadow-lg mt-10">
                <div className="mb-6 text-green-500">
                    <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                <h2 className="text-2xl font-bold mb-2">{t('tutor.test.hero_title')}</h2>
                <p className="text-slate-600 mb-6">{t('tutor.test.hero_desc')}</p>

                <div className="bg-blue-50 p-6 rounded-xl mb-6">
                    <p className="text-sm text-slate-500 uppercase tracking-wide">{t('tutor.test.recommended_level')}</p>
                    <p className="text-3xl font-extrabold text-blue-600 mt-2">{result.level ? t(`levels.${result.level}`) : result.level}</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl mb-6 text-left">
                    <h4 className="font-bold text-yellow-800 mb-2">{t('tutor.test.next_steps')}</h4>
                    <p className="text-sm text-yellow-700">{t('tutor.test.next_steps_desc')}</p>
                </div>

                <button onClick={finish} className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition">
                    {t('tutor.test.back_dashboard')}
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
                <button onClick={() => navigate(`/dashboard/tutor/child/${childId}`)} className="text-slate-500 hover:text-slate-700 font-medium">
                    &larr; {t('common.prev') || 'Précédent'}
                </button>
            </div>
            <h1 className="text-2xl font-bold text-center mb-2">{t('tutor.test.title')}</h1>
            <p className="text-center text-slate-500 mb-8">{t('tutor.test.subtitle')}</p>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
                <AudioRecorder
                    childId={childId}
                    uploadEndpoint="/evaluation/test"
                    showClassification={false}
                    onUploadSuccess={handleTestSuccess}
                />
            </div>
        </div>
    );
};

export default TutorTest;
