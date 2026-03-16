import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { User, Plus, Search, Filter, Edit, Archive, RotateCcw } from 'lucide-react';
import CreateChildForm from './CreateChildForm';

const AdminChildrenPage = () => {
    const { t } = useTranslation();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'create'
    const [usersMap, setUsersMap] = useState({}); // To map created_by_id or ortho_id to names

    const [childToEdit, setChildToEdit] = useState(null);
    const [showArchived, setShowArchived] = useState(false);

    const fetchChildren = async () => {
        setLoading(true);
        try {
            const res = await api.get('/children/', {
                params: {
                    per_page: 100,
                    active: !showArchived ? 'true' : 'false'
                }
            });
            if (res.data.children) setChildren(res.data.children);
            else setChildren(res.data);

            const usersRes = await api.get('/users/', { params: { per_page: 1000 } });
            const map = {};
            if (usersRes.data.users) {
                usersRes.data.users.forEach(u => map[u.id] = u);
            }
            setUsersMap(map);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchChildren();
    }, [showArchived]);

    const handleCreateSuccess = () => {
        setChildToEdit(null);
        setViewMode('list');
        fetchChildren();
    };

    const handleEdit = (child) => {
        setChildToEdit(child);
        setViewMode('create');
    };

    const handleToggleArchive = async (child) => {
        if (!window.confirm(
            showArchived
                ? t('admin.children.restore_confirm')
                : t('admin.children.archive_confirm')
        )) return;

        try {
            await api.put(`/children/${child.id}`, { is_active: showArchived }); // if shown in archived, set active=true
            fetchChildren();
        } catch (err) {
            console.error(err);
            alert("Erreur lors de l'opération");
        }
    };

    if (viewMode === 'create') {
        return (
            <div className="p-6 max-w-7xl mx-auto">
                <CreateChildForm
                    onSuccess={handleCreateSuccess}
                    onCancel={() => {
                        setChildToEdit(null);
                        setViewMode('list');
                    }}
                    childToEdit={childToEdit}
                />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">
                        {showArchived ? t('admin.children.title_archives') : t('admin.children.title')}
                    </h1>
                    <p className="text-slate-500 mt-2">{t('admin.children.subtitle')}</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl transition shadow-sm font-bold border ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                        <Archive size={20} /> {showArchived ? t('admin.children.view_active') : t('admin.children.view_archives')}
                    </button>
                    {!showArchived && (
                        <button
                            onClick={() => { setChildToEdit(null); setViewMode('create'); }}
                            className="flex items-center gap-2 bg-[#00A3FF] text-white px-4 py-3 rounded-xl hover:bg-blue-600 transition shadow-md font-bold"
                        >
                            <Plus size={20} /> {t('admin.children.create_button')}
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-5 border-b border-slate-200">{t('admin.children.table.child')}</th>
                                <th className="p-5 border-b border-slate-200">{t('admin.children.table.age_sex')}</th>
                                <th className="p-5 border-b border-slate-200">{t('admin.children.table.ortho')}</th>
                                <th className="p-5 border-b border-slate-200">{t('admin.children.table.tutor')}</th>
                                <th className="p-5 border-b border-slate-200">{t('admin.children.table.created_at')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('admin.children.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">{t('common.loading')}</td></tr>
                            ) : children.length === 0 ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-500">{t('admin.children.table.empty')}</td></tr>
                            ) : children.map(child => (
                                <tr key={child.id} className="hover:bg-slate-50 transition">
                                    <td className="p-5">
                                        <div className="font-bold text-slate-700 text-base">{child.first_name} {child.last_name}</div>
                                        <div className="text-xs text-slate-400 font-mono mt-1">{child.code}</div>
                                    </td>
                                    <td className="p-5 text-slate-600">{child.age} {t('common.years')} / {child.sex}</td>
                                    <td className="p-5">
                                        {child.ortho_id && usersMap[child.ortho_id] ? (
                                            <span className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-bold">
                                                {usersMap[child.ortho_id].first_name} {usersMap[child.ortho_id].last_name}
                                            </span>
                                        ) : <span className="text-slate-400 italic">{t('admin.children.table.not_assigned')}</span>}
                                    </td>
                                    <td className="p-5">
                                        {child.tutor_id && usersMap[child.tutor_id] ? (
                                            <div className="text-sm">
                                                <div className="font-medium text-slate-700">{usersMap[child.tutor_id].first_name} {usersMap[child.tutor_id].last_name}</div>
                                                <div className="text-xs text-slate-400">{usersMap[child.tutor_id].email}</div>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="p-5 text-slate-500 text-sm">
                                        {new Date(child.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-5 flex gap-2 justify-center">
                                        <button
                                            onClick={() => handleEdit(child)}
                                            className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition"
                                            title="Modifier"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleToggleArchive(child)}
                                            className={`p-2 rounded-lg transition ${showArchived ? 'text-green-500 hover:bg-green-50' : 'text-red-400 hover:bg-red-50 hover:text-red-500'}`}
                                            title={showArchived ? "Restaurer" : "Archiver"}
                                        >
                                            {showArchived ? <RotateCcw size={18} /> : <Archive size={18} />}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminChildrenPage;
