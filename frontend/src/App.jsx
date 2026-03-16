import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import PublicLayout from './layouts/PublicLayout';
import AdminUsersPage from './features/admin/AdminUsersPage';
import AdminHome from './features/admin/AdminHome';
import AdminChildrenPage from './features/admin/AdminChildrenPage';
import ChildrenList from './features/ortho/ChildrenList';
import SessionRecording from './features/ortho/SessionRecording';
import DataExplorer from './features/research/DataExplorer';
import SupervisorDashboard from './features/supervision/SupervisorDashboard';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ActivateAccount from './pages/ActivateAccount';

import ProfileSettings from './features/profile/ProfileSettings';
import OrthoDashboard from './features/ortho/OrthoDashboard';
import SessionDetails from './features/ortho/SessionDetails';
import ChildDetails from './features/ortho/ChildDetails';
import NotificationsPage from './features/notifications/NotificationsPage';
import BilanPage from './features/ortho/BilanPage';

import ResearcherLayout from './layouts/ResearcherLayout';
import ResearcherDashboard from './features/researcher/ResearcherDashboard';
import DataExploration from './features/researcher/DataExploration';

import TutorDashboard from './features/tutor/TutorDashboard';
import TutorChildSelection from './features/tutor/TutorChildSelection';
import TutorTest from './features/tutor/TutorTest';
import TutorTraining from './features/tutor/TutorTraining';
import TutorTestWrapper from './features/tutor/ChildSelector';

// Protected Route Component
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/unauthorized" />;
    }

    return children;
};

// Dashboard Home Switcher
const DashboardHome = () => {
    const { user } = useAuth();
    if (user?.role === 'admin') return <AdminHome />;
    if (user?.role === 'orthophoniste') return <OrthoDashboard />;
    if (user?.role === 'doctorante') return <Navigate to="/dashboard/researcher" />;
    if (user?.role === 'tutor') return <Navigate to="/tutor/selection" />;

    // Default fallback (can be customized per role)
    return <h2>Bienvenue, {user?.username} !</h2>;
};

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<Navigate to="/login" replace />} />
                    <Route path="/login" element={<Login />} />

                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    <Route path="/activate-account" element={<ActivateAccount />} />
                    <Route path="/unauthorized" element={<div className="p-10 text-red-600">Accès non autorisé</div>} />

                    {/* Tutor Standalone Selection Route (No Sidebar) */}
                    <Route path="/tutor/selection" element={
                        <ProtectedRoute roles={['tutor']}>
                            <TutorChildSelection />
                        </ProtectedRoute>
                    } />

                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute roles={['admin', 'orthophoniste', 'doctorante', 'encadrant', 'tutor']}>
                            <DashboardLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<DashboardHome />} />
                        <Route path="profile" element={<ProfileSettings />} />
                        <Route path="notifications" element={<NotificationsPage />} />

                        {/* Admin Routes */}
                        <Route path="admin/users" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminUsersPage />
                            </ProtectedRoute>
                        } />
                        <Route path="admin/tutors" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminUsersPage defaultRole="tutor" />
                            </ProtectedRoute>
                        } />
                        <Route path="admin/children" element={
                            <ProtectedRoute roles={['admin']}>
                                <AdminChildrenPage />
                            </ProtectedRoute>
                        } />

                        {/* Orthophoniste Routes */}
                        <Route path="children" element={
                            <ProtectedRoute roles={['orthophoniste']}>
                                <ChildrenList />
                            </ProtectedRoute>
                        } />
                        <Route path="children/:patientId" element={
                            <ProtectedRoute roles={['orthophoniste']}>
                                <ChildDetails />
                            </ProtectedRoute>
                        } />
                        <Route path="children/:patientId/bilan" element={
                            <ProtectedRoute roles={['orthophoniste']}>
                                <BilanPage />
                            </ProtectedRoute>
                        } />
                        <Route path="record/:patientId" element={
                            <ProtectedRoute roles={['orthophoniste']}>
                                <SessionRecording />
                            </ProtectedRoute>
                        } />

                        {/* Research Routes */}
                        <Route path="research" element={
                            <ProtectedRoute roles={['doctorante', 'admin']}>
                                <DataExplorer />
                            </ProtectedRoute>
                        } />

                        {/* Supervision Routes */}
                        <Route path="supervision" element={
                            <ProtectedRoute roles={['encadrant', 'admin', 'doctorante']}>
                                <SupervisorDashboard />
                            </ProtectedRoute>
                        } />

                        {/* Session Detail Route */}
                        <Route path="sessions/:sessionId" element={
                            <ProtectedRoute roles={['orthophoniste']}>
                                <SessionDetails />
                            </ProtectedRoute>
                        } />

                        {/* Tutor Routes */}
                        <Route path="tutor" element={<Navigate to="/tutor/selection" replace />} />

                        <Route path="tutor/child/:childId" element={
                            <ProtectedRoute roles={['tutor']}>
                                <TutorDashboard />
                            </ProtectedRoute>
                        } />

                        <Route path="tutor/test/:childId" element={
                            <ProtectedRoute roles={['tutor']}>
                                <TutorTest />
                            </ProtectedRoute>
                        } />
                        <Route path="tutor/training/:childId" element={
                            <ProtectedRoute roles={['tutor']}>
                                <TutorTraining />
                            </ProtectedRoute>
                        } />
                    </Route>

                    {/* Researcher Interface (Distinct Layout) */}
                    <Route path="/dashboard/researcher" element={
                        <ProtectedRoute roles={['doctorante', 'admin']}>
                            <ResearcherLayout />
                        </ProtectedRoute>
                    }>
                        <Route index element={<ResearcherDashboard />} />
                        <Route path="explore" element={<DataExploration />} />
                        <Route path="profile" element={<ProfileSettings />} />
                    </Route>
                </Routes>
            </AuthProvider>
        </Router>
    );
}

export default App;
