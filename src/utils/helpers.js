/**
 * Utility helper functions for the Inventario Móvil application
 */

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  let safeDateStr = dateStr;
  if (safeDateStr.includes(' ') && !safeDateStr.includes('T')) {
    safeDateStr = safeDateStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(safeDateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  let safeDateStr = dateStr;
  if (safeDateStr.includes(' ') && !safeDateStr.includes('T')) {
    safeDateStr = safeDateStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(safeDateStr);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function getStatusBadgeClass(status) {
  if (!status) return 'badge-info';
  const s = status.toLowerCase();
  if (s === 'disponible' || s === 'available' || s === 'activa') return 'badge-success';
  if (s === 'prestado' || s === 'lent' || s === 'asignada') return 'badge-warning';
  if (s === 'inactivo' || s === 'inactive' || s === 'baja') return 'badge-danger';
  return 'badge-info';
}

export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}

export function getRelativeTime(dateStr) {
  if (!dateStr) return '';
  const now = new Date();
  let safeDateStr = dateStr;
  if (safeDateStr.includes(' ') && !safeDateStr.includes('T')) {
    safeDateStr = safeDateStr.replace(' ', 'T') + 'Z';
  }
  const d = new Date(safeDateStr);
  if (isNaN(d.getTime())) return '';
  const diffMs = now - d;
  if (diffMs < 0) return 'hace unos segundos';
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return 'hace unos segundos';
  if (diffMin < 2) return 'hace 1 minuto';
  if (diffMin < 60) return `hace ${diffMin} minutos`;
  if (diffHour < 2) return 'hace 1 hora';
  if (diffHour < 24) return `hace ${diffHour} horas`;
  if (diffDay < 2) return 'hace 1 día';
  if (diffDay < 7) return `hace ${diffDay} días`;
  if (diffWeek < 2) return 'hace 1 semana';
  if (diffWeek < 5) return `hace ${diffWeek} semanas`;
  if (diffMonth < 2) return 'hace 1 mes';
  return `hace ${diffMonth} meses`;
}
