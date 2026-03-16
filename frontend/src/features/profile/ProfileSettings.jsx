import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api, { API_URL } from '../../services/api';
import { Camera, User, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileSettings = () => {
    const { t } = useTranslation();
    const { user, login, setUser } = useAuth(); // Assume login updates user context or we need a specific 'updateUser' in context
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        language: 'fr'
    });
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                profile_photo: user.profile_photo || '',
                language: user.language || 'fr'
            });
        }
    }, [user]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('file', file);

        setUploading(true);
        try {
            const res = await api.post('/users/upload-photo', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update local state with new URL
            setFormData(prev => ({ ...prev, profile_photo: res.data.url }));

            // Update Context immediatly
            setUser(prev => ({ ...prev, profile_photo: res.data.url }));

            // Optionally auto-save the user profile with new photo
            // await api.put(`/users/${user.id}`, { ...formData, profile_photo: res.data.url });
            // For now, let user click "Enregistrer" to solidify execution, or just visual feedback.
        } catch (error) {
            console.error("Upload failed", error);
            setMsg(t('profile.error_upload'));
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg('');
        try {
            // Update profile endpoint
            console.log("Submitting update for user:", user.id, formData);
            const res = await api.put(`/users/${user.id}`, formData);
            console.log("Update success:", res.data);

            // UPDATE GLOBAL CONTEXT HERE
            setUser(prev => ({ ...prev, ...formData }));

            setMsg(t('profile.success'));
        } catch (error) {
            console.error("Update failed", error);
            if (error.response) {
                console.error("Response data:", error.response.data);
                setMsg(`Erreur: ${error.response.data.msg || 'Mise à jour échouée'}`);
            } else {
                setMsg(t('common.error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-8">{t('profile.title')}</h1>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-8">

                {/* Photo Section */}
                <div className="flex flex-col items-center">
                    <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center mb-4 relative overflow-hidden group">
                        {formData.profile_photo ? (
                            <img src={`${API_URL}${formData.profile_photo}`} alt="Profile" className="w-full h-full object-cover" />
                        ) : (
                            <User size={48} className="text-slate-300" />
                        )}
                        <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer">
                            <Camera className="text-white" />
                            <input
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                                disabled={uploading}
                            />
                        </label>
                    </div>
                    {uploading ? (
                        <p className="text-xs text-blue-500 animate-pulse">{t('profile.uploading')}</p>
                    ) : (
                        <p className="text-xs text-slate-400">{t('profile.change_photo_hint')}</p>
                    )}
                </div>

                {/* Form Section */}
                <div className="md:col-span-2">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fields.first_name')}</label>
                                <input
                                    type="text"
                                    name="first_name"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                                    value={formData.first_name}
                                    disabled
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fields.last_name')}</label>
                                <input
                                    type="text"
                                    name="last_name"
                                    className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
                                    value={formData.last_name}
                                    disabled
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fields.email')}</label>
                            <input
                                type="email"
                                value={formData.email}
                                disabled
                                className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fields.language')}</label>
                            <select
                                name="language"
                                value={formData.language}
                                onChange={handleChange}
                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-slate-700"
                            >
                                <option value="fr">{t('profile.languages.fr')} 🇫🇷</option>
                                <option value="en">{t('profile.languages.en')} 🇺🇸</option>
                                <option value="ar">{t('profile.languages.ar')} 🇸🇦</option>
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-500/20 disabled:opacity-70"
                        >
                            <Save size={18} /> {loading ? t('common.loading') : t('common.save')}
                        </button>

                        {msg && <p className={`mt-2 ${msg.includes('Erreur') ? 'text-red-500' : 'text-green-500'}`}>{msg}</p>}

                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileSettings;
