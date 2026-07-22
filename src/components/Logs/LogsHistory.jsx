import { useState, useEffect } from 'react';
import { getLogs } from '../../utils/api';
import { formatDate, getRelativeTime } from '../../utils/helpers';
import { useToast } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { TEAMS, canSeeAllTeams } from '../../utils/constants';
import { Search, ClipboardList, ArrowUpRight, ArrowDownLeft, Mail } from 'lucide-react';
import EmailGenerator from '../Assignments/EmailGenerator';
import './Logs.css';

const TEAM_FILTER_ALL = 'ALL';

export default function LogsHistory() {
  const { user } = useAuth();
  const canSeeAll = canSeeAllTeams(user);

  const [teamFilter, setTeamFilter] = useState(canSeeAll ? TEAM_FILTER_ALL : (user?.team || 'PC'));
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    item_type: '',
    action: '',
    employee: ''
  });
  const [viewingEmailLogId, setViewingEmailLogId] = useState(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, [filters, teamFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const activeTeam = canSeeAll ? teamFilter : (user?.team || 'PC');
      const data = await getLogs({ ...filters, team: activeTeam });
      setLogs(data);
    } catch (err) {
      addToast('Error', 'No se pudo cargar el historial: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="logs-container">
      <div className="logs-header">
        <h2>Historial de Trazabilidad</h2>
        <p>Línea de tiempo de todos los movimientos de equipos {canSeeAll && teamFilter !== 'ALL' ? `(${teamFilter === 'PC' ? 'PS' : teamFilter})` : ''}</p>
      </div>

      <div className="filters-bar" style={{ flexWrap: 'wrap', gap: '1rem' }}>
        <div className="search-input-wrapper">
          <span><Search size={18} /></span>
          <input 
            type="text" 
            name="employee"
            className="search-input" 
            placeholder="Buscar empleado..." 
            value={filters.employee}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="status-filters" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <select name="item_type" value={filters.item_type} onChange={handleFilterChange} className="form-control">
            <option value="">Todos los Equipos</option>
            <option value="Terminal">Terminales</option>
            <option value="SIM">SIM Cards</option>
          </select>
          
          <select name="action" value={filters.action} onChange={handleFilterChange} className="form-control">
            <option value="">Todos los Movimientos</option>
            <option value="Préstamo">Préstamos</option>
            <option value="Devolución">Devoluciones</option>
          </select>
        </div>

        {canSeeAll && (
          <div className="status-filters">
            <button className={`filter-btn ${teamFilter === TEAM_FILTER_ALL ? 'active' : ''}`} onClick={() => setTeamFilter(TEAM_FILTER_ALL)}>Todos</button>
            {TEAMS.filter(t => t.value !== 'BOTH').map(t => (
              <button key={t.value} className={`filter-btn ${teamFilter === t.value ? 'active' : ''}`} onClick={() => setTeamFilter(t.value)}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="timeline-container">
        {loading ? (
          <div className="dashboard-loading">
            <div className="shimmer-card"></div>
            <div className="shimmer-card"></div>
            <div className="shimmer-card"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="empty-state">
            <span><ClipboardList size={48} /></span>
            <h3>No hay registros</h3>
            <p>No se encontraron movimientos con los filtros actuales.</p>
          </div>
        ) : (
          logs.map((log, index) => {
            const isLoan = log.action === 'Préstamo';
            const details = log.item_detail || {};
            
            return (
              <div 
                key={log.id} 
                className={`timeline-item ${isLoan ? 'loan' : 'return'}`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="timeline-icon">
                  {isLoan ? <ArrowUpRight size={20} /> : <ArrowDownLeft size={20} />}
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <div>
                      <span className={`badge ${isLoan ? 'Prestado' : 'Disponible'}`}>
                        {log.action}
                      </span>
                      <span className="log-item-type">{log.item_type}</span>
                    </div>
                    <div className="log-date" title={formatDate(log.created_at)}>
                      {getRelativeTime(log.created_at)}
                    </div>
                  </div>

                  <div className="log-main-info">
                    <h4>{log.employee}</h4>
                    <p className="log-device-name">
                      {log.item_type === 'Terminal' 
                        ? `${details.fabricante || ''} ${details.comercial || ''} (${details.modelo || 'Sin Modelo'})`
                        : `Chip MSISDN: ${details.msisdn || details.iccid || 'Sin número'}`
                      }
                    </p>
                  </div>

                  {log.notes && (
                    <p className="log-notes">
                      <strong>Nota:</strong> {log.notes}
                    </p>
                  )}

                  <div className="log-footer">
                    <button 
                      className="btn-link"
                      onClick={() => setViewingEmailLogId(log.id)}
                    >
                      <Mail size={14} /> Ver Correo de Notificación
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {viewingEmailLogId && (
        <EmailGenerator 
          logId={viewingEmailLogId} 
          onClose={() => setViewingEmailLogId(null)} 
        />
      )}
    </div>
  );
}
