import Modal from './Modal';
import './shared.css';

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  type = 'danger',
}) {
  const icon = type === 'danger' ? '🗑️' : '⚠️';

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title="" size="sm">
      <div className={`confirm-${type}`}>
        <div className="confirm-icon">{icon}</div>
        <div className="confirm-title">{title}</div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button
            className={`btn ${type === 'danger' ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
