import { initDatabase, dbRun, getDb, saveDatabase, dbGet } from './server/database.js';

async function run() {
  await initDatabase();
  
  const existing = dbGet("SELECT * FROM employees WHERE name = 'Miguel Arroyo'");
  if (!existing) {
    dbRun("INSERT INTO employees (name, email, phone, active) VALUES ('Miguel Arroyo', null, null, 1)");
    saveDatabase();
    console.log("Miguel Arroyo added successfully!");
  } else {
    console.log("Miguel Arroyo already exists.");
  }
}

run();
