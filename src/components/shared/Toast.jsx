import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import './shared.css';

const ICONS = {
  success: <CheckCircle size={20} />,
  error: <XCircle size={20} />,
  warning: <AlertTriangle size={20} />,
  info: <Info size={20} />,
};

const TITLES = {
  success: 'Éxito',
  error: 'Error',
  warning: 'Advertencia',
  info: 'Información',
};

export default function Toast({ title, message, type = 'info', onClose }) {
  return (
    <div className={`toast toast-${type}`}>
      <div className="toast-icon">{ICONS[type]}</div>
      <div className="toast-content">
        <div className="toast-title">{title || TITLES[type]}</div>
        <div className="toast-message">{message}</div>
      </div>
      <button className="toast-close" onClick={onClose} aria-label="Cerrar notificación">
        <X size={16} />
      </button>
      <div className="toast-progress" />
    </div>
  );
}
