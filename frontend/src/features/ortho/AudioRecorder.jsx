import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic, Square, Save, RotateCcw } from 'lucide-react';
import api from '../../services/api';

const AudioRecorder = ({
    childId,
    sessionId,
    onUploadSuccess,
    uploadEndpoint = '/recordings/upload',
    showClassification = true,
    defaultClassification = '1'
}) => {
    const { t } = useTranslation();
    const [isRecording, setIsRecording] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [audioUrl, setAudioUrl] = useState(null);
    const [duration, setDuration] = useState(0);
    const [classification, setClassification] = useState(defaultClassification);

    const mediaRecorderRef = useRef(null);
    const timerRef = useRef(null);
    const chunksRef = useRef([]);
    const canvasRef = useRef(null);
    const audioContextRef = useRef(null);
    const analyserRef = useRef(null);
    const sourceRef = useRef(null);
    const animationRef = useRef(null);

    useEffect(() => {
        return () => {
            clearInterval(timerRef.current);
            cancelAnimationFrame(animationRef.current);
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            // Audio Context for Visualizer
            audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            analyserRef.current = audioContextRef.current.createAnalyser();
            sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
            sourceRef.current.connect(analyserRef.current);
            analyserRef.current.fftSize = 256;

            visualize();

            mediaRecorderRef.current = new MediaRecorder(stream);
            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/wav' });
                setAudioBlob(blob);
                setAudioUrl(URL.createObjectURL(blob));
                stream.getTracks().forEach(track => track.stop());
                cancelAnimationFrame(animationRef.current);
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            setDuration(0);
            timerRef.current = setInterval(() => setDuration(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Microphone access denied", err);
            alert(t('sessions.recorder.error_mic'));
        }
    };

    const visualize = () => {
        if (!canvasRef.current || !analyserRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const bufferLength = analyserRef.current.fftSize;
        const dataArray = new Uint8Array(bufferLength);

        // Use Frequency Data for "Bar" look
        analyserRef.current.fftSize = 64; // Smaller FFT size for fewer, wider bars (like the image)

        const draw = () => {
            animationRef.current = requestAnimationFrame(draw);
            analyserRef.current.getByteFrequencyData(dataArray);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const barWidth = (canvas.width / bufferLength) * 0.8; // Spacing
            let x = 0;
            const centerY = canvas.height / 2;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i]; // 0..255
                // Scale height. Max height should be canvas.height (split top/bottom)
                // Normalize 255 -> canvas.height/2 roughly
                const barHeight = (v / 255) * canvas.height;

                // Draw mirrored bar
                ctx.fillStyle = '#1e293b'; // Slate-800 for high contrast

                // Draw from center extending up and down
                // Top half
                ctx.fillRect(x, centerY - (barHeight / 2), barWidth, barHeight);

                x += (canvas.width / bufferLength);
            }
        };

        draw();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            clearInterval(timerRef.current);
        }
    };

    const resetRecording = () => {
        setAudioBlob(null);
        setAudioUrl(null);
        setDuration(0);
    };

    const uploadRecording = async () => {
        if (!audioBlob) return;

        const formData = new FormData();
        const file = new File([audioBlob], `recording-${Date.now()}.wav`, { type: 'audio/wav' });
        formData.append('file', file);
        formData.append('child_id', childId);
        if (sessionId) formData.append('session_id', sessionId);
        formData.append('classification', classification);

        try {
            const response = await api.post(uploadEndpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            alert(t('sessions.recorder.save_success'));
            if (onUploadSuccess) onUploadSuccess(response.data);
            resetRecording();
        } catch (error) {
            console.error("Upload failed", error);
            alert(t('sessions.recorder.save_error'));
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md max-w-lg mx-auto text-center border border-slate-200">
            <div className="mb-6">
                {isRecording ? (
                    <canvas ref={canvasRef} width="300" height="100" className="w-full h-24 bg-slate-50 rounded-lg mb-2" />
                ) : (
                    <div className="w-full h-24 bg-slate-50 rounded-lg mb-2 flex items-center justify-center text-slate-300">
                        Waveform
                    </div>
                )}
                <div className="font-mono text-4xl font-bold text-slate-700">
                    {formatTime(duration)}
                </div>
            </div>

            {!audioBlob ? (
                <button
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-[#00A3FF] hover:bg-blue-600'
                        } text-white mx-auto shadow-lg shadow-blue-500/30`}
                >
                    {isRecording ? <Square size={32} fill="currentColor" /> : <Mic size={32} />}
                </button>
            ) : (
                <div className="space-y-6">
                    <audio src={audioUrl} controls className="w-full bg-slate-50 rounded-lg" />

                    {showClassification && (
                        <div className="text-left bg-slate-50 p-4 rounded border border-slate-100">
                            <label className="block text-sm font-semibold mb-2">{t('sessions.recorder.classification_label')}</label>
                            <div className="flex gap-4">
                                {['1', '2', '3'].map((cls) => (
                                    <label key={cls} className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            name="classification"
                                            value={cls}
                                            checked={classification === cls}
                                            onChange={(e) => setClassification(e.target.value)}
                                            className="accent-blue-500"
                                        />
                                        {t('sessions.details.class_label', { class: cls })}
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-4 justify-center">
                        <button
                            onClick={resetRecording}
                            className="px-4 py-2 text-slate-500 hover:text-slate-700 flex items-center gap-2"
                        >
                            <RotateCcw size={18} /> {t('common.retry')}
                        </button>
                        <button
                            onClick={uploadRecording}
                            className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2 font-bold shadow-lg shadow-green-500/20"
                        >
                            <Save size={18} /> {t('common.save')}
                        </button>
                    </div>
                </div>
            )}

            <p className="mt-4 text-sm text-slate-400">
                {isRecording ? t('sessions.recorder.status.recording') : audioBlob ? t('sessions.recorder.status.ready') : t('sessions.recorder.status.start')}
            </p>
        </div>
    );
};

export default AudioRecorder;
