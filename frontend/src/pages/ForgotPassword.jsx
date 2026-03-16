import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Mail, ArrowLeft, Send } from 'lucide-react';

const ForgotPassword = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        try {
            await api.post('/auth/forgot-password', { email });
            setMessage(t('auth.success.reset_link_sent'));
        } catch (err) {
            setError(t('auth.errors.send_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-600">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-slate-100">
                <Link to="/login" className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-600 mb-6 transition">
                    <ArrowLeft size={16} /> {t('auth.forgot_password_page.back_to_login')}
                </Link>

                <div className="mb-6 text-center">
                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-[#00A3FF]">
                        <Mail size={24} />
                    </div>
                    <h2 className="text-3xl font-extrabold text-[#00A3FF] mb-1">{t('auth.forgot_password_page.title')}</h2>
                    <p className="text-sm text-slate-400">{t('auth.forgot_password_page.subtitle')}</p>
                </div>

                {message && <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-4 text-sm font-medium text-center">{message}</div>}
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2 ms-1 text-slate-700">{t('auth.email')}</label>
                        <div className="relative">
                            <Mail className="absolute start-3 top-3 text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder={t('auth.placeholders.email')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('auth.forgot_password_page.loading') : <><Send size={18} /> {t('auth.forgot_password_page.submit')}</>}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
