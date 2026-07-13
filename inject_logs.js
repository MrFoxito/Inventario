import { initDatabase, dbRun, getDb, saveDatabase, dbGet } from './server/database.js';

async function run() {
  await initDatabase();
  
  const esau = "Esau Gutierrez Tantaruna";
  // Dates in UTC to match the system behavior (Peru is UTC-5)
  // Jueves 2 de Julio 14:03 -> 19:03 UTC
  const date1 = "2026-07-02 19:03:00"; 
  // Jueves 2 de Julio 16:30 -> 21:30 UTC
  const date2 = "2026-07-02 21:30:00"; 

  // Helper to inject log
  const injectTerminalReturn = (imei, date) => {
    const term = dbGet('SELECT * FROM terminals WHERE imei1 = ?', [String(imei)]);
    if (term) {
      dbRun(
        "INSERT INTO assignment_logs (item_type, item_id, action, employee, notes, item_detail, created_at) VALUES (?, ?, 'Devolución', ?, 'Devuelto a inventario general (Registro Manual)', ?, ?)",
        ['Terminal', term.id, esau, JSON.stringify(term), date]
      );
      dbRun("UPDATE terminals SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri' WHERE id = ?", [term.id]);
    } else {
      console.log('Terminal not found:', imei);
    }
  };

  const injectSimReturn = (iccid, date) => {
    const sim = dbGet('SELECT * FROM sim_cards WHERE iccid = ?', [String(iccid)]);
    if (sim) {
      dbRun(
        "INSERT INTO assignment_logs (item_type, item_id, action, employee, notes, item_detail, created_at) VALUES (?, ?, 'Devolución', ?, 'Devuelto a inventario general (Registro Manual)', ?, ?)",
        ['SIM', sim.id, esau, JSON.stringify(sim), date]
      );
      dbRun("UPDATE sim_cards SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri' WHERE id = ?", [sim.id]);
    } else {
      console.log('SIM not found:', iccid);
    }
  };

  // Group 1
  injectTerminalReturn('869584070001733', date1);
  injectTerminalReturn('868667070001653', date1);
  injectSimReturn('89511710120715786478', date1);

  // Group 2
  injectTerminalReturn('358922374834516', date2);
  injectSimReturn('89511710120715786478', date2); 

  saveDatabase();
  console.log('Logs successfully injected!');
}

run();
