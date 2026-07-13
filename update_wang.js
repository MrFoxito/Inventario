import { initDatabase, dbRun, getDb, saveDatabase, dbGet } from './server/database.js';

async function run() {
  await initDatabase();
  
  const wang = dbGet("SELECT * FROM employees WHERE name = 'Wang'");
  if (!wang) {
    dbRun("UPDATE employees SET name = 'Wang' WHERE name = 'Hehua (Howard)'");
  } else {
    dbRun("DELETE FROM employees WHERE name = 'Hehua (Howard)'");
  }
  
  dbRun("UPDATE terminals SET current_handler = 'Wang' WHERE current_handler = 'Hehua (Howard)'");
  dbRun("UPDATE sim_cards SET current_handler = 'Wang' WHERE current_handler = 'Hehua (Howard)'");
  dbRun("UPDATE assignment_logs SET employee = 'Wang' WHERE employee = 'Hehua (Howard)'");
  
  saveDatabase();
  console.log('Database successfully updated!');
}

run();
