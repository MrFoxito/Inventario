import { initDatabase, dbRun, getDb, saveDatabase, dbAll } from './server/database.js';

async function run() {
  await initDatabase();
  
  const logs = dbAll("SELECT * FROM assignment_logs WHERE item_id = 1 AND item_type = 'Terminal' AND action = 'Devolución' ORDER BY id ASC");
  
  if (logs.length > 1) {
    for (let i = 0; i < logs.length - 1; i++) {
      dbRun("DELETE FROM assignment_logs WHERE id = ?", [logs[i].id]);
    }
    console.log(`Deleted ${logs.length - 1} duplicate(s) for OPPO A16.`);
  } else {
    console.log('No duplicates found or only one exists.');
  }
  
  saveDatabase();
}

run();
