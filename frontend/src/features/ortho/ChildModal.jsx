import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { X } from 'lucide-react';

// ... imports ...

const ChildModal = ({ onClose, patient = null }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        birth_date: '',
        sex: 'M',
        pathology: '',
        comments: ''
    });
    const [calculatedAge, setCalculatedAge] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (patient) {
            // Logic to split name if first/last missing (Legacy support)
            let fName = patient.first_name || '';
            let lName = patient.last_name || '';

            if (!fName && !lName && patient.name) {
                const parts = patient.name.split(' ');
                if (parts.length > 0) {
                    fName = parts[0];
                    lName = parts.slice(1).join(' ');
                }
            }

            setFormData({
                first_name: fName,
                last_name: lName,
                birth_date: patient.birth_date || '', // YYYY-MM-DD
                sex: patient.sex || 'M',
                pathology: patient.pathology || '',
                // Tutor Fields
                tutor_first_name: patient.tutor_first_name || '',
                tutor_last_name: patient.tutor_last_name || '',
                tutor_email: patient.tutor_email || '',
                tutor_phone: patient.tutor_phone || ''
            });
        }
    }, [patient]);

    // Auto-calculate age whenever birth_date changes
    useEffect(() => {
        if (formData.birth_date) {
            const birthDate = new Date(formData.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            setCalculatedAge(age >= 0 ? age : 0);
        } else {
            setCalculatedAge('');
        }
    }, [formData.birth_date]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            // backend handles age calculation via birth_date

            // Format payload to match backend expectation
            const apiPayload = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                birth_date: formData.birth_date,
                sex: formData.sex,
                pathology: formData.pathology,
                password: formData.password,
                // Nested tutor object
                tutor: {
                    first_name: formData.tutor_first_name,
                    last_name: formData.tutor_last_name,
                    email: formData.tutor_email,
                    phone: formData.tutor_phone
                }
            };

            if (patient) {
                await api.put(`/children/${patient.id}`, apiPayload);
            } else {
                await api.post('/children/', apiPayload);
            }
            onClose();
        } catch (error) {
            console.error("Failed to save patient", error);
            const errMsg = error.response?.data?.msg || error.message || "Erreur inconnue";
            alert(`Erreur: ${errMsg}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-6 border-b border-slate-100 flex-shrink-0">
                    <h2 className="text-xl font-bold text-slate-800">
                        {patient ? t('patients.modal.title_edit') : t('patients.modal.title_new')}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-slate-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                    <div className="flex gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.labels.first_name')}</label>
                            <input
                                type="text"
                                name="first_name"
                                required
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                placeholder={t('patients.modal.labels.first_name')}
                                value={formData.first_name}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="flex-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.labels.last_name')}</label>
                            <input
                                type="text"
                                name="last_name"
                                required
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
                                placeholder={t('patients.modal.labels.last_name')}
                                value={formData.last_name}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.labels.dob')}</label>
                            <input
                                type="date"
                                name="birth_date"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition text-sm"
                                value={formData.birth_date}
                                onChange={handleChange}
                                required
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.labels.sex')}</label>
                            <select
                                name="sex"
                                className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition bg-white"
                                value={formData.sex}
                                onChange={handleChange}
                            >
                                <option value="M">{t('common.male')}</option>
                                <option value="F">{t('common.female')}</option>
                            </select>
                        </div>
                    </div>



                    <div className="pt-4 border-t border-slate-100 mt-4">
                        <h3 className="text-md font-bold text-slate-800 mb-3">{t('patients.modal.tutor.title')}</h3>
                        <p className="text-xs text-slate-500 mb-4">{t('patients.modal.tutor.description')}</p>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.tutor.first_name')}</label>
                                <input
                                    type="text"
                                    name="tutor_first_name"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"
                                    placeholder={t('patients.modal.tutor.first_name')}
                                    value={formData.tutor_first_name || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.tutor.last_name')}</label>
                                <input
                                    type="text"
                                    name="tutor_last_name"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"
                                    placeholder={t('patients.modal.tutor.last_name')}
                                    value={formData.tutor_last_name || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.tutor.email')}</label>
                                <input
                                    type="email"
                                    name="tutor_email"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"
                                    placeholder="email@example.com"
                                    value={formData.tutor_email || ''}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('patients.modal.tutor.phone')}</label>
                                <input
                                    type="tel"
                                    name="tutor_phone"
                                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-blue-500 outline-none transition"
                                    placeholder="06 00 00 00 00"
                                    value={formData.tutor_phone || ''}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-[#00A3FF] text-white px-4 py-2 rounded-xl hover:bg-blue-600 font-medium transition disabled:opacity-50"
                        >
                            {loading ? t('patients.loading') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChildModal;
