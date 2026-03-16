import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

const UserModal = ({ user, onClose, mode = 'edit' }) => {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        username: '',
        first_name: '',
        last_name: '',
        email: '',
        password: '',
        phone_number: '',
        role: 'orthophoniste'
    });
    const [error, setError] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({
                username: user.username, // Keep internal
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email,
                password: '', // Don't show hash
                phone_number: user.phone_number || '',
                role: user.role === 'pending' ? 'orthophoniste' : user.role // Default to orthophoniste if pending
            });
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation V3: Email OR Phone required
        if (!formData.email && !formData.phone_number) {
            setError(t('admin.users.modal.errors.contact_required') || "Email ou Téléphone requis");
            return;
        }

        try {
            if (mode === 'approve') {
                // Approval mode
                await api.put(`/users/${user.id}/approve`, { role: formData.role });
            } else if (user) {
                // Edit mode
                const updateData = { ...formData };
                if (!updateData.password) delete updateData.password;
                await api.put(`/users/${user.id}`, updateData);
            } else {
                // Create mode
                await api.post('/users/', formData);
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.msg || t('auth.errors.default'));
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
                <h3 className="text-xl font-bold mb-4">
                    {mode === 'approve' ? t('admin.users.modal.title_approve') : (user ? t('admin.users.modal.title_edit') : t('admin.users.modal.title_create'))}
                </h3>

                {error && <div className="bg-red-50 text-red-600 p-2 rounded mb-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">

                    {mode === 'approve' ? (
                        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-4">
                            <p className="text-sm font-bold text-slate-700 mb-1">{t('admin.users.modal.fields.username')} : <span className="font-normal">{user.username}</span></p>
                            <p className="text-sm font-bold text-slate-700">{t('admin.users.modal.fields.email')} : <span className="font-normal">{user.email}</span></p>
                        </div>
                    ) : (
                        <>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">{t('admin.users.modal.fields.last_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.last_name}
                                        onChange={e => setFormData({ ...formData, last_name: e.target.value })}
                                        placeholder={t('admin.users.modal.placeholders.last_name')}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">{t('admin.users.modal.fields.first_name')}</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.first_name}
                                        onChange={e => setFormData({ ...formData, first_name: e.target.value })}
                                        placeholder={t('admin.users.modal.placeholders.first_name')}
                                    />
                                </div>
                            </div>
                            {/* Username hidden/auto-generated */}

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">{t('admin.users.modal.fields.email')}</label>
                                    <input
                                        type="email"
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="Optionnel si téléphone rempli"
                                    // Removed required, validation in handleSubmit
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700">{t('admin.users.modal.fields.phone')}</label>
                                    <input
                                        type="tel"
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.phone_number}
                                        onChange={e => setFormData({ ...formData, phone_number: e.target.value })}
                                        placeholder={t('admin.users.modal.placeholders.phone')}
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 mb-2">Note: Indiquez au moins l'email ou le téléphone.</p>

                            {!user && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        {t('admin.users.modal.fields.password_temp')}
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        minLength={8}
                                        placeholder={t('admin.users.modal.placeholders.password_received')}
                                    />
                                    <p className="text-xs text-slate-500 mt-1">{t('admin.users.modal.hints.password_email')}</p>
                                </div>
                            )}

                            {user && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700">
                                        {t('admin.users.modal.fields.password_new')} <span className="text-xs text-gray-400">{t('admin.users.modal.hints.password_empty')}</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="mt-1 w-full p-2 border rounded"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        minLength={8}
                                        placeholder={t('admin.users.modal.placeholders.password_admin')}
                                    />
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700">{t('admin.users.modal.fields.role')}</label>
                        <select
                            className="mt-1 w-full p-2 border rounded"
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        >
                            <option value="orthophoniste">{t('admin.users.modal.roles.ortho')}</option>
                            <option value="doctorante">{t('admin.users.modal.roles.researcher')}</option>
                            <option value="encadrant">{t('admin.users.modal.roles.supervisor')}</option>
                            <option value="tutor">{t('admin.users.modal.roles.tutor')}</option>

                        </select>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className={`px-4 py-2 text-white rounded hover:bg-opacity-90 ${mode === 'approve' ? 'bg-green-600' : 'bg-[#00A3FF]'}`}
                        >
                            {mode === 'approve' ? t('admin.users.modal.title_approve') : t('common.save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserModal;
