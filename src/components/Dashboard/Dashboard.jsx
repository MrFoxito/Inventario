import { useState, useEffect } from 'react';
import { getDashboardStats } from '../../utils/api';
import { Smartphone, CheckCircle, UploadCloud, CreditCard, Users } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import StatCard from './StatCard';
import RecentActivity from './RecentActivity';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await getDashboardStats();
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
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

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard General</h1>
        <p>Resumen del estado actual del inventario</p>
      </header>

      <div className="stats-grid">
        <StatCard 
          title="Total Terminales" 
          value={stats.terminals.total} 
          icon={<Smartphone size={24} />} 
          color="primary"
          trend="Equipos registrados" 
        />
        <StatCard 
          title="Terminales Disponibles" 
          value={stats.terminals.available} 
          icon={<CheckCircle size={24} />} 
          color="success"
          trend={`${Math.round((stats.terminals.available / (stats.terminals.total || 1)) * 100)}% del total`} 
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
              <p>Registrados en el sistema</p>
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
