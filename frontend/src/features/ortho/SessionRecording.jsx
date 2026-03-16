import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import api from '../../services/api';
import AudioRecorder from './AudioRecorder';
import { ArrowLeft } from 'lucide-react';

const SessionRecording = () => {
    const { patientId } = useParams();
    const [patient, setPatient] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const response = await api.get(`/children/${patientId}`);
                setPatient(response.data);
            } catch (error) {
                console.error("Error fetching patient", error);
            }
        };
        fetchPatient();
    }, [patientId]);

    if (!patient) return <div>Chargement...</div>;

    return (
        <div className="max-w-2xl mx-auto">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-slate-400 hover:text-slate-600 mb-6 transition-colors font-medium"
            >
                <ArrowLeft size={20} /> Retour
            </button>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mb-8">
                <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Nouvelle Séance</h1>
                <div className="flex flex-wrap gap-4 text-sm mt-4">
                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                        <span className="font-bold text-slate-800">{patient.code}</span>
                    </span>
                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                        Age: <span className="font-bold text-slate-800">{patient.age} ans</span>
                    </span>
                    <span className="bg-slate-50 text-slate-600 px-3 py-1.5 rounded-lg border border-slate-100">
                        Sexe: <span className="font-bold text-slate-800">{patient.sex === 'M' ? 'Garçon' : 'Fille'}</span>
                    </span>

                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <AudioRecorder
                    childId={patientId}
                    onUploadSuccess={() => navigate(`/dashboard/children/${patientId}`)}
                />
            </div>
        </div>
    );
};

export default SessionRecording;
