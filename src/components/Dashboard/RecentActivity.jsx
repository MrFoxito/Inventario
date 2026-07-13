import { Link } from 'react-router-dom';
import { Mailbox, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getRelativeTime } from '../../utils/helpers';
import './Dashboard.css';

export default function RecentActivity({ activities, loading }) {
  if (loading) {
    return (
      <div className="recent-activity">
        <div className="recent-activity-header">
          <h3>Actividad Reciente</h3>
        </div>
        <div className="activity-list">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="activity-skeleton" key={i}>
              <div className="skeleton skeleton-circle" />
              <div className="skeleton-lines" style={{ flex: 1 }}>
                <div className="skeleton skeleton-text" />
                <div className="skeleton skeleton-text" style={{ width: '50%' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="recent-activity">
      <div className="recent-activity-header">
        <h3>Actividad Reciente</h3>
        <Link to="/logs">Ver todo →</Link>
      </div>
      <div className="activity-list">
        {(!activities || activities.length === 0) ? (
          <div className="empty-state" style={{ padding: '40px 20px' }}>
            <div className="empty-state-icon"><Mailbox size={48} /></div>
            <h3>Sin actividad reciente</h3>
            <p>Los préstamos y devoluciones aparecerán aquí</p>
          </div>
        ) : (
          activities.map((item, i) => {
            const isLoan = item.action === 'Préstamo' || item.action === 'loan' || item.action === 'prestamo';
            const actionText = isLoan ? 'recibió en préstamo' : 'devolvió';
            let itemName = item.item_detail
              ? item.item_detail.comercial || item.item_detail.msisdn || item.item_detail.serial_number || ''
              : '';
            if (item.item_type === 'SIM') itemName = `SIM Card ${itemName}`;
            return (
              <div
                className="activity-item"
                key={item.id || i}
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <div className={`activity-icon ${isLoan ? 'loan' : 'return'}`}>
                  {isLoan ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                </div>
                <div className="activity-details">
                  <div className="activity-text">
                    <strong>{item.employee || 'Desconocido'}</strong> {actionText}{' '}
                    <strong>{itemName}</strong>
                  </div>
                </div>
                <span className="activity-time">{getRelativeTime(item.created_at)}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
