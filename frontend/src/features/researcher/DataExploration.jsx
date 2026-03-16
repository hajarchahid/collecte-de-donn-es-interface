import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { Play, Download, Filter, CheckCircle } from 'lucide-react';

import { useTranslation } from 'react-i18next';

const DataExploration = () => {
    const { t } = useTranslation();
    const [recordings, setRecordings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const location = useLocation();

    // Filters
    const [filters, setFilters] = useState({
        search: '',
        sex: '',
        classification: '',
        date: '',
        status: '',
        source: '' // New Source Filter
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const statusParam = params.get('status');
        if (statusParam) {
            setFilters(prev => ({ ...prev, status: statusParam }));
        }
    }, [location.search]);

    // Player State
    const [playingId, setPlayingId] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    const fetchRecordings = async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 20, ...filters };
            // Remove empty filters
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await api.get('/researcher/recordings', { params });
            setRecordings(response.data.recordings);
            setPagination({
                page: response.data.current_page,
                pages: response.data.pages,
                total: response.data.total
            });
        } catch (error) {
            console.error("Fetch failed", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchRecordings(1);
        }, 500); // Debounce search
        return () => clearTimeout(timer);
    }, [filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.pages) {
            fetchRecordings(newPage);
        }
    };

    const handlePlay = async (id) => {
        if (playingId === id) return;

        try {
            // Fetch secure stream URL (or Blob)
            const response = await api.get(`/researcher/recordings/${id}/listen`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            setAudioUrl(url);
            setPlayingId(id);

            // Mark as viewed locally
            setRecordings(prev => prev.map(r => r.id === id ? { ...r, status: 'viewed' } : r));
        } catch (error) {
            alert(t('researcher.exploration.error_audio'));
        }
    };

    const handleExport = async () => {
        if (!window.confirm(t('researcher.exploration.confirm_export'))) return;

        try {
            const params = { ...filters };
            Object.keys(params).forEach(key => params[key] === '' && delete params[key]);

            const response = await api.get('/researcher/export', {
                params,
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            let filename = `dataset_anonymized_${new Date().toISOString().slice(0, 10)}`;
            if (filters.source) {
                filename += `_${filters.source}`;
            }
            link.setAttribute('download', `${filename}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Refresh to update statuses
            fetchRecordings(pagination.page);

        } catch (error) {
            alert(t('researcher.exploration.error_export'));
        }
    };

    return (
        <div className="w-full space-y-6">
            {/* ... Header ... */}

            {/* Filters Bar */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-sm">

                {/* Search Bar */}
                <div className="flex gap-4">
                    <div className="flex-1">
                        <input
                            type="text"
                            placeholder={t('researcher.exploration.search_placeholder')}
                            className="w-full border border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-sky-500 outline-none text-slate-700 placeholder:text-slate-400"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-bold transition shadow-sm hover:shadow-md"
                    >
                        <Download size={20} />
                        {t('researcher.exploration.export')}
                    </button>
                </div>



                <div className="flex flex-wrap gap-4 items-center">
                    <div className="flex items-center gap-2 text-slate-500 font-medium me-2">
                        <Filter size={18} /> {t('common.filters')}:
                    </div>

                    <select
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-medium bg-slate-50"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="">{t('researcher.exploration.status.all')}</option>
                        <option value="new">🟢 {t('researcher.exploration.status.new')}</option>
                        <option value="viewed">✓ {t('researcher.exploration.status.viewed')}</option>
                    </select>

                    {/* Source Filter */}
                    <select
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none font-medium"
                        value={filters.source}
                        onChange={e => setFilters({ ...filters, source: e.target.value })}
                    >
                        <option value="">{t('researcher.exploration.source.all')}</option>
                        <option value="orthophoniste">{t('researcher.exploration.source.ortho')}</option>
                        <option value="tutor">{t('researcher.exploration.source.tutor')}</option>
                    </select>

                    <select
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        value={filters.sex}
                        onChange={e => setFilters({ ...filters, sex: e.target.value })}
                    >
                        <option value="">{t('researcher.exploration.sex.all')}</option>
                        <option value="F">{t('researcher.exploration.sex.female')}</option>
                        <option value="M">{t('researcher.exploration.sex.male')}</option>
                    </select>

                    {/* ... Rest of filters ... */}


                    <select
                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-500 outline-none"
                        value={filters.classification}
                        onChange={e => setFilters({ ...filters, classification: e.target.value })}
                    >
                        <option value="">{t('researcher.exploration.class.all')}</option>
                        <option value="1">{t('sessions.details.class_label', { class: '1' })}</option>
                        <option value="2">{t('sessions.details.class_label', { class: '2' })}</option>
                        <option value="3">{t('sessions.details.class_label', { class: '3' })}</option>
                    </select>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">{t('common.date_label')}:</span>
                        <input
                            type="date"
                            className="border border-slate-300 rounded-lg px-2 py-2 text-sm outline-none focus:border-sky-500"
                            value={filters.date}
                            onChange={e => setFilters({ ...filters, date: e.target.value })}
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                <table className="w-full text-center border-collapse">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-xs font-bold">
                        <tr>
                            <th className="p-4 border-b">{t('researcher.exploration.table.id')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.status')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.child_code')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.sex_age')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.source')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.ortho')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.class')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.date')}</th>
                            <th className="p-4 border-b">{t('researcher.exploration.table.audio')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            <tr><td colSpan="9" className="p-8 text-center text-slate-500">{t('common.loading')}</td></tr>
                        ) : recordings.length === 0 ? (
                            <tr><td colSpan="9" className="p-8 text-center text-slate-500">{t('researcher.exploration.no_results')}</td></tr>
                        ) : (
                            recordings.map(rec => (
                                <tr key={rec.id} className={`transition-colors ${rec.status === 'viewed' ? 'bg-slate-50/50' : 'hover:bg-slate-50'}`}>
                                    <td className="p-4 font-mono text-slate-400 text-xs">#{rec.id}</td>
                                    <td className="p-4">
                                        {rec.status === 'new' ? (
                                            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border border-emerald-200 shadow-sm">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                                {t('researcher.exploration.status_badge.new')}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 text-slate-400 px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-200 bg-slate-100">
                                                <CheckCircle size={12} /> {t('researcher.exploration.status_badge.viewed')}
                                            </span>
                                        )}
                                    </td>
                                    <td className="p-4 font-mono text-slate-600 font-medium text-sm">{rec.child_code}</td>
                                    <td className="p-4 text-slate-700">
                                        <div className="flex items-center justify-center gap-2">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${rec.sex === 'F' ? 'bg-pink-100 text-pink-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {rec.sex || '?'}
                                            </span>
                                            <span className="text-sm text-slate-500">{rec.age ? `${rec.age} ${t('common.years')}` : '-'}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${rec.source_type === 'orthophoniste'
                                            ? 'bg-blue-100 text-blue-800'
                                            : 'bg-amber-100 text-amber-800'
                                            }`}>
                                            {rec.source_type === 'orthophoniste' ? 'ORTHO' : 'TUTEUR'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-600 text-sm font-medium">
                                        {rec.orthophonist || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-xs font-bold">
                                            {t('sessions.details.class_label', { class: rec.classification })}
                                        </span>
                                    </td>
                                    <td className="p-4 text-slate-500 text-xs">
                                        {new Date(rec.date).toLocaleString('fr-FR', {
                                            day: '2-digit',
                                            month: '2-digit',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </td>
                                    <td className="p-4">
                                        {playingId === rec.id ? (
                                            <div className="w-48 mx-auto">
                                                <audio controls autoPlay src={audioUrl} className="w-full h-8" />
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => handlePlay(rec.id)}
                                                className={`p-2 rounded-full transition shadow-sm ${rec.status === 'new'
                                                    ? 'bg-sky-50 text-sky-600 hover:bg-sky-100 ring-2 ring-sky-100'
                                                    : 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600'
                                                    }`}
                                                title="Écouter l'enregistrement"
                                            >
                                                <Play size={18} fill="currentColor" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {pagination.pages > 1 && (
                    <div className="flex justify-center items-center gap-4 p-6 border-t border-slate-100">
                        <button
                            disabled={pagination.page === 1}
                            onClick={() => handlePageChange(pagination.page - 1)}
                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                        >
                            {t('common.prev')}
                        </button>
                        <span className="text-slate-600 text-sm">{t('common.page_info', { current: pagination.page, total: pagination.pages })}</span>
                        <button
                            disabled={pagination.page === pagination.pages}
                            onClick={() => handlePageChange(pagination.page + 1)}
                            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                        >
                            {t('common.next')}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataExploration;
