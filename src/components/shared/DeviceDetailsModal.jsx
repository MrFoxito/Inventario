import React, { useState } from 'react';
import { X, Smartphone, CheckCircle, UploadCloud, Info, Clock } from 'lucide-react';
import DeviceImage from './DeviceImage';
import DeviceHistory from './DeviceHistory';
import './DeviceDetailsModal.css';

export default function DeviceDetailsModal({ isOpen, onClose, terminal }) {
  const [activeTab, setActiveTab] = useState('detalles');

  if (!isOpen || !terminal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content device-details-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
        
        <div className="device-details-grid">
          <div className="device-details-image-section">
            <DeviceImage modelName={terminal.comercial} size={null} className="large-preview" premium={true} />
          </div>
          
          <div className="device-details-info-container">
            <div className="device-header">
              <h2>{terminal.comercial}</h2>
              <span className={`badge ${terminal.status}`}>
                {terminal.status === 'Disponible' ? <CheckCircle size={14} style={{ marginRight: '4px' }}/> : <UploadCloud size={14} style={{ marginRight: '4px' }}/>}
                {terminal.status}
              </span>
            </div>

            <div className="device-tabs">
              <button 
                className={`device-tab ${activeTab === 'detalles' ? 'active' : ''}`}
                onClick={() => setActiveTab('detalles')}
              >
                <Info size={16} /> Detalles
              </button>
              <button 
                className={`device-tab ${activeTab === 'historial' ? 'active' : ''}`}
                onClick={() => setActiveTab('historial')}
              >
                <Clock size={16} /> Historial
              </button>
            </div>
            
            <div className="device-tab-content">
              {activeTab === 'detalles' && (
                <div className="info-list">
                  <div className="info-item">
                    <span className="info-label">Fabricante</span>
                    <span className="info-value">{terminal.fabricante}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Modelo Técnico</span>
                    <span className="info-value">{terminal.modelo || 'N/A'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">IMEI 1</span>
                    <span className="info-value monospace">{terminal.imei1}</span>
                  </div>
                  {terminal.imei2 && (
                    <div className="info-item">
                      <span className="info-label">IMEI 2</span>
                      <span className="info-value monospace">{terminal.imei2}</span>
                    </div>
                  )}
                  {terminal.status === 'Prestado' && terminal.current_handler && (
                    <div className="info-item handler-item">
                      <span className="info-label">Asignado a</span>
                      <span className="info-value handler-name">{terminal.current_handler}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'historial' && (
                <div className="device-history-scroll-area">
                  <DeviceHistory terminalId={terminal.id} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
