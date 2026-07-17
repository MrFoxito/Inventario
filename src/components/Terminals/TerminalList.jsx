import { useState, useEffect } from 'react';
import { getTerminals, createTerminal, updateTerminal, deleteTerminal } from '../../utils/api';
import { useToast } from '../../App'; // ToastContext
import { useAuth } from '../../contexts/AuthContext';
import { Download, Plus, Search, Smartphone, Edit2, Trash2 } from 'lucide-react';
import TerminalForm from './TerminalForm';
import ConfirmDialog from '../shared/ConfirmDialog';
import DeviceImage from '../shared/DeviceImage';
import DeviceDetailsModal from '../shared/DeviceDetailsModal';
import { TEAMS, getTeamConfig, canSeeAllTeams } from '../../utils/constants';
import './Terminals.css';

const TEAM_FILTER_ALL = 'ALL';

export default function TerminalList() {
  const { user, isAdmin } = useAuth();
  const [terminals, setTerminals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Todos'); // Todos, Disponible, Prestado
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState(TEAM_FILTER_ALL);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTerminal, setEditingTerminal] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingTerminal, setDeletingTerminal] = useState(null);
  
  const [viewingTerminal, setViewingTerminal] = useState(null);
  
  const { addToast } = useToast();

  useEffect(() => {
    fetchTerminals();
  }, [filter, searchTerm]);

  const fetchTerminals = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filter !== 'Todos') params.status = filter;
      if (searchTerm) params.search = searchTerm;
      
      const data = await getTerminals(params);
      setTerminals(data);
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
      if (editingTerminal) {
        await updateTerminal(editingTerminal.id, data);
        addToast('Éxito', 'Terminal actualizado correctamente', 'success');
      } else {
        await createTerminal(data);
        addToast('Éxito', 'Terminal registrado correctamente', 'success');
      }
      setIsFormOpen(false);
      fetchTerminals();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTerminal) return;
    try {
      await deleteTerminal(deletingTerminal.id);
      addToast('Éxito', 'Terminal eliminado permanentemente', 'success');
      setIsDeleteOpen(false);
      setDeletingTerminal(null);
      fetchTerminals();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const openNewForm = () => {
    setEditingTerminal(null);
    setIsFormOpen(true);
  };

  const openEditForm = (terminal) => {
    setEditingTerminal(terminal);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (terminal) => {
    if (terminal.status === 'Prestado') {
      addToast('Acción no permitida', 'No se puede eliminar un equipo que está prestado actualmente.', 'warning');
      return;
    }
    setDeletingTerminal(terminal);
    setIsDeleteOpen(true);
  };

  const canSeeAll = canSeeAllTeams(user);

  const filteredTerminals = terminals.filter(t => {
    return canSeeAll
      ? (teamFilter === TEAM_FILTER_ALL || t.team === teamFilter)
      : t.team === user?.team;
  });

  return (
    <div className="terminals-container">
      <div className="terminals-header">
        <div>
          <h2>Gestión de Terminales</h2>
          <p>Administra los dispositivos móviles del inventario</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <Download size={18} /> Exportar Excel
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { setEditingTerminal(null); setIsFormOpen(true); }}>
              <Plus size={18} /> Nuevo Equipo
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
            placeholder="Buscar por marca, modelo, IMEI..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="status-filters">
          <button className={`filter-btn ${filter === 'Todos' ? 'active' : ''}`} onClick={() => setFilter('Todos')}>Todos</button>
          <button className={`filter-btn ${filter === 'Disponible' ? 'active' : ''}`} onClick={() => setFilter('Disponible')}>Disponibles</button>
          <button className={`filter-btn ${filter === 'Prestado' ? 'active' : ''}`} onClick={() => setFilter('Prestado')}>Prestados</button>
        </div>
        {canSeeAll && (
          <div className="status-filters">
            <button className={`filter-btn ${teamFilter === TEAM_FILTER_ALL ? 'active' : ''}`} onClick={() => setTeamFilter(TEAM_FILTER_ALL)}>Todos</button>
            {TEAMS.map(t => (
              <button key={t.value} className={`filter-btn ${teamFilter === t.value ? 'active' : ''}`} onClick={() => setTeamFilter(t.value)}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="table-container">
        {loading ? (
          <div className="dashboard-loading" style={{ padding: '2rem' }}>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
             <div className="shimmer-card" style={{ height: '40px', marginBottom: '10px' }}></div>
          </div>
        ) : filteredTerminals.length === 0 ? (
          <div className="empty-state">
            <span><Smartphone size={48} /></span>
            <h3>No se encontraron terminales</h3>
            <p>Ajusta los filtros o agrega un nuevo equipo al sistema.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th style={{ width: '60px', textAlign: 'center' }}>Foto</th>
                <th>Fabricante</th>
                <th>Nombre Comercial</th>
                <th>Modelo</th>
                <th>IMEI 1</th>
                <th>Team</th>
                <th>Handler Actual</th>
                <th>Estado</th>
                {isAdmin && <th style={{ width: '80px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTerminals.map((t, index) => {
                const teamConfig = getTeamConfig(t.team);
                return (
                <tr key={t.id} style={{ animationDelay: `${index * 50}ms` }} className="has-image-row">
                  <td
                    data-label="Foto"
                    className="td-image"
                    onClick={() => setViewingTerminal(t)}
                    style={{ cursor: 'pointer' }}
                    title="Ver detalles"
                  >
                    <DeviceImage modelName={t.comercial} size={48} />
                  </td>
                  <td data-label="Fabricante">{t.fabricante}</td>
                  <td data-label="Comercial" style={{ fontWeight: 600 }}>{t.comercial}</td>
                  <td data-label="Modelo" style={{ color: 'var(--text-secondary)' }}>{t.modelo || '-'}</td>
                  <td data-label="IMEI 1" style={{ fontFamily: 'monospace' }}>{t.imei1}</td>
                  <td data-label="Team">
                    <span className={`badge ${teamConfig.badgeClass}`}>{teamConfig.label}</span>
                  </td>
                  <td data-label="Handler Actual">{t.status === 'Prestado' ? t.current_handler : '-'}</td>
                  <td data-label="Estado">
                    <span className={`badge ${t.status}`}>{t.status}</span>
                  </td>
                  {isAdmin && (
                    <td data-label="Acciones">
                      <div className="actions-cell">
                        <button className="action-btn edit" onClick={() => openEditForm(t)} title="Editar">
                          <Edit2 size={16} />
                        </button>
                        <button className="action-btn delete" onClick={() => openDeleteDialog(t)} title="Eliminar">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {isFormOpen && (
        <TerminalForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={handleFormSubmit}
          initialData={editingTerminal}
        />
      )}

      {isDeleteOpen && deletingTerminal && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Eliminar Terminal"
          message={`¿Estás seguro que deseas eliminar el terminal ${deletingTerminal.comercial} (IMEI: ${deletingTerminal.imei1})? Esta acción no se puede deshacer.`}
          confirmText="Eliminar"
          type="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}

      <DeviceDetailsModal 
        isOpen={!!viewingTerminal} 
        onClose={() => setViewingTerminal(null)} 
        terminal={viewingTerminal} 
      />
    </div>
  );
}
