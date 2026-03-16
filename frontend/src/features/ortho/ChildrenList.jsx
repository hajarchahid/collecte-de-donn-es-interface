import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Search, Eye, User, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';



const ChildrenList = () => {
    const { t } = useTranslation();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalPatients, setTotalPatients] = useState(0);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const response = await api.get('/children/', {
                params: { page: currentPage, per_page: 10 }
            });
            if (response.data.children) {
                setPatients(response.data.children);
                setTotalPages(response.data.pages);
                setTotalPatients(response.data.total);
                // Also set current page from backend just in case?
            } else if (Array.isArray(response.data)) {
                // Fallback for legacy array response
                setPatients(response.data);
                setTotalPatients(response.data.length);
                setTotalPages(1);
            } else {
                setPatients([]);
            }
        } catch (error) {
            console.error("Failed to fetch patients", error);
            setPatients([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPatients();
    }, [currentPage]);



    // Note: Filtering is now Client-Side ON THE CURRENT PAGE ONLY due to Server-Side Pagination.
    // Ideally search should be server-side too.
    const filteredPatients = Array.isArray(patients) ? patients.filter(p => {
        const term = searchTerm.toLowerCase();
        return (
            (p.last_name && p.last_name.toLowerCase().startsWith(term)) ||
            (p.first_name && p.first_name.toLowerCase().startsWith(term)) ||
            (p.name && p.name.toLowerCase().startsWith(term)) ||
            (p.code && p.code.toLowerCase().startsWith(term)) ||
            (p.tutor_first_name && p.tutor_first_name.toLowerCase().includes(term)) ||
            (p.tutor_last_name && p.tutor_last_name.toLowerCase().includes(term))
        );
    }) : [];

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900">{t('patients.title')}</h1>
                    <p className="text-slate-500 mt-2">{t('patients.count', { count: totalPatients })}</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-6 flex items-center gap-3">
                <Search size={20} className="text-slate-400" />
                <input
                    type="text"
                    placeholder={t('patients.search_placeholder')}
                    className="flex-1 outline-none text-slate-700 placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-start border-collapse">
                        <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold tracking-wider">
                            <tr>
                                <th className="p-5 border-b border-slate-200 text-start">{t('patients.table.name')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('patients.table.code')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('patients.table.tutor')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('patients.table.sex_age')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('patients.table.registered_at')}</th>
                                <th className="p-5 border-b border-slate-200 text-center">{t('patients.table.actions')} / Bilan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">{t('patients.loading')}</td></tr>
                            ) : filteredPatients.map(patient => (
                                <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                {patient.last_name ? patient.last_name[0].toUpperCase() : (patient.name ? patient.name[0].toUpperCase() : <User size={20} />)}
                                            </div>
                                            <span className="font-semibold text-slate-700">
                                                {patient.last_name && patient.first_name
                                                    ? `${patient.last_name.toUpperCase()} ${patient.first_name}`
                                                    : (patient.name || 'Sans Nom')}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-5 text-slate-500 font-mono text-sm text-center">{patient.code}</td>
                                    <td className="p-5 text-slate-600 text-center text-sm">
                                        {patient.tutor_id ? (
                                            <div className="flex flex-col items-center">
                                                <span className="font-medium text-slate-700">{patient.tutor_first_name} {patient.tutor_last_name}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="p-5 text-slate-600 text-center">
                                        {patient.age} {t('common.years')} <span className="text-slate-400 mx-1">•</span> {patient.sex === 'M' ? t('common.male') : t('common.female')}
                                    </td>
                                    <td className="p-5 text-slate-500 text-sm text-center">
                                        {new Date(patient.created_at).toLocaleDateString('fr-FR')} à {new Date(patient.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="p-5 flex justify-center gap-2">
                                        <Link to={`/dashboard/children/${patient.id}/bilan`} className="p-2 text-slate-400 hover:text-green-600 transition bg-slate-50 hover:bg-green-50 rounded-lg" title="Bilan Orthophonique">
                                            <FileText size={18} />
                                        </Link>
                                        <Link to={`/dashboard/children/${patient.id}`} className="p-2 text-slate-400 hover:text-blue-500 transition bg-slate-50 hover:bg-blue-50 rounded-lg" title="Consulter">
                                            <Eye size={18} />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredPatients.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="p-8 text-center text-slate-500">
                                        {t('patients.no_patients')}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 p-6 border-t border-slate-100">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                        >
                            {t('common.prev')}
                        </button>
                        <span className="text-slate-600 text-sm">{t('common.page_info', { current: currentPage, total: totalPages })}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                )}
            </div>
        </div >
    );
};

export default ChildrenList;
