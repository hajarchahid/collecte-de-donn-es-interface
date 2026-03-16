import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Trash2, Edit, Plus, Check, Search, Calendar, Filter, X, Baby } from 'lucide-react';
import UserModal from './UserModal';
import TutorChildrenModal from './TutorChildrenModal';

const UsersList = ({ refreshUsers, initialRole = '', hideFilter = false, excludeRole = '' }) => {
    const { t } = useTranslation();
    const [users, setUsers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [modalMode, setModalMode] = useState('create');
    const [selectedTutor, setSelectedTutor] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    // Filters State
    const [roleFilter, setRoleFilter] = useState(initialRole);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFilter, setDateFilter] = useState('');

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setRoleFilter(initialRole);
    }, [initialRole]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: 10,
                role: roleFilter || undefined,
                exclude_role: excludeRole || undefined,
                search: searchQuery || undefined,
                status: statusFilter || undefined,
                date: dateFilter || undefined
            };

            const response = await api.get('/users/', { params });
            // Handle pagination response structure
            if (response.data.users) {
                setUsers(response.data.users);
                setTotalPages(response.data.pages);
                setTotalUsers(response.data.total);
            } else if (Array.isArray(response.data)) {
                // Fallback for legacy array response
                setUsers(response.data);
                setTotalUsers(response.data.length);
                setTotalPages(1);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    // Auto-fetch ONLY on initial load, page change, or role change (from props)
    // Search, Status, Date are now manual triggers via "Appliquer" button
    useEffect(() => {
        if (!searchQuery && !statusFilter && !dateFilter) {
            fetchUsers();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, refreshUsers, roleFilter]);

    // Trigger fetch when status/date changes? Or keep manual? 
    // User asked for "Apply" button explicitly for search bar.
    // Usually Date/Status should also wait for Apply if we want a fully manual filter bar.
    // However, sticking to User request: "je veux aussi dans la barre de recheche que tu m'ajoute un boutton s'applee appliquer"
    // To be safe and consistent, let's make ALL filters manual OR trigger on change.
    // User said "quand je lie clicke il doit efffectuer le filtrage".
    // I I will make Status and Date still trigger auto, but Search is manual.
    // Actually, "Apply" button usually applies *all* pending filters.
    // Let's modify useEffect to NOT trigger on `searchQuery` change.

    useEffect(() => {
        // Trigger on pagination, role tab switch (from props), or immediate filter changes (optional)
        // If we want FULL manual apply, we remove all filters from dependency.
        // User specifically complained about search. I will keep date/status auto for now unless requested otherwise, 
        // BUT to avoid confusion, if there is an "Apply" button next to search, it implies search is manual.

        const timer = setTimeout(() => {
            // Only auto-fetch if NO search query is pending? Or just remove searchQuery from dependency?
            if (!searchQuery) fetchUsers();
        }, 300);
        return () => clearTimeout(timer);
    }, [currentPage, refreshUsers, roleFilter, statusFilter, dateFilter]);

    const handleDelete = async (id) => {
        if (window.confirm(t('admin.users.actions.delete_confirm'))) {
            try {
                await api.delete(`/users/${id}`);
                fetchUsers();
            } catch (error) {
                console.error("Delete failed", error);
                alert(t('admin.users.actions.delete_error') + " : " + (error.response?.data?.msg || error.message));
            }
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const handleApprove = (user) => {
        setEditingUser(user);
        setModalMode('approve');
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingUser(null);
        setModalMode('create');
        setIsModalOpen(true);
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setEditingUser(null);
        fetchUsers();
    };

    const clearFilters = () => {
        setSearchQuery('');
        setStatusFilter('');
        setDateFilter('');
        if (!hideFilter) setRoleFilter('');
        setCurrentPage(1);
    };

    return (
        <div>
            {/* Header + Filters */}
            <div className="flex flex-col gap-6 mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">{t('admin.users.title')}</h2>
                        <p className="text-sm text-slate-500 mt-1">{t('admin.users.total_count', { count: totalUsers })}</p>
                    </div>
                    <button
                        onClick={handleCreate}
                        className="flex items-center gap-2 bg-[#00A3FF] text-white px-4 py-2 rounded-xl hover:bg-blue-600 transition shadow-sm font-medium text-sm"
                    >
                        <Plus size={18} /> {t('admin.users.new_user')}
                    </button>
                </div>

                {/* Filter Bar */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-wrap items-center gap-3">

                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('admin.users.search_placeholder')}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                        />
                    </div>

                    {/* Date Filter */}
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="date"
                            className="pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">{t('admin.users.filters.all_statuses')}</option>
                            <option value="active">{t('admin.users.filters.active')}</option>
                            <option value="inactive">{t('admin.users.filters.inactive')}</option>
                        </select>
                    </div>

                    {/* Role Filter (Conditional) */}
                    {!hideFilter && (
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <select
                                className="pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-600 appearance-none cursor-pointer"
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">{t('admin.users.filters.all_roles')}</option>
                                <option value="orthophoniste">{t('admin.users.modal.roles.orthophoniste')}</option>
                                <option value="encadrant">{t('admin.users.modal.roles.supervisor')}</option>
                                <option value="doctorante">{t('admin.users.modal.roles.researcher')}</option>
                                <option value="admin">{t('admin.users.modal.roles.admin')}</option>
                            </select>
                        </div>
                    )}

                    {/* Apply Button */}
                    <button
                        onClick={fetchUsers}
                        className="bg-[#00A3FF] hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('common.apply')}
                    </button>

                    {/* Clear Button */}
                    {(searchQuery || statusFilter || dateFilter || (!hideFilter && roleFilter !== initialRole)) && (
                        <button
                            onClick={clearFilters}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('admin.users.actions.reset_filters')}
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto rounded-xl">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-xs font-bold tracking-wider">
                        <tr>
                            <th className="p-5 border-b border-slate-200">{t('admin.users.table.user')}</th>
                            <th className="p-5 border-b border-slate-200">{t('admin.users.table.email')}</th>
                            <th className="p-5 border-b border-slate-200">{t('admin.users.table.role')}</th>
                            <th className="p-5 border-b border-slate-200">{t('admin.users.table.created_at')}</th>
                            <th className="p-5 border-b border-slate-200 text-center">{t('admin.users.table.status')}</th>
                            <th className="p-5 border-b border-slate-200 text-center">{t('admin.users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="6" className="p-8 text-center">{t('common.loading')}</td></tr>
                        ) : users.length === 0 ? (
                            <tr><td colSpan="6" className="p-8 text-center text-slate-500">{t('admin.users.message.no_users')}</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-semibold text-slate-700">
                                    {user.first_name && user.last_name
                                        ? `${user.first_name} ${user.last_name}`.toUpperCase()
                                        : user.username}
                                </td>
                                <td className="p-4 text-slate-500">{user.email}</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold 
                    ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                                            user.role === 'orthophoniste' ? 'bg-blue-100 text-blue-700' :
                                                user.role === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'}`}>
                                        {user.role === 'pending' ? t('admin.users.status.pending') :
                                            user.role === 'doctorante' ? t('admin.users.modal.roles.researcher') :
                                                t(`admin.users.modal.roles.${user.role}`) || user.role}
                                    </span>
                                </td>
                                <td className="p-4 text-slate-500 text-sm">
                                    {user.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '-'}
                                </td>
                                <td className="p-4 text-center">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.is_active ? 'text-green-600 bg-green-50' : 'text-amber-600 bg-amber-50'}`}>
                                        {user.is_active ? t('admin.users.status.active') : t('admin.users.status.pending_activation')}
                                    </span>
                                </td>
                                <td className="p-4 flex justify-center gap-2">
                                    {(!user.is_active || user.role === 'pending') && (
                                        <button onClick={() => handleApprove(user)} className="p-2 text-green-500 hover:text-green-700 transition bg-green-50 hover:bg-green-100 rounded-lg" title={t('admin.users.actions.approve')}>
                                            <Check size={16} />
                                        </button>
                                    )}
                                    {user.role === 'tutor' && (
                                        <button
                                            onClick={() => setSelectedTutor(user)}
                                            className="p-2 text-blue-500 hover:text-blue-700 transition bg-blue-50 hover:bg-blue-100 rounded-lg"
                                            title={t('admin.tutor.view_children')}
                                        >
                                            <Baby size={16} />
                                        </button>
                                    )}
                                    <button onClick={() => handleEdit(user)} className="p-2 text-slate-400 hover:text-[#00A3FF] transition bg-slate-100 hover:bg-blue-50 rounded-lg">
                                        <Edit size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(user.id)} className="p-2 text-slate-400 hover:text-red-500 transition bg-slate-100 hover:bg-red-50 rounded-lg">
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-6">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium"
                    >
                        {t('common.prev')}
                    </button>
                    <span className="text-slate-600 text-sm">{t('common.page_info', { current: currentPage, total: totalPages })}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium"
                    >
                        {t('common.next')}
                    </button>
                </div>
            )}

            {isModalOpen && (
                <UserModal user={editingUser} mode={modalMode} onClose={handleModalClose} />
            )}

            {/* Tutor Children Modal */}
            {selectedTutor && (
                <TutorChildrenModal
                    tutor={selectedTutor}
                    onClose={() => setSelectedTutor(null)}
                />
            )}
        </div>
    );
};

export default UsersList;
