import React, { createContext, useContext, useState, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import TerminalList from './components/Terminals/TerminalList';
import SimCardList from './components/SimCards/SimCardList';
import AssignmentPanel from './components/Assignments/AssignmentPanel';
import LogsHistory from './components/Logs/LogsHistory';
import WeeklyReport from './components/Reports/WeeklyReport';
import MyEquipment from './components/MyEquipment/MyEquipment';
import EmployeeList from './components/Employees/EmployeeList';
import Toast from './components/shared/Toast';

// Toast Context for global notifications
const ToastContext = createContext();

export function useToast() {
  return useContext(ToastContext);
}

function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((title, message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, title, message, type }]);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container">
        {toasts.map(toast => (
          <Toast 
            key={toast.id} 
            title={toast.title} 
            message={toast.message} 
            type={toast.type}
            onClose={() => removeToast(toast.id)} 
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading, isAdmin } = useAuth();
  
  if (loading) return <div className="dashboard-loading"><div className="shimmer-card"></div></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/" replace />;
  
  return children;
}

function AppRoutes() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { user, loading } = useAuth();

  if (loading) return <div className="dashboard-loading" style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner-mini" style={{ borderColor: 'var(--primary-color)', borderTopColor: 'transparent', width: '40px', height: '40px' }}></div></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
            <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/my-equipment" element={<MyEquipment />} />
                <Route path="/terminals" element={<TerminalList />} />
                <Route path="/simcards" element={<SimCardList />} />
                <Route path="/employees" element={<EmployeeList />} />
                <Route path="/assignments" element={<ProtectedRoute requireAdmin={true}><AssignmentPanel /></ProtectedRoute>} />
                <Route path="/logs" element={<LogsHistory />} />
                <Route path="/reports" element={<ProtectedRoute requireAdmin={true}><WeeklyReport /></ProtectedRoute>} />
              </Routes>
            </main>
          </div>
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
