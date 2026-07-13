import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'server', 'data', 'inventory.db');

async function run() {
  const SQL = await initSqlJs();
  const buffer = fs.readFileSync(DB_PATH);
  const db = new SQL.Database(buffer);

  db.run("UPDATE employees SET email = 'miguel.alvizuri@huawei.com' WHERE name = 'Miguel Angel Alvizuri'");

  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  console.log('Database updated successfully.');
}

run();
