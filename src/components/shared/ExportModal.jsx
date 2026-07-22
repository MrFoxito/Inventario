import React from 'react';
import Modal from './Modal';
import { Download, Layers, ShieldCheck, Database } from 'lucide-react';
import './ExportModal.css';

export default function ExportModal({ isOpen, onClose }) {
  const handleExport = (team) => {
    const url = `/api/export/excel?team=${team}`;
    window.location.href = url;
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exportar Inventario Excel">
      <div className="export-modal-content">
        <p className="export-modal-subtitle">
          Selecciona el tipo de reporte en Excel que deseas generar:
        </p>

        <div className="export-options-grid">
          <button 
            className="export-option-card option-ps"
            onClick={() => handleExport('PC')}
          >
            <div className="export-option-icon">
              <Layers size={24} />
            </div>
            <div className="export-option-info">
              <h4>Reporte Área PS</h4>
              <p>Equipos y SIMs de Packet Switch + pestaña de externos prestados a PS.</p>
            </div>
            <Download className="export-arrow" size={20} />
          </button>

          <button 
            className="export-option-card option-ims"
            onClick={() => handleExport('IMS')}
          >
            <div className="export-option-icon">
              <ShieldCheck size={24} />
            </div>
            <div className="export-option-info">
              <h4>Reporte Área IMS</h4>
              <p>Equipos y SIMs de IMS + pestaña de externos prestados a IMS.</p>
            </div>
            <Download className="export-arrow" size={20} />
          </button>

          <button 
            className="export-option-card option-global"
            onClick={() => handleExport('ALL')}
          >
            <div className="export-option-icon">
              <Database size={24} />
            </div>
            <div className="export-option-info">
              <h4>Reporte Global (Completo)</h4>
              <p>Consolidado total con todos los equipos y SIM cards registradas.</p>
            </div>
            <Download className="export-arrow" size={20} />
          </button>
        </div>
      </div>
    </Modal>
  );
}
