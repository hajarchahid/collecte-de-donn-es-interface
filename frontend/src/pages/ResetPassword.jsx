import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, ShieldCheck, Check, X } from 'lucide-react';


const ResetPassword = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validatePassword = (pwd) => {
        return {
            length: pwd.length >= 8,
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /\d/.test(pwd),
            special: /[\W_]/.test(pwd)
        };
    };

    const passwordCriteria = validatePassword(password);
    const isPasswordValid = Object.values(passwordCriteria).every(Boolean);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (password !== confirmPassword) {
            return setError(t('auth.validation.password_mismatch'));
        }

        if (!isPasswordValid) {
            return setError(t('auth.validation.weak_password'));
        }

        if (!token) {
            return setError(t('auth.validation.token_missing'));
        }

        setLoading(true);
        try {
            await api.post('/auth/reset-password', { token, password });
            setMessage(t('auth.success.password_reset'));
            setTimeout(() => navigate('/login'), 2000);
        } catch (err) {
            setError(err.response?.data?.msg || t('auth.validation.token_invalid'));
        } finally {
            setLoading(false);
        }
    };

    if (!token) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-600">
            <div className="bg-white p-8 rounded-2xl shadow text-center">
                <h2 className="text-xl font-bold text-red-500 mb-4">{t('auth.validation.link_missing')}</h2>
                <Link to="/login" className="text-[#00A3FF] hover:underline">{t('auth.forgot_password_page.back_to_login')}</Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-600">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="mb-6 text-center">
                    <h2 className="text-2xl font-extrabold text-slate-800">{t('auth.reset_password_page.title')}</h2>
                    <p className="text-sm text-slate-400 mt-2">{t('auth.reset_password_page.subtitle')}</p>
                </div>

                {message && <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4 text-sm font-medium">{message}</div>}
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm font-medium">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2 ms-1 text-slate-700">{t('auth.reset_password_page.new_password')}</label>
                        <div className="relative">
                            <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder={t('auth.placeholders.password')}
                                required
                            />
                        </div>
                        {/* Password Strength Meter */}
                        <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                            <div className={`flex items-center gap-1 ${passwordCriteria.length ? 'text-green-600' : ''}`}>
                                {passwordCriteria.length ? <Check size={12} /> : <X size={12} />} {t('auth.password_strength.chars')}
                            </div>
                            <div className={`flex items-center gap-1 ${passwordCriteria.upper ? 'text-green-600' : ''}`}>
                                {passwordCriteria.upper ? <Check size={12} /> : <X size={12} />} {t('auth.password_strength.upper')}
                            </div>
                            <div className={`flex items-center gap-1 ${passwordCriteria.lower ? 'text-green-600' : ''}`}>
                                {passwordCriteria.lower ? <Check size={12} /> : <X size={12} />} {t('auth.password_strength.lower')}
                            </div>
                            <div className={`flex items-center gap-1 ${passwordCriteria.number ? 'text-green-600' : ''}`}>
                                {passwordCriteria.number ? <Check size={12} /> : <X size={12} />} {t('auth.password_strength.number')}
                            </div>
                            <div className={`flex items-center gap-1 ${passwordCriteria.special ? 'text-green-600' : ''}`}>
                                {passwordCriteria.special ? <Check size={12} /> : <X size={12} />} {t('auth.password_strength.special')}
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold mb-2 ms-1 text-slate-700">{t('auth.reset_password_page.confirm_password')}</label>
                        <div className="relative">
                            <ShieldCheck className="absolute start-3 top-3 text-slate-400" size={18} />
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder={t('auth.placeholders.password')}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('auth.reset_password_page.loading') : t('auth.reset_password_page.submit')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
