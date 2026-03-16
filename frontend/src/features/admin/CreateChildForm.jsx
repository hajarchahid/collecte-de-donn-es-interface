import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { User, Check, AlertCircle, Search, Plus, X } from 'lucide-react';

const CreateChildForm = ({ onSuccess, onCancel, childToEdit = null }) => {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [orthophonists, setOrthophonists] = useState([]);

    // Form States
    const [formData, setFormData] = useState({
        last_name: '',
        first_name: '',
        sex: 'M',
        birth_date: '',
        pathology: '',
        progression_level: '',
        comments: '',
        ortho_id: '',
        tutor: {
            mode: 'search', // 'search' or 'create'
            id: null,
            email: '',
            first_name: '',
            last_name: '',
            phone: '',
            language: 'fr'
        }
    });

    const [tutorSearchQuery, setTutorSearchQuery] = useState('');
    const [foundTutors, setFoundTutors] = useState([]);
    const [selectedTutor, setSelectedTutor] = useState(null);

    // Fetch Orthophonists on mount
    useEffect(() => {
        const fetchOrthos = async () => {
            try {
                console.log("Fetching orthophonists...");
                const res = await api.get('/users/', { params: { role: 'orthophoniste', per_page: 100 } });
                console.log("Orthophonists response:", res.data);
                if (res.data.users) {
                    console.log("Setting orthophonists from users array:", res.data.users);
                    setOrthophonists(res.data.users);
                } else {
                    console.log("Setting orthophonists from data root:", res.data);
                    setOrthophonists(res.data);
                }
            } catch (err) {
                console.error("Failed to fetch orthophonists", err);
            }
        };
        fetchOrthos();
    }, []);

    // Search Tutors
    useEffect(() => {
        const searchTutors = async () => {
            if (tutorSearchQuery.length < 2) {
                setFoundTutors([]);
                return;
            }
            try {
                const res = await api.get('/users/', { params: { role: 'tutor', search: tutorSearchQuery } });
                if (res.data.users) setFoundTutors(res.data.users);
                else setFoundTutors(res.data);
            } catch (err) {
                console.error("Search failed", err);
            }
        };

        const timeoutId = setTimeout(searchTutors, 500);
        return () => clearTimeout(timeoutId);
    }, [tutorSearchQuery]);

    // Pre-fill for Edit
    useEffect(() => {
        if (childToEdit) {
            setFormData({
                last_name: childToEdit.last_name || '',
                first_name: childToEdit.first_name || '',
                sex: childToEdit.sex || 'M',
                birth_date: childToEdit.birth_date ? childToEdit.birth_date.split('T')[0] : '', // Handle ISO date
                pathology: childToEdit.pathology || '',
                progression_level: childToEdit.progression_level || '',
                comments: childToEdit.comments || '',
                ortho_id: childToEdit.ortho_id || '',
                tutor: {
                    mode: 'search',
                    id: childToEdit.tutor_id || null,
                    email: childToEdit.tutor_email || '',
                    first_name: childToEdit.tutor_first_name || '',
                    last_name: childToEdit.tutor_last_name || '',
                    phone: childToEdit.tutor_phone || '',
                    language: 'fr'
                }
            });

            if (childToEdit.tutor_id) {
                // Mock selected tutor for UI
                setSelectedTutor({
                    id: childToEdit.tutor_id,
                    email: childToEdit.tutor_email,
                    first_name: childToEdit.tutor_first_name,
                    last_name: childToEdit.tutor_last_name
                });
            }
        }
    }, [childToEdit]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleTutorChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            tutor: { ...prev.tutor, [field]: value }
        }));
    };

    const selectTutor = (tutor) => {
        setSelectedTutor(tutor);
        handleTutorChange('id', tutor.id);
        handleTutorChange('email', tutor.email); // For display
        setTutorSearchQuery('');
        setFoundTutors([]);
    };

    const clearSelectedTutor = () => {
        setSelectedTutor(null);
        handleTutorChange('id', null);
        handleTutorChange('email', '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!formData.ortho_id) {
            setError(t('admin.children.form.error_ortho_required') || "Orthophonist is required");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                tutor: formData.tutor.mode === 'create' ? {
                    email: formData.tutor.email,
                    first_name: formData.tutor.first_name,
                    last_name: formData.tutor.last_name,
                    phone: formData.tutor.phone,
                    language: formData.tutor.language
                } : {
                    id: selectedTutor?.id,
                    email: selectedTutor?.email // Fallback if ID is somehow missing but shouldn't be
                }
            };

            if (childToEdit) {
                await api.put(`/children/${childToEdit.id}`, payload);
            } else {
                await api.post('/children/', payload);
            }

            if (onSuccess) onSuccess();
        } catch (err) {
            setError(err.response?.data?.msg || "Operation failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800">
                    {childToEdit ? (t('admin.children.edit_title') || "Modifier dossier enfant") : (t('admin.children.create_title') || "Créer un dossier enfant")}
                </h2>
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        onCancel();
                    }}
                    className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-600 rounded-full transition"
                >
                    <X size={24} />
                </button>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                    <AlertCircle size={18} />
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Child Info */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{t('admin.children.form.section_child')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.last_name')}</label>
                            <input
                                required
                                name="last_name"
                                value={formData.last_name}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.first_name')}</label>
                            <input
                                required
                                name="first_name"
                                value={formData.first_name}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.dob')}</label>
                            <input
                                type="date"
                                required
                                name="birth_date"
                                value={formData.birth_date}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.sex')}</label>
                            <select
                                name="sex"
                                value={formData.sex}
                                onChange={handleInputChange}
                                className="w-full p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                            >
                                <option value="M">{t('common.male')}</option>
                                <option value="F">{t('common.female')}</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* Orthophonist Assignment */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">
                        {t('admin.children.form.section_ortho')}
                        <span className="text-xs font-normal text-slate-300 ml-2">({orthophonists.length} available)</span>
                    </h3>
                    <select
                        required
                        name="ortho_id"
                        value={formData.ortho_id}
                        onChange={handleInputChange}
                        className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none bg-slate-50"
                    >
                        <option value="">{t('admin.children.form.select_ortho')}</option>
                        {orthophonists.length > 0 ? (
                            orthophonists.map(ortho => (
                                <option key={ortho.id} value={ortho.id}>
                                    {ortho.last_name || 'Sans Nom'} {ortho.first_name || ''} ({ortho.email})
                                </option>
                            ))
                        ) : (
                            <option disabled>Aucun orthophoniste trouvé</option>
                        )}
                    </select>
                </section>

                {/* Tutor Selection/Creation */}
                <section>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">{t('admin.children.form.section_tutor')}</h3>
                    <div className="flex gap-4 mb-4">
                        <button
                            type="button"
                            onClick={() => handleTutorChange('mode', 'search')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${formData.tutor.mode === 'search' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {t('admin.children.form.search_tutor_btn')}
                        </button>
                        <button
                            type="button"
                            onClick={() => handleTutorChange('mode', 'create')}
                            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${formData.tutor.mode === 'create' ? 'bg-green-600 text-white shadow-md' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {t('admin.children.form.create_tutor_btn')}
                        </button>
                    </div>

                    {formData.tutor.mode === 'search' ? (
                        <div className="space-y-4">
                            {!selectedTutor ? (
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                                    <input
                                        placeholder={t('admin.children.form.search_placeholder')}
                                        value={tutorSearchQuery}
                                        onChange={(e) => setTutorSearchQuery(e.target.value)}
                                        className="w-full pl-10 p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 outline-none"
                                    />
                                    {foundTutors.length > 0 && (
                                        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-100 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {foundTutors.map(tutor => (
                                                <div
                                                    key={tutor.id}
                                                    onClick={() => selectTutor(tutor)}
                                                    className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-50 last:border-0 flex justify-between items-center"
                                                >
                                                    <div>
                                                        <div className="font-semibold text-slate-800">{tutor.last_name} {tutor.first_name}</div>
                                                        <div className="text-xs text-slate-500">{tutor.email}</div>
                                                    </div>
                                                    <Plus size={16} className="text-blue-500" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex justify-between items-center p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                            {selectedTutor.last_name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-800">{selectedTutor.last_name} {selectedTutor.first_name}</div>
                                            <div className="text-sm text-slate-500">{selectedTutor.email}</div>
                                        </div>
                                    </div>
                                    <button type="button" onClick={clearSelectedTutor} className="text-sm text-red-500 hover:underline">{t('admin.children.form.change_tutor')}</button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-green-50 p-4 rounded-xl border border-green-100">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.last_name')}</label>
                                <input
                                    required={formData.tutor.mode === 'create'}
                                    value={formData.tutor.last_name}
                                    onChange={(e) => handleTutorChange('last_name', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('patients.modal.labels.first_name')}</label>
                                <input
                                    required={formData.tutor.mode === 'create'}
                                    value={formData.tutor.first_name}
                                    onChange={(e) => handleTutorChange('first_name', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.users.modal.fields.email')}</label>
                                <input
                                    required={formData.tutor.mode === 'create'}
                                    type="email"
                                    value={formData.tutor.email}
                                    onChange={(e) => handleTutorChange('email', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('admin.users.modal.fields.phone')}</label>
                                <input
                                    value={formData.tutor.phone}
                                    onChange={(e) => handleTutorChange('phone', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fields.language')}</label>
                                <select
                                    value={formData.tutor.language}
                                    onChange={(e) => handleTutorChange('language', e.target.value)}
                                    className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none"
                                >
                                    <option value="fr">{t('profile.languages.fr')}</option>
                                    <option value="ar">{t('profile.languages.ar')}</option>
                                    <option value="en">{t('profile.languages.en')}</option>
                                </select>
                            </div>
                        </div>
                    )}
                </section>

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.preventDefault();
                            onCancel();
                        }}
                        className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg transition"
                    >
                        {t('common.cancel')}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2 bg-[#00A3FF] text-white font-bold rounded-lg hover:bg-blue-600 transition shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                        {t('common.save')}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateChildForm;
