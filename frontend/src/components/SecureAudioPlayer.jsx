import { useState, useEffect } from 'react';
import api from '../services/api';
import { Play, Pause, AlertCircle, Loader2 } from 'lucide-react';

const SecureAudioPlayer = ({ filename, label }) => {
    const [audioUrl, setAudioUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch the audio blob securely when component mounts
    useEffect(() => {
        const fetchAudio = async () => {
            if (!filename) return;

            setLoading(true);
            try {
                // We use responseType: 'blob' to handle binary data
                const response = await api.get(`/recordings/stream/${filename}`, {
                    responseType: 'blob'
                });

                // Create a local URL for the blob
                const url = URL.createObjectURL(response.data);
                setAudioUrl(url);
            } catch (err) {
                console.error("Failed to load audio", err);
                setError("Impossible de charger l'audio");
            } finally {
                setLoading(false);
            }
        };

        fetchAudio();

        // Cleanup function to revoke URL and avoid memory leaks
        return () => {
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl);
            }
        };
    }, [filename]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 text-slate-400 text-sm p-2 bg-slate-50 rounded">
                <Loader2 size={16} className="animate-spin" />
                Chargement audio...
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center gap-2 text-red-500 text-sm p-2 bg-red-50 rounded">
                <AlertCircle size={16} />
                {error}
            </div>
        );
    }

    if (!audioUrl) return null;

    return (
        <audio controls className="h-10 w-full max-w-[300px]">
            <source src={audioUrl} type="audio/wav" />
            Votre navigateur ne supporte pas l'élément audio.
        </audio>
    );
};

export default SecureAudioPlayer;
