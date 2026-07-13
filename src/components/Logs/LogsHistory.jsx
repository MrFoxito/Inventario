import { useState, useEffect } from 'react';
import { getLogs } from '../../utils/api';
import { formatDate, getRelativeTime } from '../../utils/helpers';
import { useToast } from '../../App';
import { Search, ClipboardList, ArrowUpRight, ArrowDownLeft, Mail } from 'lucide-react';
import EmailGenerator from '../Assignments/EmailGenerator';
import './Logs.css';

export default function LogsHistory() {
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
  }, [filters]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await getLogs(filters);
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
        <p>Línea de tiempo de todos los movimientos de equipos</p>
      </div>

      <div className="filters-bar">
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
        
        <div className="status-filters">
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
                      <span className="timeline-employee">{log.employee}</span>
                      <span className="timeline-action-text">
                        {isLoan ? ' recibió en préstamo ' : ' devolvió '}
                        un(a) {log.item_type}
                      </span>
                    </div>
                    <div className="timeline-time" title={formatDate(log.created_at)}>
                      {getRelativeTime(log.created_at)}
                    </div>
                  </div>
                  
                  <div className="timeline-details">
                    {log.item_type === 'Terminal' ? (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Equipo:</span>
                          <span className="detail-value">{details.comercial} ({details.fabricante})</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">IMEI 1:</span>
                          <span className="detail-value">{details.imei1}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="detail-row">
                          <span className="detail-label">Plan:</span>
                          <span className="detail-value">{details.tipo_plan}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Línea:</span>
                          <span className="detail-value">{details.msisdn || details.iccid}</span>
                        </div>
                      </>
                    )}
                    
                    {log.notes && (
                      <div className="detail-row" style={{ marginTop: '0.5rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                        Nota: {log.notes}
                      </div>
                    )}

                    {isLoan && (
                      <div style={{ marginTop: '1rem' }}>
                        <button 
                          className="btn-secondary" 
                          style={{ 
                            padding: '0.4rem 0.8rem', 
                            fontSize: '0.85rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            whiteSpace: 'nowrap'
                          }} 
                          onClick={() => setViewingEmailLogId([log.id])}
                        >
                          <Mail size={14} style={{ marginRight: '6px' }} /> Ver Correo de Préstamo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {viewingEmailLogId && (
        <div className="modal-overlay" onClick={() => setViewingEmailLogId(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', width: '90%', padding: '20px' }}>
            <EmailGenerator logIds={viewingEmailLogId} onDone={() => setViewingEmailLogId(null)} isFromHistory={true} />
          </div>
        </div>
      )}
    </div>
  );
}
