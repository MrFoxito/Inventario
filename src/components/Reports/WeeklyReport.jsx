import { useState } from 'react';
import { getWeeklyReport } from '../../utils/api';
import { copyToClipboard, formatDateShort } from '../../utils/helpers';
import { useToast } from '../../App';
import { LineChart, Sparkles, Calendar, ArrowUpRight, ArrowDownLeft, CheckCircle, Copy } from 'lucide-react';
import './Reports.css';

export default function WeeklyReport() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setReportData(null);
    setCopied(false);
    
    try {
      // Small artificial delay to make the "magic" feel substantial
      await new Promise(r => setTimeout(r, 800));
      const data = await getWeeklyReport();
      setReportData(data);
      addToast('Éxito', 'Reporte semanal generado', 'success');
    } catch (err) {
      addToast('Error', 'No se pudo generar el reporte: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!reportData) return;
    
    const success = await copyToClipboard(reportData.report_text);
    if (success) {
      setCopied(true);
      addToast('Copiado', 'Reporte copiado al portapapeles', 'success');
      setTimeout(() => setCopied(false), 2000);
    } else {
      addToast('Error', 'No se pudo copiar', 'error');
    }
  };

  return (
    <div className="reports-container">
      <div className="terminals-header" style={{ marginBottom: '2rem' }}>
        <div>
          <h2>Generador de Reportes</h2>
          <p>Extrae automáticamente todos los movimientos de los últimos 7 días y formatea el reporte semanal listo para enviar.</p>
        </div>
      </div>

      <div className="report-action-card">
        <div className="report-action-info">
          <div className="icon-wrapper">
            <LineChart size={32} />
          </div>
          <div className="report-action-text">
            <h3>Reporte Semanal de Inventario</h3>
            <p>Genera un resumen detallado de los préstamos, devoluciones y el estado actual de todos los equipos.</p>
          </div>
        </div>
        <div className="generator-section" style={{ margin: 0 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="loading-crystal" style={{ width: '24px', height: '24px' }}></div>
              <p style={{ color: 'var(--accent-primary)', fontWeight: 600, margin: 0 }}>Analizando logs y generando reporte...</p>
            </div>
          ) : (
            <button className="btn btn-primary" onClick={handleGenerate} style={{ padding: '0.75rem 1.5rem' }}>
              <Sparkles size={18} /> Generar Reporte Semanal
            </button>
          )}
        </div>
      </div>

      {reportData && !loading && (
        <div className="report-result-card">
          <div className="report-meta">
            <div className="period-badge">
              <Calendar size={16} /> Periodo: {formatDateShort(reportData.period.from)} al {formatDateShort(reportData.period.to)}
            </div>
            
            <div className="report-stats">
              <span className="stat-badge loans" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowUpRight size={14} /> {reportData.stats.loans} Préstamos
              </span>
              <span className="stat-badge returns" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ArrowDownLeft size={14} /> {reportData.stats.returns} Devoluciones
              </span>
            </div>
          </div>

          <div className="report-text-container">
            <pre>{reportData.report_text}</pre>
          </div>

          <div className="copy-report-wrapper">
            <button 
              className={`btn-primary ${copied ? 'success' : ''}`} 
              onClick={handleCopy}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                padding: '1rem 2rem', 
                fontSize: '1.1rem',
                ...(copied ? { background: 'var(--accent-success)' } : {})
              }}
            >
              {copied ? <><CheckCircle size={20} /> Copiado exitosamente</> : <><Copy size={20} /> Copiar Reporte Completo</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
