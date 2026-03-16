import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Lock, CheckCircle, AlertCircle, Eye, EyeOff, Check } from 'lucide-react';

const ActivateAccount = () => {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [oldPassword, setOldPassword] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setMessage(t('auth.validation.password_mismatch'));
            setStatus('error');
            return;
        }

        setStatus('loading');
        try {
            await api.post('/auth/activate-account', { token, old_password: oldPassword, new_password: password });
            setStatus('success');
            setMessage(t('auth.success.account_activated_msg'));
        } catch (error) {
            setStatus('error');
            setMessage(error.response?.data?.msg || t('auth.validation.token_invalid'));
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
                <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-md">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-slate-800 mb-2">{t('auth.validation.link_missing')}</h2>
                    <p className="text-slate-600 mb-6">{t('auth.validation.link_invalid_desc')}</p>
                    <Link to="/login" className="text-blue-500 font-bold hover:underline">{t('auth.forgot_password_page.back_to_login')}</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-600">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-extrabold text-[#00A3FF] mb-1">{t('auth.activate_account_page.title')}</h2>
                    <p className="text-sm text-slate-400">{t('auth.activate_account_page.subtitle')}</p>
                </div>

                {status === 'success' ? (
                    <div className="text-center">
                        <CheckCircle className="mx-auto text-green-500 mb-4" size={56} />
                        <h3 className="text-xl font-bold text-slate-800 mb-2">{t('auth.success.account_activated')}</h3>
                        <p className="text-slate-600 mb-6">{message}</p>
                        <Link
                            to="/login"
                            className="block w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold hover:bg-blue-600 transition shadow-lg shadow-blue-500/30"
                        >
                            {t('auth.login.submit')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === 'error' && (
                            <div className="bg-red-50 flex items-center gap-2 text-red-600 p-3 rounded-lg text-sm font-medium">
                                <AlertCircle size={18} /> {message}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">{t('auth.activate_account_page.current_password')}</label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
                                <input
                                    type="password"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                    placeholder={t('auth.placeholders.password')}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">{t('auth.activate_account_page.new_password')}</label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full ps-10 pe-10 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                    placeholder={t('auth.placeholders.password')}
                                    minLength={8}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute end-3 top-3 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            <p className="text-xs text-slate-400 mt-1 ms-1">{t('auth.password_strength.hint')}</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2 ms-1">{t('auth.activate_account_page.confirm_password')}</label>
                            <div className="relative">
                                <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
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
                            disabled={status === 'loading'}
                            className={`w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 ${status === 'loading' ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {status === 'loading' ? t('auth.activate_account_page.loading') : <><Check size={18} /> {t('auth.activate_account_page.submit')}</>}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};

export default ActivateAccount;
