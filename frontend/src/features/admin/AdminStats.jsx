import { Users, UserCheck, UserX, UserPlus, User, GraduationCap, Briefcase, School } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminStats = ({ users }) => {
    const { t } = useTranslation();
    // Force re-render for translation
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const pendingUsers = users.filter(u => u.role === 'pending' || !u.is_active).length;

    // Role distribution
    const orthoCount = users.filter(u => u.role === 'orthophoniste').length;
    const phdCount = users.filter(u => u.role === 'doctorante').length;
    const supervisorCount = users.filter(u => u.role === 'encadrant').length;
    const tutorCount = users.filter(u => u.role === 'tutor').length;

    const StatCard = ({ title, value, icon: Icon, color, subColor }) => (
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] border border-slate-100 flex items-center justify-between hover:translate-y-[-2px] transition-all duration-300">
            <div>
                <p className="text-slate-400 text-sm font-semibold uppercase tracking-wider mb-2">{title}</p>
                <h3 className="text-3xl font-extrabold text-slate-800">{value}</h3>
            </div>
            <div className={`p-4 rounded-2xl ${color} shadow-lg shadow-${subColor}/30`}>
                <Icon size={32} className="text-white" strokeWidth={2} />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            <StatCard
                title={t('admin.stats.total')}
                value={totalUsers}
                icon={Users}
                color="bg-gradient-to-br from-blue-500 to-blue-600"
                subColor="blue-500"
            />
            <StatCard
                title={t('admin.stats.active')}
                value={activeUsers}
                icon={UserCheck}
                color="bg-gradient-to-br from-green-500 to-emerald-600"
                subColor="green-500"
            />
            <StatCard
                title={t('admin.stats.pending')}
                value={pendingUsers}
                icon={UserPlus}
                color="bg-gradient-to-br from-amber-400 to-orange-500"
                subColor="amber-500"
            />
            <StatCard
                title={t('admin.stats.ortho')}
                value={orthoCount}
                icon={User}
                color="bg-gradient-to-br from-purple-500 to-indigo-600"
                subColor="purple-500"
            />
            <StatCard
                title={t('admin.stats.researcher')}
                value={phdCount}
                icon={GraduationCap}
                color="bg-gradient-to-br from-pink-500 to-rose-600"
                subColor="pink-500"
            />
            <StatCard
                title={t('admin.stats.supervisor')}
                value={supervisorCount}
                icon={Briefcase}
                color="bg-gradient-to-br from-cyan-500 to-teal-600"
                subColor="cyan-500"
            />
            <StatCard
                title={t('admin.stats.tutor')}
                value={tutorCount}
                icon={School}
                color="bg-gradient-to-br from-indigo-500 to-violet-600"
                subColor="indigo-500"
            />
        </div>
    );
};

export default AdminStats;
