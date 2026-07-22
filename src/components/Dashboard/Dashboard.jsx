import { useState, useEffect } from 'react';
import { getDashboardStats } from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { Smartphone, CheckCircle, UploadCloud, CreditCard, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { TEAMS, canSeeAllTeams } from '../../utils/constants';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import './Dashboard.css';

const TEAM_FILTER_ALL = 'ALL';

export default function Dashboard() {
  const { user } = useAuth();
  const canSeeAll = canSeeAllTeams(user);

  // Determine initial team based on user email or team property
  const getInitialTeam = () => {
    if (user?.email?.toLowerCase().includes('pedro')) return 'IMS';
    if (user?.team && user.team !== 'BOTH') return user.team;
    return 'PC'; // Default to PS for Miguel / Admin
  };

  const [selectedTeam, setSelectedTeam] = useState(getInitialTeam());
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const teamParam = canSeeAll ? selectedTeam : (user?.team || 'PC');
        const data = await getDashboardStats(teamParam);
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [selectedTeam, canSeeAll, user]);

  if (loading && !stats) {
    return (
      <div className="dashboard-loading">
        <div className="shimmer-card"></div>
        <div className="shimmer-card"></div>
        <div className="shimmer-card"></div>
        <div className="shimmer-card"></div>
        <div className="shimmer-content"></div>
      </div>
    );
  }

  if (error) {
    return <div className="error-message">Error cargando dashboard: {error}</div>;
  }

  const getDashboardTitle = () => {
    if (!canSeeAll) {
      return `Dashboard ${user?.team === 'PC' ? 'PS' : (user?.team || '')}`;
    }
    if (selectedTeam === TEAM_FILTER_ALL) return 'Dashboard General';
    if (selectedTeam === 'PC') return 'Dashboard PS';
    if (selectedTeam === 'IMS') return 'Dashboard IMS';
    return 'Dashboard General';
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>{getDashboardTitle()}</h1>
          <p>Resumen del estado actual del inventario {canSeeAll && selectedTeam !== 'ALL' ? 'filtrado por área' : ''}</p>
        </div>

        {canSeeAll && (
          <div className="status-filters" style={{ margin: 0 }}>
            <button 
              className={`filter-btn ${selectedTeam === TEAM_FILTER_ALL ? 'active' : ''}`} 
              onClick={() => setSelectedTeam(TEAM_FILTER_ALL)}
            >
              Todos
            </button>
            {TEAMS.filter(t => t.value !== 'BOTH').map(t => (
              <button 
                key={t.value} 
                className={`filter-btn ${selectedTeam === t.value ? 'active' : ''}`} 
                onClick={() => setSelectedTeam(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total Terminales" 
          value={stats.terminals.total} 
          icon={<Smartphone size={24} />} 
          color="primary"
          trend={canSeeAll && selectedTeam !== 'ALL' ? `De ${stats.terminals.globalTotal} globales` : "Equipos registrados"} 
        />
        <StatCard 
          title="Terminales Disponibles" 
          value={stats.terminals.available} 
          icon={<CheckCircle size={24} />} 
          color="success"
          trend={`${Math.round((stats.terminals.available / (stats.terminals.total || 1)) * 100)}% del área`} 
        />
        <StatCard 
          title="Terminales Prestados" 
          value={stats.terminals.lent} 
          icon={<UploadCloud size={24} />} 
          color="warning"
          trend="Asignados actualmente" 
        />
        <StatCard 
          title="Total SIM Cards" 
          value={stats.simcards.total} 
          icon={<CreditCard size={24} />} 
          color="info"
          trend={`${stats.simcards.available} disponibles`} 
        />
      </div>

      <div className="dashboard-grid">
        <RecentActivity activities={stats.recent_activity} />
        
        <div className="quick-stats-panel">
          <h3>Resumen del Equipo</h3>
          <div className="employee-stat">
            <span className="stat-icon"><Users size={24} /></span>
            <div className="stat-info">
              <h4>{stats.employees.total} Empleados</h4>
              <p>{selectedTeam !== 'ALL' ? `Registrados en ${selectedTeam === 'PC' ? 'PS' : selectedTeam}` : 'Registrados en el sistema'}</p>
            </div>
          </div>
          
          <h3 style={{ marginTop: '2rem' }}>Estado de SIM Cards</h3>
          <div className="sim-stats-container">
            <div className="sim-stat-item">
              <div className="sim-stat-value success-text">{stats.simcards.available}</div>
              <div className="sim-stat-label">Disponibles</div>
            </div>
            <div className="sim-stat-item">
              <div className="sim-stat-value warning-text">{stats.simcards.lent}</div>
              <div className="sim-stat-label">En Uso</div>
            </div>
          </div>

          {stats.brandDistribution && stats.brandDistribution.length > 0 && (
            <div className="brand-distribution-panel" style={{ marginTop: '2rem' }}>
              <h3>Equipos por Fabricante</h3>
              <div style={{ height: '200px', width: '100%', marginTop: '1rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.brandDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {stats.brandDistribution.map((entry, index) => {
                        const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                        return <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />;
                      })}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-subtle)', borderRadius: '8px' }}
                      itemStyle={{ color: 'var(--text-primary)' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="brand-legend">
                {stats.brandDistribution.slice(0, 4).map((entry, index) => {
                  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
                  return (
                    <div key={entry.name} className="brand-legend-item">
                      <span className="brand-dot" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="brand-name">{entry.name}</span>
                      <span className="brand-value">{entry.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
