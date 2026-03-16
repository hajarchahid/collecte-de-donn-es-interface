import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { X, User, Calendar, Activity } from 'lucide-react';

const TutorChildrenModal = ({ tutor, onClose }) => {
    const { t } = useTranslation();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tutor?.id) {
            fetchChildren();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tutor]);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const response = await api.get('/children/', {
                params: { tutor_id: tutor.id }
            });
            if (response.data.children) {
                setChildren(response.data.children);
            } else {
                setChildren([]);
            }
        } catch (error) {
            console.error("Failed to fetch children for tutor", error);
        } finally {
            setLoading(false);
        }
    };

    if (!tutor) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">

                {/* Header with Gradient */}
                <div className="relative p-8 bg-gradient-to-r from-blue-600 to-indigo-700 text-white shrink-0">
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold">
                                {t('admin.tutor.children_modal.title', { name: `${tutor.first_name} ${tutor.last_name}` })}
                            </h2>
                            <p className="text-blue-100 mt-1 flex items-center gap-2">
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm backdrop-blur-md">
                                    {tutor.email}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-xl text-white transition-all backdrop-blur-sm"
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl pointer-events-none"></div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto bg-slate-50 grow">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-3">
                            <div className="animate-spin w-8 h-8 boundary-blue-500 border-t-2 border-b-2 rounded-full"></div>
                            <p>{t('common.loading')}</p>
                        </div>
                    ) : children.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-slate-500 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
                                <User size={32} />
                            </div>
                            <p className="text-lg font-medium">{t('admin.tutor.children_modal.no_children')}</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {children.map(child => (
                                <div key={child.id} className="group relative bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-200 transition-all duration-300 flex flex-col">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-sm shrink-0 ${child.sex === 'M' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600'
                                            }`}>
                                            {child.first_name?.[0] || '?'}
                                        </div>
                                        <div className="min-w-0">
                                            <h3 className="font-bold text-slate-800 text-lg truncate" title={`${child.first_name} ${child.last_name}`}>
                                                {child.first_name} {child.last_name}
                                            </h3>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-xs font-mono bg-slate-100 text-slate-500 px-2 py-0.5 rounded">
                                                    {child.code}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mt-auto">
                                        <div className="flex items-center justify-between text-sm text-slate-600 bg-slate-50 p-3 rounded-xl">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-slate-400" />
                                                <span>{child.age ? `${child.age} ${t('common.years')}` : '-'}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <User size={16} className={child.sex === 'M' ? "text-blue-400" : "text-pink-400"} />
                                                <span>{child.sex === 'M' ? t('common.male') : t('common.female')}</span>
                                            </div>
                                        </div>

                                        {child.ortho_name && (
                                            <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 p-3 rounded-xl border border-indigo-100">
                                                <Activity size={16} />
                                                <span className="font-medium truncate">
                                                    {t('admin.tutor.children_modal.ortho_label', { name: child.ortho_name })}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Decorative corner */}
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-blue-50 to-transparent rounded-tr-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-slate-100 bg-white shrink-0 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 font-semibold transition-colors"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorChildrenModal;
