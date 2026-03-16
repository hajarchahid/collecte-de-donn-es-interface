import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useTranslation } from 'react-i18next';

const ChildSelector = ({ mode }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [children, setChildren] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchChildren = async () => {
            try {
                const res = await api.get('/children/');
                let childList = res.data.children || [];

                // Filter based on mode
                if (mode === 'test') {
                    // Show only children who have NOT taken the test
                    childList = childList.filter(c => !c.has_initial_test);
                } else if (mode === 'training') {
                    // Show only children who HAVE taken the test
                    childList = childList.filter(c => c.has_initial_test);
                }

                setChildren(childList);

                if (childList.length === 1) {
                    // Auto-redirect if single child available for this mode
                    const child = childList[0];
                    navigate(`/dashboard/tutor/${mode}/${child.id}`, { replace: true });
                }
            } catch (error) {
                console.error("Failed to fetch children", error);
            } finally {
                setLoading(false);
            }
        };
        fetchChildren();
    }, [mode, navigate]);

    if (loading) {
        return <div className="p-10 text-center">{t('common.loading')}...</div>;
    }

    if (children.length === 0) {
        return (
            <div className="p-10 text-center">
                <p className="text-slate-500 mb-2">
                    {mode === 'test'
                        ? "Tous vos enfants ont déjà passé le test."
                        : "Aucun enfant n'a encore passé le test initial."}
                </p>
                <button onClick={() => navigate('/dashboard/tutor/select-child')} className="text-blue-600 hover:underline">
                    Retour
                </button>
            </div>
        );
    }

    // If multiple children, show selection list
    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">
                {mode === 'test' ? t('sidebar.menu.test_space') : t('sidebar.menu.training_space')}
            </h1>
            <p className="mb-6 text-slate-600">Sélectionnez un enfant pour continuer :</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {children.map(child => (
                    <div key={child.id}
                        onClick={() => navigate(`/dashboard/tutor/${mode}/${child.id}`)}
                        className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md hover:border-blue-200 cursor-pointer transition"
                    >
                        <h3 className="font-bold text-lg">{child.first_name} {child.last_name}</h3>
                        <p className="text-sm text-slate-500">{child.code}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChildSelector;
