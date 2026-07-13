import React, { useState, useEffect } from 'react';
import { getLogs } from '../../utils/api';
import { Clock, User, ArrowRight, ArrowLeft } from 'lucide-react';
import './DeviceHistory.css';

export default function DeviceHistory({ terminalId }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadHistory() {
      try {
        setLoading(true);
        const data = await getLogs({ item_type: 'Terminal', item_id: terminalId });
        setLogs(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (terminalId) loadHistory();
  }, [terminalId]);

  if (loading) {
    return <div className="history-loading">Cargando historial...</div>;
  }

  if (error) {
    return <div className="history-error">Error: {error}</div>;
  }

  if (logs.length === 0) {
    return (
      <div className="history-empty">
        <Clock size={40} className="empty-icon" />
        <p>No hay registros de movimientos para este equipo.</p>
      </div>
    );
  }

  return (
    <div className="device-history-container">
      <div className="timeline">
        {logs.map((log, index) => {
          const isLend = log.action === 'Préstamo';
          const dateObj = new Date(log.created_at);
          const dateStr = dateObj.toLocaleDateString('es-ES', {
            month: 'short', day: 'numeric', year: 'numeric'
          });
          const timeStr = dateObj.toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit'
          });

          return (
            <div key={log.id} className="timeline-item">
              <div className="timeline-dot-container">
                <div className={`timeline-dot ${isLend ? 'lend-dot' : 'return-dot'}`}>
                  {isLend ? <ArrowRight size={14} /> : <ArrowLeft size={14} />}
                </div>
                {index !== logs.length - 1 && <div className="timeline-line"></div>}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className={`timeline-action ${isLend ? 'action-lend' : 'action-return'}`}>
                    {log.action}
                  </span>
                  <span className="timeline-date">{dateStr} • {timeStr}</span>
                </div>
                <div className="timeline-body">
                  <div className="timeline-user">
                    <User size={16} />
                    <span>{log.employee}</span>
                  </div>
                  {log.notes && <p className="timeline-notes">"{log.notes}"</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
