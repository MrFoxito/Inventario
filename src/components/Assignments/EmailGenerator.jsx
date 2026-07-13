import { useState, useEffect } from 'react';
import { getAssignmentEmail } from '../../utils/api';
import { copyToClipboard } from '../../utils/helpers';
import { useToast } from '../../App';
import { CheckCircle, Mail, Copy, Sparkles, Globe } from 'lucide-react';

export default function EmailGenerator({ logIds, onDone, isFromHistory = false }) {
  const [emailData, setEmailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [lang, setLang] = useState('es'); // Default to Spanish
  const { addToast } = useToast();

  useEffect(() => {
    async function loadEmail() {
      setLoading(true);
      try {
        const data = await getAssignmentEmail(logIds, lang);
        setEmailData(data);
      } catch (err) {
        addToast('Error', 'No se pudo generar el correo: ' + err.message, 'error');
      } finally {
        setLoading(false);
      }
    }
    if (logIds && logIds.length > 0) loadEmail();
  }, [logIds, lang]);

  const handleCopy = async () => {
    if (!emailData) return;
    
    const success = await copyToClipboard(emailData.email_text);
    if (success) {
      setCopied(true);
      addToast('Copiado', 'Correo copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      addToast('Error', 'No se pudo copiar al portapapeles', 'error');
    }
  };

  const handleOpenClient = () => {
    if (!emailData) return;
    const subject = lang === 'es' ? "Confirmación de Préstamo de Equipo" : "Equipment Loan Confirmation";
    const body = encodeURIComponent(emailData.email_text);
    const to = emailData.employee_email || '';
    window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${body}`;
  };

  return (
    <div className="email-generator-container" style={{ position: 'relative' }}>
      {!isFromHistory && (
        <>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={24} /> Préstamo Registrado Exitosamente
          </h3>
          <p style={{ color: 'var(--text-secondary)' }}>
            Generamos el texto para que puedas notificar al usuario:
          </p>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-color)', borderRadius: '8px', padding: '4px', border: '1px solid var(--border-color)' }}>
          <button 
            type="button"
            onClick={() => setLang('es')}
            style={{ 
              border: 'none', background: lang === 'es' ? 'var(--primary-color)' : 'transparent', 
              color: lang === 'es' ? '#fff' : 'var(--text-color)', 
              padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            ES
          </button>
          <button 
            type="button"
            onClick={() => setLang('en')}
            style={{ 
              border: 'none', background: lang === 'en' ? 'var(--primary-color)' : 'transparent', 
              color: lang === 'en' ? '#fff' : 'var(--text-color)', 
              padding: '4px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' 
            }}
          >
            EN
          </button>
        </div>
      </div>

      <div className="email-preview" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s', minHeight: '200px' }}>
        {loading && !emailData ? (
           <div className="shimmer-card" style={{ height: '100%' }}></div>
        ) : (
          emailData?.email_text
        )}
      </div>

      <div className="email-actions">
        {onDone && (
          <button className="btn-secondary" onClick={onDone}>
            {isFromHistory ? 'Cerrar' : 'Finalizar'}
          </button>
        )}
        <button 
          className="btn-secondary" 
          onClick={handleOpenClient}
          title="Abrir Outlook/Mail"
          disabled={loading}
        >
          <Mail size={18} style={{ marginRight: '8px' }} /> Abrir en Cliente
        </button>
        <button 
          className={`btn-primary ${copied ? 'success' : ''}`} 
          onClick={handleCopy}
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', ...(copied ? { background: 'var(--accent-success)' } : {}) }}
          disabled={loading}
        >
          {copied ? <><CheckCircle size={18} /> Copiado</> : <><Copy size={18} /> Copiar Correo</>}
        </button>
      </div>
    </div>
  );
}
