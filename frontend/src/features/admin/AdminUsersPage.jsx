import { useTranslation } from 'react-i18next';
import UsersList from './UsersList';

const AdminUsersPage = ({ defaultRole = '' }) => {
    const { t } = useTranslation();
    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold text-slate-900">
                    {defaultRole === 'tutor' ? t('admin.users_page.title_tutor') : t('admin.users_page.title_users')}
                </h1>
                <p className="text-slate-500 mt-2">{t('admin.users_page.subtitle')}</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <UsersList
                    key={defaultRole || 'users'} // Force remount when role changes
                    initialRole={defaultRole}
                    hideFilter={defaultRole === 'tutor'}
                    excludeRole={!defaultRole ? 'tutor' : ''}
                />
            </div>
        </div>
    );
};

export default AdminUsersPage;
