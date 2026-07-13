import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import DuenhoDashboardView from './views/DuenhoDashboardView';
import ProfileView from './views/ProfileView';
import RepublicaDetailView from './views/RepublicaDetailView';

// Protected Route Component
function PrivateRoute({ children }) {
    const { authUser } = useAuth();
    if (!authUser) {
        return <Navigate to="/login" replace />;
    }
    
    return (
        <div className="app-shell">
            <Navbar />
            <main id="main-content">
                {children}
            </main>
        </div>
    );
}

export default function App() {
    const { authUser } = useAuth();

    return (
        <Routes>
            <Route 
                path="/login" 
                element={authUser ? <Navigate to="/" replace /> : <LoginView />} 
            />
            
            <Route 
                path="/" 
                element={
                    <PrivateRoute>
                        {authUser?.role === 'dueño' ? <Navigate to="/duenho" replace /> : <DashboardView />}
                    </PrivateRoute>
                } 
            />
            
            <Route 
                path="/duenho" 
                element={
                    <PrivateRoute>
                        <DuenhoDashboardView />
                    </PrivateRoute>
                } 
            />
            
            <Route 
                path="/profile" 
                element={
                    <PrivateRoute>
                        <ProfileView />
                    </PrivateRoute>
                } 
            />

            <Route 
                path="/republica/:id" 
                element={
                    <PrivateRoute>
                        <RepublicaDetailView />
                    </PrivateRoute>
                } 
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}
