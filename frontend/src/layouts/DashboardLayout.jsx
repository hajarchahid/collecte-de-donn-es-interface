import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Outlet, Link, useNavigate, NavLink, useLocation, matchPath } from 'react-router-dom';
import { API_URL } from '../services/api';
import { LayoutDashboard, Users, Folder, Activity, ArrowLeft } from 'lucide-react';

const DashboardLayout = () => {
    const { t } = useTranslation();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Extract childId from URL for Tutor navigation
    const match = matchPath("/dashboard/tutor/:section/:childId", location.pathname);
    const urlChildId = match?.params?.childId;

    // Persist childId
    const storedChildId = localStorage.getItem('tutor_last_child_id');
    const childId = urlChildId || storedChildId;

    if (urlChildId) {
        localStorage.setItem('tutor_last_child_id', urlChildId);
    }

    const handleLogout = () => {
        localStorage.removeItem('tutor_last_child_id');
        logout();
        navigate('/login');
    }

    return (
        <div className="flex min-h-screen bg-slate-50 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-2xl z-10 transition-all duration-300">
                <div className="p-6 border-b border-slate-800">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                        {user?.role === 'orthophoniste' && t('sidebar.titles.ortho')}
                        {user?.role === 'encadrant' && t('sidebar.titles.supervision')}
                        {user?.role === 'doctorante' && t('sidebar.titles.researcher')}
                        {user?.role === 'admin' && t('sidebar.titles.admin')}
                        {user?.role === 'tutor' && t('sidebar.titles.tutor')}
                        {/* Fallback title if role is missing or generic */}
                        {!['orthophoniste', 'encadrant', 'doctorante', 'admin', 'tutor'].includes(user?.role) && "SpeechAI"}
                    </h1>
                </div>

                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                    <div className="flex items-center gap-3 px-2 py-2">
                        <Link to="/dashboard/profile" className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-lg hover:bg-blue-500/30 transition overflow-hidden">
                            {user?.profile_photo ? (
                                <img src={`${API_URL}${user.profile_photo}`} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                (user?.first_name ? user.first_name[0] : user?.username?.[0]?.toUpperCase())
                            )}
                        </Link>
                        <div className="flex-1 overflow-hidden">
                            <Link to="/dashboard/profile" className="text-sm font-semibold text-white truncate hover:underline">
                                {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.username}
                            </Link>
                            <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] uppercase text-slate-400">
                                    {user?.role === 'doctorante' ? t('admin.users.modal.roles.researcher') :
                                        user?.role === 'encadrant' ? t('admin.users.modal.roles.supervisor') :
                                            t(`admin.users.modal.roles.${user?.role}`) || user?.role}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="text-xs text-red-400 hover:text-red-300 transition-colors ms-auto"
                                >
                                    {t('sidebar.logout')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 p-4 py-6">
                    {/* Orthophoniste Menu */}
                    {user?.role === 'orthophoniste' && (
                        <div className="space-y-2">
                            <NavLink to="/dashboard" end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                <LayoutDashboard size={20} />
                                <span>{t('sidebar.menu.dashboard')}</span>
                            </NavLink>
                            <NavLink to="/dashboard/children" className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                <Users size={20} />
                                <span>{t('sidebar.menu.patients_list')}</span>
                            </NavLink>
                        </div>
                    )}

                    {/* Encadrant / Superviseur Menu */}
                    {user?.role === 'encadrant' && (
                        <ul className="space-y-2">
                            <li>
                                <Link to="/dashboard/supervision" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium bg-slate-800/50 text-blue-400">
                                    <Activity size={20} /> {t('sidebar.menu.dashboard')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <Users size={20} /> {t('sidebar.menu.users')}
                                </Link>
                            </li>
                        </ul>
                    )}

                    {/* Researcher Menu */}
                    {user?.role === 'doctorante' && (
                        <ul className="space-y-2">
                            <li>
                                <Link to="/dashboard/researcher" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <ArrowLeft size={20} /> {t('sidebar.menu.back_research')}
                                </Link>
                            </li>
                        </ul>
                    )}

                    {/* Admin Menu */}
                    {user?.role === 'admin' && (
                        <ul className="space-y-2">
                            <li>
                                <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <LayoutDashboard size={20} /> {t('sidebar.menu.dashboard')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <Users size={20} /> {t('sidebar.menu.users')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/admin/tutors" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <Users size={20} /> {t('sidebar.menu.tutors')}
                                </Link>
                            </li>
                            <li>
                                <Link to="/dashboard/admin/children" className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-300 hover:bg-slate-800 hover:text-blue-400 transition-all font-medium">
                                    <Folder size={20} /> {t('sidebar.menu.children_files') || "Dossiers Enfants"}
                                </Link>
                            </li>
                        </ul>
                    )}

                    {/* Tutor Menu - Contextual to Selected Child */}
                    {user?.role === 'tutor' && childId && (
                        <div className="space-y-2">
                            <NavLink to={`/dashboard/tutor/child/${childId}`} end className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                <LayoutDashboard size={20} />
                                <span>{t('sidebar.menu.dashboard')}</span>
                            </NavLink>
                            <NavLink to={`/dashboard/tutor/test/${childId}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                <Activity size={20} />
                                <span>{t('sidebar.menu.test_space')}</span>
                            </NavLink>
                            <NavLink to={`/dashboard/tutor/training/${childId}`} className={({ isActive }) => `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-50 text-blue-600 font-bold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                                <Folder size={20} />
                                <span>{t('sidebar.menu.training_space')}</span>
                            </NavLink>
                        </div>
                    )}
                </nav>

            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto w-full">
                <Outlet />
            </main>
        </div>
    );
};

export default DashboardLayout;
