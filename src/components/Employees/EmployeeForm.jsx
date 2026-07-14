import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { TEAMS, DEFAULT_TEAM } from '../../utils/constants';

export default function EmployeeForm({ isOpen, onClose, onSubmit, initialData }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    team: DEFAULT_TEAM,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        team: initialData.team || DEFAULT_TEAM,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        team: DEFAULT_TEAM,
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? 'Editar Empleado' : 'Nuevo Empleado'}</h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="form-container">
          <div className="form-group">
            <label>Nombre Completo *</label>
            <input 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required
              placeholder="Ej. Juan Pérez"
            />
          </div>

          <div className="form-group">
            <label>Correo Electrónico</label>
            <input 
              type="email" 
              name="email" 
              value={formData.email} 
              onChange={handleChange} 
              placeholder="juan.perez@huawei.com"
            />
          </div>
          
          <div className="form-group">
            <label>Teléfono de Contacto</label>
            <input
              type="text"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="987654321"
            />
          </div>

          <div className="form-group">
            <label>Team *</label>
            <select
              className="form-control"
              name="team"
              value={formData.team}
              onChange={handleChange}
              required
            >
              {TEAMS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn-primary">Guardar</button>
          </div>
        </form>
      </div>
    </div>
  );
}
