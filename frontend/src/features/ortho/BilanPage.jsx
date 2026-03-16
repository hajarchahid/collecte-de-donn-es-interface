import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { Save, ArrowLeft, Printer } from 'lucide-react';

const BilanPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Child Data
    const [child, setChild] = useState(null);

    // Form Data
    const [formData, setFormData] = useState({
        orthophonist_name: user?.username || '',
        exam_date: new Date().toISOString().split('T')[0],

        // Patient Info
        patient_last_name: '',
        patient_first_name: '',
        patient_birth_date: '',
        patient_address: '',

        // 1. Description
        deficiency_congenital: null, // true/false
        deficiency_age_appearance: '',
        age_diagnosis: '',
        age_first_fitting: '',

        // a. Schooling
        schooling_type: '', // 'ordinary', 'specialized'
        schooling_specialized_detail: '',

        // b. Deafness Degree
        deafness_degree_od: '',
        deafness_degree_og: '',
        deafness_evolutionary: null,

        // c. Equipment
        equipment_od: false,
        equipment_og: false,
        equipment_ci: false,
        date_equipment_current: '',
        date_implantation: '',

        // 2. Communication
        communication_modes: [], // Array of strings
        multimodal_detail: '',

        human_aid_necessity: null,
        human_aid_detail: '',

        phone_communication_unaided: null // Sans appareillage: Oui/Non
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [childRes, bilanRes] = await Promise.all([
                    api.get(`/children/${patientId}`),
                    api.get(`/children/${patientId}/bilan`)
                ]);

                setChild(childRes.data);

                if (bilanRes.data) {
                    setFormData(prev => ({
                        ...prev,
                        ...bilanRes.data,
                        // Pre-fill patient info if missing in Bilan, otherwise use Bilan's
                        patient_last_name: bilanRes.data.patient_last_name || childRes.data.last_name || '',
                        patient_first_name: bilanRes.data.patient_first_name || childRes.data.first_name || '',
                        patient_birth_date: bilanRes.data.patient_birth_date || (childRes.data.birth_date ? childRes.data.birth_date.split('T')[0] : ''),
                        patient_address: bilanRes.data.patient_address || '',

                        // Ensure arrays/bools are handled correctly if backend returns null
                        communication_modes: bilanRes.data.communication_modes || [],
                        equipment_od: bilanRes.data.equipment_od || false,
                        equipment_og: bilanRes.data.equipment_og || false,
                        equipment_ci: bilanRes.data.equipment_ci || false
                    }));
                } else {
                    // New Bilan: Pre-fill from Child
                    setFormData(prev => ({
                        ...prev,
                        patient_last_name: childRes.data.last_name || '',
                        patient_first_name: childRes.data.first_name || '',
                        patient_birth_date: childRes.data.birth_date ? childRes.data.birth_date.split('T')[0] : '',
                    }));
                }
            } catch (err) {
                console.error("Failed to load data", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [patientId]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            if (name === 'communication_modes') {
                const updated = checked
                    ? [...formData.communication_modes, value]
                    : formData.communication_modes.filter(m => m !== value);
                setFormData({ ...formData, communication_modes: updated });
            } else {
                setFormData({ ...formData, [name]: checked });
            }
        } else if (type === 'radio') {
            // Handle boolean radios explicitly
            if (name === 'deficiency_congenital' || name === 'deafness_evolutionary' || name === 'human_aid_necessity' || name === 'phone_communication_unaided') {
                setFormData({ ...formData, [name]: value === 'true' });
            } else {
                setFormData({ ...formData, [name]: value });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        // Clean data: Convert empty strings to null for date fields to avoid backend errors
        const payload = {
            ...formData,
            patient_birth_date: formData.patient_birth_date || null,
            date_equipment_current: formData.date_equipment_current || null,
            date_implantation: formData.date_implantation || null,
            exam_date: formData.exam_date || null,
        };

        try {
            await api.post(`/children/${patientId}/bilan`, payload);
            alert("Bilan enregistré avec succès !");
            navigate('/dashboard/children');
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'enregistrement");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center">Chargement...</div>;

    const SectionTitle = ({ title }) => (
        <h3 className="text-lg font-bold text-yellow-600 border-b border-yellow-100 pb-2 mb-4 mt-6">
            {title}
        </h3>
    );

    // Styles matching image vaguely
    return (
        <div className="p-6 max-w-5xl mx-auto bg-white min-h-screen printable-content">
            {/* Header */}
            <div className="bg-[#003366] text-white p-6 mb-8 text-center rounded-t-lg shadow-lg">
                <h1 className="text-3xl font-extrabold uppercase tracking-widest mb-2">BILAN ORTHOPHONIQUE</h1>
                <p className="italic text-blue-100">Troubles de la parole, du langage consécutifs à une déficience auditive congénitale ou acquise</p>
            </div>

            <form onSubmit={handleSubmit} className="border border-blue-900 p-8 rounded-lg shadow-sm">

                {/* Info Header */}
                <div className="grid grid-cols-2 gap-8 mb-8 border border-blue-800 p-4 rounded bg-slate-50">
                    <div>
                        <label className="font-bold text-blue-900 block mb-1">Nom de l'orthophoniste :</label>
                        <input
                            type="text"
                            name="orthophonist_name"
                            value={formData.orthophonist_name}
                            onChange={handleChange}
                            className="w-full border-b border-blue-300 bg-transparent outline-none p-1 font-medium"
                        />
                    </div>
                    <div>
                        <label className="font-bold text-blue-900 block mb-1">Date de l'examen :</label>
                        <input
                            type="date"
                            name="exam_date"
                            value={formData.exam_date}
                            onChange={handleChange}
                            className="w-full border-b border-blue-300 bg-transparent outline-none p-1 font-medium"
                        />
                    </div>
                </div>

                {/* Patient Info */}
                <div className="border border-blue-800 p-4 rounded mb-8 bg-slate-50 relative">
                    <div className="grid grid-cols-2 gap-8 mb-4">
                        <div>
                            <span className="font-bold text-blue-900 mr-2">NOM :</span>
                            <input
                                type="text"
                                name="patient_last_name"
                                value={formData.patient_last_name}
                                onChange={handleChange}
                                className="font-medium text-lg uppercase border-b border-blue-300 bg-transparent outline-none w-full max-w-xs"
                            />
                        </div>
                        <div>
                            <span className="font-bold text-blue-900 mr-2">Prénom :</span>
                            <input
                                type="text"
                                name="patient_first_name"
                                value={formData.patient_first_name}
                                onChange={handleChange}
                                className="font-medium text-lg capitalize border-b border-blue-300 bg-transparent outline-none w-full max-w-xs"
                            />
                        </div>
                    </div>
                    <div className="mb-4">
                        <span className="font-bold text-blue-900 mr-2">Date de Naissance :</span>
                        <input
                            type="date"
                            name="patient_birth_date"
                            value={formData.patient_birth_date || ''}
                            onChange={handleChange}
                            className="font-medium border-b border-blue-300 bg-transparent outline-none"
                        />
                    </div>
                    <div>
                        <span className="font-bold text-blue-900 mr-2">Adresse :</span>
                        <input
                            type="text"
                            name="patient_address"
                            value={formData.patient_address}
                            onChange={handleChange}
                            placeholder="Entrez l'adresse..."
                            className="w-full border-b border-blue-300 bg-transparent outline-none"
                        />
                    </div>
                </div>

                {/* 1. Description */}
                <div className="border border-blue-800 p-6 rounded mb-8">
                    <SectionTitle title="1 - DESCRIPTION DE LA DEFICIENCE AUDITIVE" />

                    <div className="flex flex-wrap items-center gap-6 mb-4">
                        <span className="font-medium text-slate-700">La déficience auditive est-elle congénitale ?</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="font-bold text-blue-900">OUI</span>
                            <input type="radio" name="deficiency_congenital" value="true" checked={formData.deficiency_congenital === true} onChange={handleChange} />
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                            <span className="font-bold text-blue-900">NON</span>
                            <input type="radio" name="deficiency_congenital" value="false" checked={formData.deficiency_congenital === false} onChange={handleChange} />
                        </label>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                            <span className="text-sm block text-slate-600 mb-1">Sinon, à quel âge est elle apparue ?</span>
                            <input type="text" name="deficiency_age_appearance" value={formData.deficiency_age_appearance} onChange={handleChange} className="border-b border-slate-300 outline-none w-full" />
                        </div>
                        <div>
                            <span className="text-sm block text-slate-600 mb-1">- Age au diagnostic :</span>
                            <input type="text" name="age_diagnosis" value={formData.age_diagnosis} onChange={handleChange} className="border-b border-slate-300 outline-none w-full text-blue-900 font-bold" />
                        </div>
                        <div>
                            <span className="text-sm block text-slate-600 mb-1">- Age au premier appareillage :</span>
                            <input type="text" name="age_first_fitting" value={formData.age_first_fitting} onChange={handleChange} className="border-b border-slate-300 outline-none w-full text-blue-900 font-bold" />
                        </div>
                    </div>

                    {/* a. Modalites de scolarisation */}
                    <div className="mb-6">
                        <h4 className="font-bold text-blue-900 underline mb-2">a. Modalités de scolarisation dans l'enfance :</h4>
                        <div className="ml-4 space-y-2">
                            <label className="flex items-center gap-2">
                                <input type="radio" name="schooling_type" value="ordinary" checked={formData.schooling_type === 'ordinary'} onChange={handleChange} />
                                <span>Milieu ordinaire</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <input type="radio" name="schooling_type" value="specialized" checked={formData.schooling_type === 'specialized'} onChange={handleChange} />
                                <span>Etablissement spécialisé (y compris SSEFIS)</span>
                                <input
                                    type="text"
                                    name="schooling_specialized_detail"
                                    placeholder="Préciser..."
                                    value={formData.schooling_specialized_detail}
                                    onChange={handleChange}
                                    className="border-b border-dotted border-slate-400 flex-1 outline-none ml-2 bg-transparent"
                                />
                            </div>
                        </div>
                    </div>

                    {/* b. Degre de surdite */}
                    <div className="mb-6">
                        <h4 className="font-bold text-blue-900 underline mb-2">b. Degré de surdité (sans correction) : <span className="text-xs font-normal italic">cf. annexe 1 pour le calcul de la perte auditive</span></h4>

                        {/* Wrapper for table-like structure */}
                        <div className="ml-4 space-y-3">
                            {['OD', 'OG'].map(ear => (
                                <div key={ear} className="flex items-center gap-4 flex-wrap">
                                    <span className="font-bold w-10">{ear} :</span>
                                    {['Normal', 'Léger', 'Moyen', 'Sévère', 'Profond'].map(degree => (
                                        <label key={degree} className="flex items-center gap-1 cursor-pointer">
                                            <input
                                                type="radio"
                                                name={ear === 'OD' ? 'deafness_degree_od' : 'deafness_degree_og'}
                                                value={degree}
                                                checked={formData[ear === 'OD' ? 'deafness_degree_od' : 'deafness_degree_og'] === degree}
                                                onChange={handleChange}
                                            />
                                            <span className="text-sm">{degree}</span>
                                        </label>
                                    ))}
                                </div>
                            ))}
                            <div className="flex items-center gap-4 mt-2">
                                <span className="text-sm">Contexte évolutif :</span>
                                <label className="flex items-center gap-1"><input type="radio" name="deafness_evolutionary" value="true" checked={formData.deafness_evolutionary === true} onChange={handleChange} /><span className="text-blue-900 font-bold">Oui</span></label>
                                <label className="flex items-center gap-1"><input type="radio" name="deafness_evolutionary" value="false" checked={formData.deafness_evolutionary === false} onChange={handleChange} /><span className="text-blue-900 font-bold">Non</span></label>
                            </div>
                        </div>
                    </div>

                    {/* c. Appareillage */}
                    <div>
                        <h4 className="font-bold text-blue-900 underline mb-2">c. Appareillage auditif :</h4>
                        <div className="ml-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2">
                            {/* OD / OG */}
                            {['OD', 'OG'].map(ear => (
                                <div key={ear} className="flex items-center gap-4">
                                    <span className="font-bold w-8">{ear}:</span>
                                    <label className="flex items-center gap-1"><input type="checkbox" name={`equipment_${ear.toLowerCase()}`} checked={formData[`equipment_${ear.toLowerCase()}`]} onChange={handleChange} /><span className="text-blue-900 font-bold">Oui</span></label>
                                    <label className="flex items-center gap-1"><input type="checkbox" checked={!formData[`equipment_${ear.toLowerCase()}`]} onChange={() => setFormData({ ...formData, [`equipment_${ear.toLowerCase()}`]: !formData[`equipment_${ear.toLowerCase()}`] })} /><span className="text-blue-900 font-bold">Non</span></label>
                                    {ear === 'OD' && (
                                        <div className="flex items-center ml-auto">
                                            <span className="text-sm whitespace-nowrap mr-2">Date de l'appareillage actuel :</span>
                                            <input type="date" name="date_equipment_current" value={formData.date_equipment_current || ''} onChange={handleChange} className="border-b border-slate-300 outline-none w-32 text-xs" />
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Implant */}
                            <div className="flex items-center gap-4 col-span-2 mt-2">
                                <span className="font-bold w-32 whitespace-nowrap">Implant cochléaire :</span>
                                <label className="flex items-center gap-1"><input type="checkbox" name="equipment_ci" checked={formData.equipment_ci} onChange={handleChange} /><span className="text-blue-900 font-bold">Oui</span></label>
                                <label className="flex items-center gap-1"><input type="checkbox" checked={!formData.equipment_ci} onChange={() => setFormData({ ...formData, equipment_ci: !formData.equipment_ci })} /><span className="text-blue-900 font-bold">Non</span></label>
                                <div className="flex items-center ml-auto">
                                    <span className="text-sm whitespace-nowrap mr-2">Date d’implantation :</span>
                                    <input type="date" name="date_implantation" value={formData.date_implantation || ''} onChange={handleChange} className="border-b border-slate-300 outline-none w-32 text-xs" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Communication */}
                <div className="border border-blue-800 p-6 rounded mb-8">
                    <SectionTitle title="2 - MODES DE COMMUNICATION UTILISES (au quotidien) plusieurs réponses possibles" />

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        {['Oral', 'LPC', 'LSF', 'Français Signé', 'Écrit'].map(mode => (
                            <label key={mode} className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="communication_modes"
                                    value={mode}
                                    checked={formData.communication_modes.includes(mode)}
                                    onChange={handleChange}
                                />
                                <span>{mode}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex items-center gap-2 mb-6">
                        <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
                            <input
                                type="checkbox"
                                name="communication_modes"
                                value="Multimodal"
                                checked={formData.communication_modes.includes('Multimodal')}
                                onChange={handleChange}
                            />
                            <span>Multimodal (préciser si possible)</span>
                        </label>
                        <input
                            type="text"
                            name="multimodal_detail"
                            value={formData.multimodal_detail}
                            onChange={handleChange}
                            className="border-b border-dotted border-slate-400 flex-1 outline-none"
                        />
                    </div>

                    <div className="mb-4">
                        <p className="mb-2">Nécessité d'un recours à une aide humaine (interprète, interface ou codeur LPC ..) <span className="font-bold">avec appareillage</span> :</p>
                        <div className="flex justify-end gap-8 pr-12">
                            <label className="flex items-center gap-1"><input type="radio" name="human_aid_necessity" value="true" checked={formData.human_aid_necessity === true} onChange={handleChange} /><span className="text-blue-900 font-bold">Oui</span></label>
                            <label className="flex items-center gap-1"><input type="radio" name="human_aid_necessity" value="false" checked={formData.human_aid_necessity === false} onChange={handleChange} /><span className="text-blue-900 font-bold">Non</span></label>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="font-bold">Préciser :</span>
                            <input
                                type="text"
                                name="human_aid_detail"
                                value={formData.human_aid_detail}
                                onChange={handleChange}
                                className="border-b border-dotted border-slate-400 flex-1 outline-none"
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between mt-6">
                        <span>Communication orale à l'aide d'un appareil téléphonique <span className="font-bold">sans appareillage</span> :</span>
                        <div className="flex gap-8 pr-12">
                            <label className="flex items-center gap-1"><input type="radio" name="phone_communication_unaided" value="true" checked={formData.phone_communication_unaided === true} onChange={handleChange} /><span className="text-blue-900 font-bold">Oui</span></label>
                            <label className="flex items-center gap-1"><input type="radio" name="phone_communication_unaided" value="false" checked={formData.phone_communication_unaided === false} onChange={handleChange} /><span className="text-blue-900 font-bold">Non</span></label>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-4 mt-8 no-print">
                    <button
                        type="button"
                        onClick={() => navigate('/dashboard/children')}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                    >
                        <ArrowLeft size={20} /> Retour
                    </button>
                    <button
                        type="button"
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-6 py-3 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition"
                    >
                        <Printer size={20} /> Imprimer
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 px-8 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50"
                    >
                        {saving ? 'Enregistrement...' : <><Save size={20} /> Enregistrer le Bilan</>}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default BilanPage;
