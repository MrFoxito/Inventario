import { useState, useEffect } from 'react';
import Modal from '../shared/Modal';
import { TEAMS, DEFAULT_TEAM } from '../../utils/constants';

const FABRICANTES = ['APPLE', 'HUAWEI', 'SAMSUNG', 'OPPO', 'VIVO', 'HONOR', 'XIAOMI', 'MOTOROLA', 'OTROS'];

export default function TerminalForm({ isOpen, onClose, onSubmit, initialData = null }) {
  const [formData, setFormData] = useState({
    fabricante: '',
    comercial: '',
    modelo: '',
    serial_number: '',
    imei1: '',
    team: DEFAULT_TEAM
  });
  
  const [customFabricante, setCustomFabricante] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        fabricante: FABRICANTES.includes(initialData.fabricante) ? initialData.fabricante : 'OTROS',
        comercial: initialData.comercial || '',
        modelo: initialData.modelo || '',
        serial_number: initialData.serial_number || '',
        imei1: initialData.imei1 || '',
        team: initialData.team || DEFAULT_TEAM
      });
      if (!FABRICANTES.includes(initialData.fabricante)) {
        setCustomFabricante(initialData.fabricante);
      }
    } else {
      setFormData({
        fabricante: '',
        comercial: '',
        modelo: '',
        serial_number: '',
        imei1: '',
        team: DEFAULT_TEAM
      });
      setCustomFabricante('');
    }
  }, [initialData, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const submitData = { ...formData };
    if (submitData.fabricante === 'OTROS') {
      submitData.fabricante = customFabricante;
    }
    onSubmit(submitData);
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={initialData ? "Editar Terminal" : "Nuevo Terminal"}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Fabricante *</label>
          <select 
            className="form-control" 
            name="fabricante" 
            value={formData.fabricante} 
            onChange={handleChange}
            required
          >
            <option value="">Seleccione...</option>
            {FABRICANTES.map(f => (
              <option key={f} value={f}>{f}</option>
            ))}
          </select>
        </div>

        {formData.fabricante === 'OTROS' && (
          <div className="form-group" style={{ animation: 'fadeIn 0.2s ease' }}>
            <label>Especifique Fabricante *</label>
            <input 
              type="text" 
              className="form-control" 
              value={customFabricante} 
              onChange={(e) => setCustomFabricante(e.target.value)}
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Nombre Comercial *</label>
          <input 
            type="text" 
            className="form-control" 
            name="comercial" 
            value={formData.comercial} 
            onChange={handleChange}
            required
            placeholder="Ej. iPhone 14 Pro, Galaxy S23"
          />
        </div>

        <div className="form-group">
          <label>Modelo</label>
          <input 
            type="text" 
            className="form-control" 
            name="modelo" 
            value={formData.modelo} 
            onChange={handleChange}
            placeholder="Ej. A2890"
          />
        </div>

        <div className="form-group">
          <label>Número de Serie</label>
          <input 
            type="text" 
            className="form-control" 
            name="serial_number" 
            value={formData.serial_number} 
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label>IMEI 1 *</label>
          <input
            type="text"
            className="form-control"
            name="imei1"
            value={formData.imei1}
            onChange={handleChange}
            required
            placeholder="15 dígitos"
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

        <div className="form-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" className="btn-primary">Guardar</button>
        </div>
      </form>
    </Modal>
  );
}
