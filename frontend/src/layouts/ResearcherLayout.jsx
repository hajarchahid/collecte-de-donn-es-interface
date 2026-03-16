import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { BarChart2, Database, LogOut, Info } from 'lucide-react';
import { API_URL } from '../services/api';
import clsx from 'clsx';

import LanguageSwitcher from '../components/LanguageSwitcher';

const ResearcherLayout = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogout = () => {
        logout();
        navigate('/login');
    }

    const isActive = (path) => location.pathname === path;

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar - Dark Theme matching DashboardLayout */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 transition-all duration-300">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent flex items-center gap-2">
                        {t('sidebar.titles.recherche')}
                    </h1>
                </div>

                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex flex-col gap-2">
                        <Link
                            to="/dashboard/researcher/profile"
                            className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-800 transition-colors group"
                            title="Accéder au profil"
                        >
                            <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg border border-blue-500/30 group-hover:border-blue-400 transition-colors overflow-hidden">
                                {user?.profile_photo ? (
                                    <img
                                        src={`${API_URL}${user.profile_photo}`}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    user?.username?.[0]?.toUpperCase() || 'R'
                                )}
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">
                                    {user?.username || t('sidebar.role_label')}
                                </p>
                                <span className="text-[10px] uppercase text-slate-400 tracking-wider">{t('sidebar.role_label')}</span>
                            </div>
                        </Link>

                        <button
                            onClick={handleLogout}
                            className="flex items-center justify-center gap-2 w-full py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                        >
                            <LogOut size={14} /> {t('sidebar.logout')}
                        </button>
                    </div>
                </div >

                {/* Language Switcher Removed as per user request (handled in profile) */}

                <nav className="flex-1 p-4 py-6">
                    <ul className="space-y-2">
                        <li>
                            <Link
                                to="/dashboard/researcher"
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                    isActive('/dashboard/researcher')
                                        ? "bg-slate-800 text-blue-400"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                                )}
                            >
                                <BarChart2 size={20} className={isActive('/dashboard/researcher') ? "text-blue-400" : "text-slate-400"} />
                                {t('sidebar.menu.home')}
                            </Link>
                        </li>
                        <li>
                            <Link
                                to="/dashboard/researcher/explore"
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                                    isActive('/dashboard/researcher/explore')
                                        ? "bg-slate-800 text-blue-400"
                                        : "text-slate-300 hover:bg-slate-800 hover:text-blue-400"
                                )}
                            >
                                <Database size={20} className={isActive('/dashboard/researcher/explore') ? "text-blue-400" : "text-slate-400"} />
                                {t('sidebar.menu.exploration')}
                            </Link>
                        </li>
                    </ul>
                </nav>



            </aside >

            {/* Main Content */}
            < main className="flex-1 flex flex-col min-h-0 overflow-hidden w-full" >
                {/* Ethical Banner */}
                < div className="bg-sky-50 border-b border-sky-100 px-6 py-3 flex items-center gap-3 text-sky-800 text-sm font-medium" >
                    <Info size={18} className="text-sky-600" />
                    <span>{t('researcher.banner')}</span>
                </div >

                <div className="flex-1 overflow-y-auto p-8">
                    <Outlet />
                </div>

                {/* Footer Disclaimer */}
                <footer className="bg-white border-t border-slate-100 py-3 px-8 text-center">
                    <p className="text-xs text-slate-400">
                        {t('researcher.footer')} • {new Date().getFullYear()}
                    </p>
                </footer>
            </main >
        </div >
    );
};

export default ResearcherLayout;
