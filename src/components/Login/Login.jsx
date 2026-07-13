import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Mail, ArrowRight, Shield } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    // En modo empleado enviamos la contraseña universal 'password'
    const loginPassword = isAdminMode ? password : 'password';
    await login(email, loginPassword);
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <div className="login-logo">
            <img src="/logo.png" alt="Logo" className="login-logo-img" />
          </div>
          <h2>Control de Activos</h2>
          <p>Sistema de Gestión de Inventario</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Correo Electrónico</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isAdminMode ? "admin@ejemplo.com" : "usuario@huawei.com"}
                required
              />
            </div>
          </div>

          {isAdminMode && (
            <div className="form-group slide-down">
              <label>Contraseña de Administrador</label>
              <div className="input-with-icon">
                <Lock size={18} className="input-icon" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary login-btn" disabled={isLoading}>
            {isLoading ? <div className="spinner-mini"></div> : (
              <>Ingresar {isAdminMode ? 'como Admin' : ''} <ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          {isAdminMode ? (
            <button className="text-btn" onClick={() => setIsAdminMode(false)}>
              Volver a ingreso de Empleados
            </button>
          ) : (
            <>
              Ingresa con tu correo Huawei o H-Partners.
              <div style={{ marginTop: '1rem' }}>
                <button className="text-btn admin-toggle-btn" onClick={() => setIsAdminMode(true)}>
                  <Shield size={14} style={{ marginRight: '4px', verticalAlign: 'text-bottom' }} /> 
                  Acceso Administrativo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
