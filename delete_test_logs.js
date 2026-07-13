import { initDatabase, dbRun, getDb, saveDatabase, dbAll } from './server/database.js';

async function run() {
  await initDatabase();
  
  // Find recent logs for OPPO A16 by Miguel Angel Alvizuri
  const logs = dbAll("SELECT * FROM assignment_logs WHERE item_id = 1 AND item_type = 'Terminal' AND employee = 'Miguel Angel Alvizuri' ORDER BY id DESC LIMIT 4");
  
  if (logs.length > 0) {
    for (const log of logs) {
      dbRun("DELETE FROM assignment_logs WHERE id = ?", [log.id]);
      console.log(`Deleted log ID ${log.id} (${log.action})`);
    }
  } else {
    console.log('No recent logs found to delete.');
  }
  
  // Ensure the terminal is available
  dbRun("UPDATE terminals SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri' WHERE id = 1");
  
  saveDatabase();
}

run();
