import { initDatabase, dbRun, saveDatabase } from './server/database.js';

async function run() {
  await initDatabase();
  dbRun("UPDATE employees SET email = 'miguel.arroyo@entel.pe' WHERE name = 'Miguel Arroyo'");
  saveDatabase();
  console.log("Miguel Arroyo's email updated successfully!");
}

run();
