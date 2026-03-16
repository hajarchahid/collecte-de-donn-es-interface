import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

const Login = () => {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            // Redirect based on role
            switch (user.role) {
                case 'admin': navigate('/dashboard'); break;
                case 'orthophoniste': navigate('/dashboard'); break;
                case 'doctorante': navigate('/dashboard/researcher'); break;
                case 'encadrant': navigate('/dashboard/supervision'); break;
                default: navigate('/dashboard');
            }
        } catch (err) {
            console.error("Login Error Details:", err);
            if (err.response) {
                if (err.response.status === 500) {
                    setError(t('auth.errors.server'));
                } else if (err.response.data && err.response.data.msg) {
                    setError(err.response.data.msg);
                } else {
                    setError(`${t('auth.errors.default')} (${err.response.status})`);
                }
            } else if (err.request) {
                setError(t('auth.errors.network'));
            } else {
                setError(`${t('auth.errors.default')}: ${err.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-600">
            <div className="bg-white max-w-md w-full rounded-2xl shadow-xl p-8 border border-slate-100">
                <div className="mb-8 text-center">
                    <h2 className="text-3xl font-extrabold text-[#00A3FF] mb-1">{t('auth.login.title')}</h2>
                    <p className="text-sm text-slate-400">{t('auth.login.subtitle')}</p>
                </div>

                {error && (
                    <div className="bg-red-50 flex items-center gap-2 text-red-600 p-3 rounded-lg mb-6 text-sm font-medium">
                        <AlertCircle size={18} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-bold mb-2 ms-1 text-slate-700">{t('auth.login.identifier_label') || "Email, Téléphone ou Nom d'utilisateur"}</label>
                        <div className="relative">
                            <Mail className="absolute start-3 top-3 text-slate-400" size={18} />
                            <input
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full ps-10 pe-4 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder={t('auth.login.identifier_placeholder') || "Entrez votre email, téléphone ou nom d'utilisateur"}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2 ms-1">
                            <label className="block text-sm font-bold text-slate-700">{t('auth.password')}</label>
                            <Link to="/forgot-password" className="text-xs text-[#00A3FF] hover:underline font-medium">{t('auth.forgot_password')}</Link>
                        </div>
                        <div className="relative">
                            <Lock className="absolute start-3 top-3 text-slate-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full ps-10 pe-10 py-2 rounded-xl border border-slate-200 focus:border-[#00A3FF] focus:ring-2 focus:ring-blue-100 outline-none transition"
                                placeholder={t('auth.placeholders.password')}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute end-3 top-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 rounded-xl bg-[#00A3FF] text-white font-bold text-sm hover:bg-blue-600 transition shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {loading ? t('auth.login.loading') : <><LogIn size={18} /> {t('auth.login.submit')}</>}
                    </button>
                </form>


            </div>
        </div>
    );
};

export default Login;
