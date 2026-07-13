import { useState, useEffect } from 'react';
import { getSimCards, createSimCard, updateSimCard, deleteSimCard } from '../../utils/api';
import { useToast } from '../../App'; 
import { useAuth } from '../../contexts/AuthContext';
import { Download, Plus, Search, CreditCard, Edit2, Trash2 } from 'lucide-react';
import SimCardForm from './SimCardForm';
import ConfirmDialog from '../shared/ConfirmDialog';
import './SimCards.css';
import '../Terminals/Terminals.css'; // Reuse premium table styles

export default function SimCardList() {
  const { isAdmin } = useAuth();
  const [simCards, setSimCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSimCard, setEditingSimCard] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingSimCard, setDeletingSimCard] = useState(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchSimCards();
  }, [filter, searchTerm]);

  const fetchSimCards = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'Todos') params.status = filter;
      if (searchTerm) params.search = searchTerm;
      
      const data = await getSimCards(params);
      setSimCards(data);
    } catch (err) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export/excel';
    addToast('Descarga iniciada', 'El archivo Excel se está descargando', 'info');
  };

  const handleFormSubmit = async (data) => {
    try {
      if (editingSimCard) {
        await updateSimCard(editingSimCard.id, data);
        addToast('Éxito', 'SIM Card actualizada correctamente', 'success');
      } else {
        await createSimCard(data);
        addToast('Éxito', 'SIM Card registrada correctamente', 'success');
      }
      setIsFormOpen(false);
      fetchSimCards();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await deleteSimCard(deletingSimCard.id);
      addToast('Éxito', 'SIM Card eliminada', 'success');
      setIsDeleteOpen(false);
      fetchSimCards();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const openNewForm = () => {
    setEditingSimCard(null);
    setIsFormOpen(true);
  };

  const openEditForm = (sim) => {
    setEditingSimCard(sim);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (sim) => {
    if (sim.status === 'Prestado') {
      addToast('Acción no permitida', 'No se puede eliminar una SIM que está prestada actualmente.', 'warning');
      return;
    }
    setDeletingSimCard(sim);
    setIsDeleteOpen(true);
  };

  return (
    <div className="simcards-container">
      <div className="simcards-header">
        <div>
          <h2>Gestión de SIM Cards</h2>
          <p>Administra los chips y líneas de prueba</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} /> Exportar Excel
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={openNewForm}>
              <Plus size={18} /> Nueva SIM Card
            </button>
          )}
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span><Search size={18} /></span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por ICCID, IMSI, MSISDN..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-filters">
          <button className={`filter-btn ${filter === 'Todos' ? 'active' : ''}`} onClick={() => setFilter('Todos')}>Todas</button>
          <button className={`filter-btn ${filter === 'Disponible' ? 'active' : ''}`} onClick={() => setFilter('Disponible')}>Disponibles</button>
          <button className={`filter-btn ${filter === 'Prestado' ? 'active' : ''}`} onClick={() => setFilter('Prestado')}>Prestadas</button>
        </div>
      </div>

      <div className="table-container">
        {loading ? (
          <div className="dashboard-loading" style={{ padding: '2rem' }}>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
          </div>
        ) : simCards.length === 0 ? (
          <div className="empty-state">
            <span><CreditCard size={48} /></span>
            <h3>No se encontraron SIM Cards</h3>
            <p>Ajusta los filtros o agrega una nueva al sistema.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>MSISDN (Línea)</th>
                <th>ICCID</th>
                <th>Tipo / Plan</th>
                <th>Handler Actual</th>
                <th>Estado</th>
                {isAdmin && <th style={{ width: '80px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {simCards.map((sim, index) => (
                <tr key={sim.id} style={{ animationDelay: `${index * 50}ms` }}>
                  <td data-label="MSISDN (Línea)" style={{ fontWeight: 600, color: 'var(--accent-info)' }}>{sim.msisdn || 'No Data'}</td>
                  <td data-label="ICCID" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{sim.iccid}</td>
                  <td data-label="Tipo / Plan">{sim.tipo_plan}</td>
                  <td data-label="Handler Actual">{sim.status === 'Prestado' ? sim.current_handler : '-'}</td>
                  <td data-label="Estado">
                    <span className={`badge ${sim.status}`}>{sim.status}</span>
                  </td>
                  {isAdmin && (
                    <td data-label="Acciones">
                      <div className="actions-cell">
                        <button className="action-btn edit" onClick={() => openEditForm(sim)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => openDeleteDialog(sim)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <SimCardForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={handleFormSubmit}
          initialData={editingSimCard}
        />
      )}

      {isDeleteOpen && deletingSimCard && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Eliminar SIM Card"
          message={`¿Estás seguro que deseas eliminar la línea ${deletingSimCard.msisdn || 'sin número'}? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}
