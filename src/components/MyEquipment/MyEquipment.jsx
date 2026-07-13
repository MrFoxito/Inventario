import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getTerminals, getSimCards } from '../../utils/api';
import { Package, Smartphone, CreditCard, AlertCircle } from 'lucide-react';
import DeviceImage from '../shared/DeviceImage';
import DeviceDetailsModal from '../shared/DeviceDetailsModal';
import './MyEquipment.css';

export default function MyEquipment() {
  const { user } = useAuth();
  const [terminals, setTerminals] = useState([]);
  const [simCards, setSimCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingTerminal, setViewingTerminal] = useState(null);

  useEffect(() => {
    if (user?.name) {
      fetchMyEquipment();
    }
  }, [user]);

  const fetchMyEquipment = async () => {
    setLoading(true);
    try {
      const [termData, simData] = await Promise.all([
        getTerminals({ handler: user.name }),
        getSimCards({ handler: user.name })
      ]);
      setTerminals(termData);
      setSimCards(simData);
    } catch (err) {
      console.error('Failed to fetch personal equipment', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="my-equipment-container">
        <div className="dashboard-loading" style={{ padding: '2rem' }}>
           <div className="shimmer-card" style={{ height: '80px', marginBottom: '15px' }}></div>
           <div className="shimmer-card" style={{ height: '80px', marginBottom: '15px' }}></div>
        </div>
      </div>
    );
  }

  const hasEquipment = terminals.length > 0 || simCards.length > 0;

  return (
    <div className="my-equipment-container">
      <div className="terminals-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2>Mis Equipos Asignados</h2>
          <p>Equipos y líneas actualmente bajo tu responsabilidad</p>
        </div>
      </div>

      {!hasEquipment ? (
        <div className="empty-state" style={{ marginTop: '2rem', padding: '4rem 2rem', background: 'var(--surface-color)', borderRadius: '12px' }}>
          <span><AlertCircle size={48} style={{ color: 'var(--text-secondary)' }} /></span>
          <h3>No tienes equipos asignados</h3>
          <p>Actualmente no hay terminales ni SIM cards registradas a tu nombre en el inventario.</p>
        </div>
      ) : (
        <div className="equipment-grid">
          {terminals.length > 0 && (
            <div className="equipment-section">
              <h3 className="section-title"><Smartphone size={20} /> Terminales ({terminals.length})</h3>
              <div className="cards-grid">
                {terminals.map(t => (
                  <div key={t.id} className="equipment-card has-image">
                    <div 
                      className="card-image-section" 
                      onClick={() => setViewingTerminal(t)}
                      style={{ cursor: 'pointer' }}
                      title="Ver ficha técnica"
                    >
                      <DeviceImage modelName={t.comercial} size={80} />
                    </div>
                    <div className="card-content-section">
                      <div className="card-header" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                        <h4>{t.comercial}</h4>
                        <span className="badge Prestado" style={{ margin: 0 }}>Activo</span>
                      </div>
                      <div className="card-body">
                        <p><strong>Fabricante:</strong> {t.fabricante}</p>
                        <p><strong>Modelo:</strong> {t.modelo || '-'}</p>
                        <p><strong>IMEI 1:</strong> <span style={{ fontFamily: 'monospace' }}>{t.imei1}</span></p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {simCards.length > 0 && (
            <div className="equipment-section">
              <h3 className="section-title"><CreditCard size={20} /> SIM Cards ({simCards.length})</h3>
              <div className="cards-grid">
                {simCards.map(s => (
                  <div key={s.id} className="equipment-card">
                    <div className="card-header">
                      <h4>Línea: {s.msisdn || 'Sin Asignar'}</h4>
                      <span className="badge Prestado">Activa</span>
                    </div>
                    <div className="card-body">
                      <p><strong>Plan:</strong> {s.tipo_plan}</p>
                      <p><strong>ICCID:</strong> <span style={{ fontFamily: 'monospace' }}>{s.iccid}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <DeviceDetailsModal 
        isOpen={!!viewingTerminal} 
        onClose={() => setViewingTerminal(null)} 
        terminal={viewingTerminal} 
      />
    </div>
  );
}
