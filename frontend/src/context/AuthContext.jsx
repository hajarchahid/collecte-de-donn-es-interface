import { createContext, useContext, useState, useEffect } from 'react';
import i18n from '../i18n';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Sync language when user changes
        if (user?.language && user.language !== i18n.language) {
            i18n.changeLanguage(user.language);
        }
    }, [user]);

    useEffect(() => {
        // Check if token exists
        const token = localStorage.getItem('token');
        if (token) {
            api.get('/auth/me')
                .then(response => {
                    setUser(response.data);
                })
                .catch(() => {
                    localStorage.removeItem('token');
                })
                .finally(() => {
                    setLoading(false);
                });
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const response = await api.post('/auth/login', { email, password });
        const { access_token, role } = response.data;
        localStorage.setItem('token', access_token);
        // Refresh user data
        const userResponse = await api.get('/auth/me');
        setUser(userResponse.data);
        return userResponse.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
