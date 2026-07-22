import { useState } from 'react';
import { getWeeklyReport } from '../../utils/api';
import { copyToClipboard, formatDateShort } from '../../utils/helpers';
import { useToast } from '../../App';
import { useAuth } from '../../contexts/AuthContext';
import { TEAMS, canSeeAllTeams } from '../../utils/constants';
import { LineChart, Sparkles, Calendar, ArrowUpRight, ArrowDownLeft, Copy } from 'lucide-react';
import './Reports.css';

const TEAM_FILTER_ALL = 'ALL';

export default function WeeklyReport() {
  const { user } = useAuth();
  const canSeeAll = canSeeAllTeams(user);

  const [teamFilter, setTeamFilter] = useState(canSeeAll ? TEAM_FILTER_ALL : (user?.team || 'PC'));
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { addToast } = useToast();

  const handleGenerate = async () => {
    setLoading(true);
    setReportData(null);
    setCopied(false);
    
    try {
      await new Promise(r => setTimeout(r, 600));
      const activeTeam = canSeeAll ? teamFilter : (user?.team || 'PC');
      const data = await getWeeklyReport(activeTeam);
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
      <div className="terminals-header" style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2>Generador de Reportes</h2>
          <p>Extrae automáticamente todos los movimientos de los últimos 7 días y formatea el reporte semanal listo para enviar.</p>
        </div>

        {canSeeAll && (
          <div className="status-filters" style={{ margin: 0 }}>
            <button className={`filter-btn ${teamFilter === TEAM_FILTER_ALL ? 'active' : ''}`} onClick={() => { setTeamFilter(TEAM_FILTER_ALL); setReportData(null); }}>Todos</button>
            {TEAMS.filter(t => t.value !== 'BOTH').map(t => (
              <button key={t.value} className={`filter-btn ${teamFilter === t.value ? 'active' : ''}`} onClick={() => { setTeamFilter(t.value); setReportData(null); }}>{t.label}</button>
            ))}
          </div>
        )}
      </div>

      <div className="report-action-card">
        <div className="report-action-info">
          <div className="icon-wrapper">
            <LineChart size={32} />
          </div>
          <div className="report-action-text">
            <h3>Reporte Semanal {teamFilter === 'PC' ? 'PS' : (teamFilter === 'IMS' ? 'IMS' : 'Global')}</h3>
            <p>Genera un resumen detallado de préstamos, devoluciones y stock disponible {teamFilter !== 'ALL' ? `para el área ${teamFilter === 'PC' ? 'PS' : teamFilter}` : 'global'}.</p>
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
              className={`btn ${copied ? 'btn-success' : 'btn-primary'}`} 
              onClick={handleCopy}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {copied ? (
                <>¡Copiado al Portapapeles!</>
              ) : (
                <><Copy size={18} /> Copiar Texto del Reporte</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
