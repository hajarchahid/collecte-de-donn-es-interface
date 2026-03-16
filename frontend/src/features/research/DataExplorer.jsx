import { useState, useEffect } from 'react';
import api from '../../services/api';
import { Download, Filter, Play, Pause } from 'lucide-react';

const DataExplorer = () => {
    const [recordings, setRecordings] = useState([]);
    const [filters, setFilters] = useState({ sex: '', classification: '' });
    const [playingId, setPlayingId] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);

    // Pagination
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    useEffect(() => {
        fetchRecordings();
    }, [filters, page]);

    useEffect(() => {
        setPage(1);
    }, [filters]);

    const fetchRecordings = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.sex) params.append('sex', filters.sex);
            if (filters.classification) params.append('classification', filters.classification);
            if (filters.source) params.append('source', filters.source);
            params.append('page', page);
            params.append('per_page', 15);

            const response = await api.get(`/recordings/?${params.toString()}`);

            if (response.data.recordings) {
                setRecordings(response.data.recordings);
                setTotalPages(response.data.pages);
                setTotalItems(response.data.total);
            } else {
                setRecordings([]);
            }
        } catch (error) {
            console.error("Failed to fetch recordings", error);
        }
    };

    const handleExport = async () => {
        try {
            const params = new URLSearchParams();
            if (filters.sex) params.append('sex', filters.sex);
            if (filters.classification) params.append('classification', filters.classification);
            if (filters.source) params.append('source', filters.source);

            const response = await api.get(`/recordings/export?${params.toString()}`, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'dataset.zip');
            document.body.appendChild(link);
            link.click();
        } catch (error) {
            console.error("Export failed", error);
            alert("Erreur lors du téléchargement.");
        }
    };

    const handlePlay = async (filename, id) => {
        if (playingId === id) {
            // Stop
            setPlayingId(null);
            setAudioUrl(null);
        } else {
            // Play
            // For security, stream via token is needed. 
            // Typically we'd use a temporary signed URL or fetch blob.
            // Simplified: Fetch blob with auth header
            try {
                const response = await api.get(`/recordings/stream/${filename}`, { responseType: 'blob' });
                const url = URL.createObjectURL(response.data);
                setAudioUrl(url);
                setPlayingId(id);
            } catch (e) {
                console.error("Stream error", e);
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Exploration des Données</h2>
                <button
                    onClick={handleExport}
                    className="flex items-center gap-2 bg-[#00A3FF] text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                    <Download size={18} /> Exporter le Dataset
                </button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-100 mb-6 flex gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Sexe</label>
                    <select
                        className="p-2 border rounded w-32"
                        value={filters.sex}
                        onChange={e => setFilters({ ...filters, sex: e.target.value })}
                    >
                        <option value="">Tous</option>
                        <option value="M">Masculin</option>
                        <option value="F">Féminin</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Source</label>
                    <select
                        className="p-2 border rounded w-32"
                        value={filters.source || ''}
                        onChange={e => setFilters({ ...filters, source: e.target.value })}
                    >
                        <option value="">Tous</option>
                        <option value="ortho">Orthophonistes</option>
                        <option value="tutor">Parents/Tuteurs</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Classification</label>
                    <select
                        className="p-2 border rounded w-32"
                        value={filters.classification}
                        onChange={e => setFilters({ ...filters, classification: e.target.value })}
                    >
                        <option value="">Toutes</option>
                        <option value="1">Classe 1</option>
                        <option value="2">Classe 2</option>
                        <option value="3">Classe 3</option>
                    </select>
                </div>
                <div className="pb-2 text-slate-400 text-sm italic">
                    {recordings.length} enregistrements anonymisés accessibles à la recherche
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="w-full text-start border-collapse">
                    <thead className="bg-slate-50 text-slate-600 uppercase text-xs">
                        <tr>
                            <th className="p-4 border-b">ID Patient</th>
                            <th className="p-4 border-b">Age</th>
                            <th className="p-4 border-b">Sexe</th>
                            <th className="p-4 border-b">Source</th>
                            <th className="p-4 border-b">Classe</th>
                            <th className="p-4 border-b">Date</th>
                            <th className="p-4 border-b text-center">Écoute</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {recordings.map(rec => (
                            <tr key={rec.id} className="hover:bg-slate-50">
                                <td className="p-4 font-mono text-slate-600">{rec.patient_code}</td>
                                <td className="p-4">{rec.child_age}</td>
                                <td className="p-4">{rec.child_sex}</td>
                                <td className="p-4 text-xs font-semibold text-slate-500 uppercase">
                                    {rec.creator_role === 'tutor' ? 'Parent' : 'Ortho'}
                                </td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-semibold
                                ${rec.classification === '1' ? 'bg-green-100 text-green-700' :
                                            rec.classification === '2' ? 'bg-orange-100 text-orange-700' :
                                                'bg-red-100 text-red-700'}`}>
                                        Classe {rec.classification}
                                    </span>
                                </td>
                                <td className="p-4 text-xs text-slate-400">
                                    {new Date(rec.date).toLocaleString('fr-FR', {
                                        day: '2-digit',
                                        month: '2-digit',
                                        year: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        second: '2-digit'
                                    })}
                                </td>
                                <td className="p-4 flex justify-center">
                                    <button
                                        onClick={() => handlePlay(rec.filename, rec.id)}
                                        className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                                    >
                                        {playingId === rec.id ? <Pause size={14} /> : <Play size={14} />}
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
                        disabled={page === 1}
                        onClick={() => setPage(p => p - 1)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                    >
                        Précédent
                    </button>
                    <span className="text-slate-600 text-sm">Page {page} sur {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage(p => p + 1)}
                        className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-sm font-medium transition"
                    >
                        Suivant
                    </button>
                </div>
            )}

            {playingId && audioUrl && (
                <div className="fixed bottom-0 start-0 end-0 bg-white border-t border-slate-200 p-4 shadow-lg flex justify-center z-50">
                    <audio src={audioUrl} controls autoPlay className="w-full max-w-lg" />
                </div>
            )}
        </div>
    );
};

export default DataExplorer;
