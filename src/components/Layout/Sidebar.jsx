import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, CreditCard, Repeat, ClipboardList, LineChart, ChevronLeft, LogOut, Package, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';

export default function Sidebar({ collapsed, onToggle }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const NAV_ITEMS = [
    { to: '/', icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    ...(!isAdmin ? [{ to: '/my-equipment', icon: <Package size={20} />, label: 'Mis Equipos' }] : []),
    { to: '/terminals', icon: <Smartphone size={20} />, label: 'Terminales' },
    { to: '/simcards', icon: <CreditCard size={20} />, label: 'SIM Cards' },
    ...(isAdmin ? [{ to: '/assignments', icon: <Repeat size={20} />, label: 'Asignaciones' }] : []),
    { to: '/employees', icon: <Users size={20} />, label: 'Empleados' },
    { to: '/logs', icon: <ClipboardList size={20} />, label: 'Historial' },
    ...(isAdmin ? [{ to: '/reports', icon: <LineChart size={20} />, label: 'Reportes' }] : []),
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon"><img src="/logo.png" alt="Logo" style={{ width: '40px', height: '40px', objectFit: 'contain', borderRadius: '50%' }} /></div>
        <div className="sidebar-logo-text">
          <h1>Inventario Móvil</h1>
          <span style={{ fontSize: '11px' }}>{user?.name || 'Sistema de Gestión'}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <span className="sidebar-link-icon">{item.icon}</span>
            <span className="sidebar-link-label">{item.label}</span>
            <span className="sidebar-tooltip">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="sidebar-link logout-btn" onClick={handleLogout}>
          <span className="sidebar-link-icon"><LogOut size={20} /></span>
          <span className="sidebar-link-label">Cerrar Sesión</span>
        </button>
        
        <button className="sidebar-link toggle-btn" onClick={onToggle}>
          <span className="sidebar-link-icon"><ChevronLeft size={20} style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }} /></span>
          <span className="sidebar-link-label">Colapsar</span>
        </button>

        <div className="sidebar-version">{isAdmin ? 'v1.0 — Admin' : 'v1.0 — Empleado'}</div>
      </div>
    </aside>
  );
}
