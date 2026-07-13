import { initDatabase, dbRun, dbGet } from './server/database.js';

async function test() {
  await initDatabase();
  try {
    const item_type = 'Terminal';
    const item_id = 1;
    const notes = 'Test';
    let item = dbGet('SELECT * FROM terminals WHERE id = ?', [item_id]);
    const previousHandler = item.current_handler;

    dbRun(
      `UPDATE terminals SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri', ubicacion = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      ['En oficina', item_id]
    );

    const logResult = dbRun(
      `INSERT INTO assignment_logs (item_type, item_id, action, employee, notes, item_detail)
       VALUES (?, ?, 'Devolución', ?, ?, ?)`,
      [item_type, item_id, previousHandler || 'Unknown', notes, JSON.stringify(item)]
    );

    console.log('Success!', logResult);
  } catch (e) {
    console.error('Test Error:', e);
  }
}
test();
