import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { TEAMS, DEFAULT_TEAM } from '../../utils/constants';

export default function SimCardForm({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    iccid: '',
    imsi: '',
    msisdn: '',
    tipo_plan: '',
    procedencia: '',
    observacion: '',
    team: DEFAULT_TEAM
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        iccid: initialData.iccid || '',
        imsi: initialData.imsi || '',
        msisdn: initialData.msisdn || '',
        tipo_plan: initialData.tipo_plan || '',
        procedencia: initialData.procedencia || '',
        observacion: initialData.observacion || '',
        team: initialData.team || DEFAULT_TEAM
      });
    } else {
      setFormData({
        iccid: '',
        imsi: '',
        msisdn: '',
        tipo_plan: '',
        procedencia: '',
        observacion: '',
        team: DEFAULT_TEAM
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

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Editar SIM Card" : "Nueva SIM Card"}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>MSISDN (Número de Teléfono)</label>
          <input 
            type="text" 
            className="form-control" 
            name="msisdn" 
            value={formData.msisdn} 
            onChange={handleChange}
            placeholder="Ej. 51999999999"
          />
        </div>

        <div className="form-group">
          <label>ICCID</label>
          <input 
            type="text" 
            className="form-control" 
            name="iccid" 
            value={formData.iccid} 
            onChange={handleChange}
            placeholder="20 dígitos"
          />
        </div>

        <div className="form-group">
          <label>IMSI</label>
          <input 
            type="text" 
            className="form-control" 
            name="imsi" 
            value={formData.imsi} 
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Tipo / Plan *</label>
          <input 
            type="text" 
            className="form-control" 
            name="tipo_plan" 
            value={formData.tipo_plan} 
            onChange={handleChange}
            required
            placeholder="Ej. Entel Postpago"
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
            {TEAMS.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Procedencia</label>
          <input 
            type="text" 
            className="form-control" 
            name="procedencia" 
            value={formData.procedencia} 
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>Observación</label>
          <input 
            type="text" 
            className="form-control" 
            name="observacion" 
            value={formData.observacion} 
            onChange={handleChange}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
