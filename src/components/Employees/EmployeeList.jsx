import { useState, useEffect } from 'react';
import { getEmployees, createEmployee, updateEmployee, deleteEmployee } from '../../utils/api';
import { useToast } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { Users, Plus, Search, Edit2, ShieldOff, CheckCircle } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import ConfirmDialog from '../shared/ConfirmDialog';
import { TEAMS, getTeamConfig, canSeeAllTeams } from '../../utils/constants';
import './Employees.css';
import '../Terminals/Terminals.css'; // Reusing premium table styling

const TEAM_FILTER_ALL = 'ALL';

export default function EmployeeList() {
  const { user, isAdmin } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [teamFilter, setTeamFilter] = useState(TEAM_FILTER_ALL);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);

  const { addToast } = useToast();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      addToast('Error', err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const canSeeAll = canSeeAllTeams(user);

  const filteredEmployees = employees.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.email && e.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTeam = canSeeAll
      ? (teamFilter === TEAM_FILTER_ALL || e.team === teamFilter)
      : e.team === user?.team;
    return matchesSearch && matchesTeam;
  });

  const handleFormSubmit = async (data) => {
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, data);
        addToast('Éxito', 'Datos de empleado actualizados', 'success');
      } else {
        await createEmployee(data);
        addToast('Éxito', 'Empleado registrado correctamente', 'success');
      }
      setIsFormOpen(false);
      fetchEmployees();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const handleDeactivateConfirm = async () => {
    try {
      await deleteEmployee(deactivatingEmployee.id);
      addToast('Éxito', 'Empleado desactivado', 'success');
      setIsDeleteOpen(false);
      fetchEmployees();
    } catch (err) {
      addToast('Error', err.message, 'error');
    }
  };

  const openNewForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEditForm = (emp) => {
    setEditingEmployee(emp);
    setIsFormOpen(true);
  };

  const openDeleteDialog = (emp) => {
    if (emp.term_count > 0 || emp.sim_count > 0) {
      addToast('No permitido', 'Este empleado aún tiene equipos asignados. Debe devolverlos antes de desactivar la cuenta.', 'warning');
      return;
    }
    setDeactivatingEmployee(emp);
    setIsDeleteOpen(true);
  };

  return (
    <div className="employees-container">
      <div className="terminals-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2>Gestión de Personal</h2>
          <p>Administra los datos de tu equipo y verifica sus activos</p>
        </div>
        {isAdmin && (
          <div className="page-header-actions">
            <button className="btn btn-primary" onClick={openNewForm}>
              <Plus size={18} /> Nuevo Empleado
            </button>
          </div>
        )}
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <span><Search size={18} /></span>
          <input 
            type="text" 
            className="search-input" 
            placeholder="Buscar por nombre o correo..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="empty-state">
            <span><Users size={48} /></span>
            <h3>No se encontraron empleados</h3>
            <p>Ajusta el filtro de búsqueda o agrega uno nuevo.</p>
          </div>
        ) : (
          <table className="premium-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Team</th>
                <th>Correo Electrónico</th>
                <th>Teléfono</th>
                <th style={{ textAlign: 'center' }}>Equipos Asignados</th>
                <th>Estado</th>
                {isAdmin && <th style={{ width: '80px' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp, index) => {
                const totalEquipos = (emp.term_count || 0) + (emp.sim_count || 0);
                const teamConfig = getTeamConfig(emp.team);
                return (
                  <tr key={emp.id} style={{ animationDelay: `${index * 50}ms` }}>
                    <td data-label="Nombre Completo" style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td data-label="Team">
                      <span className={`badge ${teamConfig.badgeClass}`}>{teamConfig.label}</span>
                    </td>
                    <td data-label="Correo Electrónico" style={{ color: 'var(--text-secondary)' }}>{emp.email || '-'}</td>
                    <td data-label="Teléfono">{emp.phone || '-'}</td>
                    <td data-label="Equipos Asignados" style={{ textAlign: 'center', fontWeight: 600, color: totalEquipos > 0 ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                      {totalEquipos}
                    </td>
                    <td data-label="Estado">
                      <span className="badge Disponible">
                        Activo
                      </span>
                    </td>
                    {isAdmin && (
                      <td data-label="Acciones">
                        <div className="actions-cell">
                          <button className="action-btn edit" onClick={() => openEditForm(emp)} title="Editar Datos">
                            <Edit2 size={16} />
                          </button>
                          <button className="action-btn delete" onClick={() => openDeleteDialog(emp)} title="Desactivar Cuenta">
                            <ShieldOff size={16} />
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
        <EmployeeForm 
          isOpen={isFormOpen} 
          onClose={() => setIsFormOpen(false)} 
          onSubmit={handleFormSubmit}
          initialData={editingEmployee}
        />
      )}

      {isDeleteOpen && deactivatingEmployee && (
        <ConfirmDialog
          isOpen={isDeleteOpen}
          title="Desactivar Empleado"
          message={`¿Estás seguro que deseas desactivar a ${deactivatingEmployee.name}? Ya no podrá iniciar sesión. (Podrás reactivarlo volviéndolo a crear).`}
          confirmText="Desactivar"
          type="danger"
          onConfirm={handleDeactivateConfirm}
          onCancel={() => setIsDeleteOpen(false)}
        />
      )}
    </div>
  );
}
