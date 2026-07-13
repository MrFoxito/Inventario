import { useState, useEffect, useMemo } from 'react';
import { getTerminals, getSimCards, getEmployees, lendItemsBulk, returnItemsBulk } from '../../utils/api';
import { useToast } from '../../App';
import { UploadCloud, DownloadCloud, Smartphone, CreditCard, CheckCircle, Sparkles, User, ArrowDownToLine, Search } from 'lucide-react';
import EmailGenerator from './EmailGenerator';
import ConfirmDialog from '../shared/ConfirmDialog';
import './Assignments.css';

export default function AssignmentPanel() {
  const [activeTab, setActiveTab] = useState('lend'); // 'lend' | 'return'
  
  // Data state
  const [availableTerminals, setAvailableTerminals] = useState([]);
  const [availableSims, setAvailableSims] = useState([]);
  const [lentItems, setLentItems] = useState([]);
  const [employees, setEmployees] = useState([]);
  
  // Lend form state
  const [itemType, setItemType] = useState('Terminal');
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [notes, setNotes] = useState('');
  
  // Return state
  const [returningItems, setReturningItems] = useState([]);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  
  // Success state
  const [createdLogIds, setCreatedLogIds] = useState([]);
  
  const { addToast } = useToast();

  useEffect(() => {
    if (activeTab === 'lend' && createdLogIds.length === 0) {
      loadLendData();
      setSelectedItemIds([]);
      setSearchQuery('');
    } else if (activeTab === 'return') {
      loadReturnData();
      setReturningItems([]);
    }
  }, [activeTab, createdLogIds]);

  const loadLendData = async () => {
    try {
      const [termData, simData, empData] = await Promise.all([
        getTerminals({ status: 'Disponible' }),
        getSimCards({ status: 'Disponible' }),
        getEmployees()
      ]);
      setAvailableTerminals(termData);
      setAvailableSims(simData);
      setEmployees(empData.filter(e => e.active));
    } catch (err) {
      addToast('Error', 'No se pudieron cargar los datos de disponibilidad', 'error');
    }
  };

  const loadReturnData = async () => {
    try {
      const [termData, simData] = await Promise.all([
        getTerminals({ status: 'Prestado' }),
        getSimCards({ status: 'Prestado' })
      ]);
      
      const combined = [
        ...termData.map(t => ({ ...t, _type: 'Terminal', _label: `${t.comercial} - ${t.imei1}` })),
        ...simData.map(s => ({ ...s, _type: 'SIM', _label: `${s.tipo_plan} - ${s.msisdn || s.iccid}` }))
      ];
      
      combined.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      setLentItems(combined);
    } catch (err) {
      addToast('Error', 'No se pudieron cargar los equipos prestados', 'error');
    }
  };

  const handleLendSubmit = async (e) => {
    e.preventDefault();
    if (selectedItemIds.length === 0 || !selectedEmployee) {
      addToast('Error', 'Selecciona al menos un equipo y un empleado', 'warning');
      return;
    }

    try {
      const itemsPayload = selectedItemIds.map(id => ({ item_type: itemType, item_id: id }));
      const result = await lendItemsBulk({
        items: itemsPayload,
        employee: selectedEmployee,
        notes
      });
      
      const logIds = result.log_ids || result.logIds;
      if (logIds && logIds.length > 0) {
        setCreatedLogIds(logIds);
      } else {
        addToast('Advertencia', 'Se procesó la solicitud pero no se generaron logs', 'warning');
      }
      
      // Reset form
      setSelectedItemIds([]);
      setSelectedEmployee('');
      setNotes('');
      setSearchQuery('');
      
    } catch (err) {
      addToast('Error', 'No se pudo registrar el préstamo: ' + err.message, 'error');
    }
  };

  const handleReturnConfirm = async () => {
    if (returningItems.length === 0) return;
    
    try {
      const itemsPayload = returningItems.map(item => ({ item_type: item._type, item_id: item.id }));
      await returnItemsBulk({
        items: itemsPayload,
        notes: 'Devuelto a inventario general'
      });
      
      addToast('Éxito', `${returningItems.length} equipo(s) devuelto(s) correctamente`, 'success');
      setReturningItems([]);
      setIsReturnModalOpen(false);
      loadReturnData();
    } catch (err) {
      addToast('Error', 'No se pudo procesar la devolución: ' + err.message, 'error');
    }
  };

  const toggleItemSelection = (id) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleReturnItemSelection = (item) => {
    setReturningItems(prev => 
      prev.find(i => i._type === item._type && i.id === item.id)
        ? prev.filter(i => !(i._type === item._type && i.id === item.id))
        : [...prev, item]
    );
  };

  // Filtered lists for rendering
  const filteredAvailableList = useMemo(() => {
    const list = itemType === 'Terminal' ? availableTerminals : availableSims;
    if (!searchQuery) return list;
    const lowerQ = searchQuery.toLowerCase();
    return list.filter(item => {
      const textToSearch = itemType === 'Terminal' 
        ? `${item.comercial} ${item.imei1} ${item.modelo}` 
        : `${item.tipo_plan} ${item.msisdn} ${item.iccid}`;
      return textToSearch.toLowerCase().includes(lowerQ);
    });
  }, [itemType, availableTerminals, availableSims, searchQuery]);

  return (
    <div className="assignments-container">
      <div className="assignments-header">
        <h2>Gestión de Asignaciones</h2>
        <p>Control de préstamos y devoluciones masivas de equipos</p>
      </div>

      <div className="assignments-tabs">
        <button 
          className={`tab-btn ${activeTab === 'lend' ? 'active' : ''}`}
          onClick={() => { setActiveTab('lend'); setCreatedLogIds([]); }}
        >
          <UploadCloud size={20} /> Prestar Equipos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'return' ? 'active' : ''}`}
          onClick={() => { setActiveTab('return'); setCreatedLogIds([]); }}
        >
          <DownloadCloud size={20} /> Devolver Equipos
        </button>
      </div>

      <div className="panel-content">
        {createdLogIds.length > 0 ? (
          <EmailGenerator logIds={createdLogIds} onDone={() => { setCreatedLogIds([]); loadLendData(); }} />
        ) : activeTab === 'lend' ? (
          <form className="lend-form-layout" onSubmit={handleLendSubmit}>
            <div className="form-section" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="form-group">
                <label>Tipo de Elementos</label>
                <div className="item-type-toggle">
                  <button 
                    type="button"
                    className={`type-btn ${itemType === 'Terminal' ? 'active' : ''}`}
                    onClick={() => { setItemType('Terminal'); setSelectedItemIds([]); setSearchQuery(''); }}
                  >
                    <Smartphone size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Terminales
                  </button>
                  <button 
                    type="button"
                    className={`type-btn ${itemType === 'SIM' ? 'active' : ''}`}
                    onClick={() => { setItemType('SIM'); setSelectedItemIds([]); setSearchQuery(''); }}
                  >
                    <CreditCard size={18} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> SIM Cards
                  </button>
                </div>
              </div>

              <div className="form-group" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Seleccionar {itemType}s ({selectedItemIds.length} seleccionados)</span>
                </label>
                
                <div className="search-box" style={{ marginBottom: '10px', position: 'relative' }}>
                  <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#888' }} />
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder={`Buscar por ${itemType === 'Terminal' ? 'modelo o IMEI' : 'plan o línea'}...`}
                    style={{ paddingLeft: '35px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <div className="checkbox-list" style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '10px', background: 'var(--surface-color)', minHeight: '200px' }}>
                  {filteredAvailableList.length === 0 ? (
                    <div style={{ textAlign: 'center', color: '#888', marginTop: '20px' }}>No hay elementos disponibles.</div>
                  ) : (
                    filteredAvailableList.map(item => {
                      const isChecked = selectedItemIds.includes(item.id);
                      const displayLabel = itemType === 'Terminal' 
                        ? `${item.comercial} (IMEI: ${item.imei1})` 
                        : `${item.tipo_plan} (Línea: ${item.msisdn || 'N/A'})`;
                      
                      return (
                        <div 
                          key={item.id} 
                          className={`checkbox-item ${isChecked ? 'selected' : ''}`}
                          onClick={() => toggleItemSelection(item.id)}
                          style={{ padding: '10px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', cursor: 'pointer', borderRadius: '4px', background: isChecked ? 'rgba(74,144,226,0.1)' : 'transparent' }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked} 
                            readOnly 
                            style={{ marginRight: '10px', pointerEvents: 'none' }}
                          />
                          <span style={{ fontWeight: isChecked ? '600' : 'normal', color: isChecked ? 'var(--primary-color)' : 'inherit' }}>
                            {displayLabel}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            <div className="form-section">
              <div className="form-group">
                <label>Empleado Asignado *</label>
                <select 
                  className="form-control"
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  required
                >
                  <option value="">-- Seleccione empleado --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.name}>{emp.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Notas (Opcional)</label>
                <textarea 
                  className="form-control"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Motivo del préstamo masivo, accesorios entregados..."
                />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: 'auto' }} disabled={selectedItemIds.length === 0 || !selectedEmployee}>
                <CheckCircle size={20} /> Prestar {selectedItemIds.length > 0 ? selectedItemIds.length : ''} Equipos
              </button>
            </div>
          </form>
        ) : (
          <div className="return-section" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {lentItems.length === 0 ? (
              <div className="empty-state">
                <span><Sparkles size={48} /></span>
                <h3>Todo está en orden</h3>
                <p>No hay equipos prestados actualmente.</p>
              </div>
            ) : (
              <>
                <div className="return-grid" style={{ paddingBottom: returningItems.length > 0 ? '80px' : '0' }}>
                  {lentItems.map((item, idx) => {
                    const isSelected = !!returningItems.find(i => i._type === item._type && i.id === item.id);
                    return (
                      <div 
                        key={`${item._type}-${item.id}`} 
                        className={`return-card ${isSelected ? 'selected-return' : ''}`} 
                        style={{ 
                          animationDelay: `${idx * 50}ms`, 
                          animation: 'slideUp 0.3s backwards',
                          border: isSelected ? '2px solid var(--primary-color)' : '',
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleReturnItemSelection(item)}
                      >
                        <div className="card-header">
                          <div>
                            <div className="item-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              {item._type === 'Terminal' ? <Smartphone size={18} /> : <CreditCard size={18} />}
                              {item._type === 'Terminal' ? item.comercial : item.tipo_plan}
                            </div>
                            <div className="item-subtitle">
                              {item._type === 'Terminal' ? `IMEI: ${item.imei1}` : `Línea: ${item.msisdn || item.iccid}`}
                            </div>
                          </div>
                          <div>
                            <input type="checkbox" checked={isSelected} readOnly style={{ pointerEvents: 'none', width: '20px', height: '20px' }} />
                          </div>
                        </div>
                        
                        <div className="item-handler" style={{ marginTop: '1rem' }}>
                          <User size={16} /> {item.current_handler}
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {returningItems.length > 0 && (
                  <div className="bulk-return-bar" style={{
                    position: 'absolute',
                    bottom: '20px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--surface-color)',
                    padding: '15px 25px',
                    borderRadius: '50px',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '20px',
                    zIndex: 10,
                    border: '1px solid var(--border-color)'
                  }}>
                    <span style={{ fontWeight: 'bold' }}>{returningItems.length} equipos seleccionados</span>
                    <button className="btn-primary" onClick={() => setIsReturnModalOpen(true)}>
                      <ArrowDownToLine size={18} /> Devolver Todos
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isReturnModalOpen && (
        <ConfirmDialog
          isOpen={isReturnModalOpen}
          title="Confirmar Devolución Masiva"
          message={`¿Estás seguro que deseas registrar la devolución de los ${returningItems.length} equipos seleccionados?`}
          confirmText="Confirmar Devolución"
          type="warning"
          onConfirm={handleReturnConfirm}
          onCancel={() => setIsReturnModalOpen(false)}
        />
      )}
    </div>
  );
}
