/**
 * API client for Inventario Móvil
 * All backend endpoints are proxied under /api via Vite
 */

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) {
    let message = `Error ${res.status}`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch {
      /* ignore parse errors */
    }
    throw new Error(message);
  }
  return res;
}

/* ==============================
   Dashboard
   ============================== */

export async function getDashboardStats(team = '') {
  const query = team ? `?team=${team}` : '';
  const res = await request(`/api/dashboard/stats${query}`);
  return res.json();
}

/* ==============================
   Terminals
   ============================== */

export async function getTerminals(params = {}) {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const query = new URLSearchParams(filtered).toString();
  const res = await request(`/api/terminals${query ? '?' + query : ''}`);
  return res.json();
}

export async function getTerminal(id) {
  const res = await request(`/api/terminals/${id}`);
  return res.json();
}

export async function createTerminal(data) {
  const res = await request('/api/terminals', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateTerminal(id, data) {
  const res = await request(`/api/terminals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteTerminal(id) {
  const res = await request(`/api/terminals/${id}`, { method: 'DELETE' });
  return res.json();
}

/* ==============================
   SIM Cards
   ============================== */

export async function getSimCards(params = {}) {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const query = new URLSearchParams(filtered).toString();
  const res = await request(`/api/simcards${query ? '?' + query : ''}`);
  return res.json();
}

export async function createSimCard(data) {
  const res = await request('/api/simcards', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateSimCard(id, data) {
  const res = await request(`/api/simcards/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteSimCard(id) {
  const res = await request(`/api/simcards/${id}`, { method: 'DELETE' });
  return res.json();
}

/* ==============================
   Employees
   ============================== */

export async function getEmployees() {
  const res = await request('/api/employees');
  return res.json();
}

export async function createEmployee(data) {
  const res = await request('/api/employees', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function updateEmployee(id, data) {
  const res = await request(`/api/employees/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function deleteEmployee(id) {
  const res = await request(`/api/employees/${id}`, { method: 'DELETE' });
  return res.json();
}

/* ==============================
   Assignments
   ============================== */

export async function lendItem(data) {
  const res = await request('/api/assignments/lend', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function returnItem(data) {
  const res = await request('/api/assignments/return', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function lendItemsBulk(data) {
  const res = await request('/api/assignments/lend-bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function returnItemsBulk(data) {
  const res = await request('/api/assignments/return-bulk', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function getAssignmentEmail(logIds, lang = 'en') {
  const ids = Array.isArray(logIds) ? logIds.join(',') : logIds;
  const res = await request(`/api/assignments/email/${ids}?lang=${lang}`);
  return res.json();
}

/* ==============================
   Logs
   ============================== */

export async function getLogs(params = {}) {
  const filtered = Object.fromEntries(Object.entries(params).filter(([, v]) => v));
  const query = new URLSearchParams(filtered).toString();
  const res = await request(`/api/logs${query ? '?' + query : ''}`);
  return res.json();
}

/* ==============================
   Reports
   ============================== */

export async function getWeeklyReport() {
  const res = await request('/api/reports/weekly');
  return res.json();
}

/* ==============================
   Export
   ============================== */

export async function exportExcel() {
  const res = await fetch('/api/export/excel');
  if (!res.ok) throw new Error('Error al exportar archivo Excel');
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const disposition = res.headers.get('Content-Disposition');
  let filename = 'inventario.xlsx';
  if (disposition) {
    const match = disposition.match(/filename="?(.+?)"?$/);
    if (match) filename = match[1];
  }
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
