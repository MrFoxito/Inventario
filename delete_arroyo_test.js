import { initDatabase, dbRun, getDb, saveDatabase, dbAll, dbGet } from './server/database.js';

async function run() {
  await initDatabase();
  
  // Find the SIM card by MSISDN or ICCID
  const simNum = '56939382776';
  const sim = dbGet("SELECT * FROM sim_cards WHERE msisdn = ? OR iccid = ?", [simNum, simNum]);
  
  if (sim) {
    console.log(`Found SIM Card ID: ${sim.id}`);
    
    // Find the log
    const logs = dbAll(
      "SELECT * FROM assignment_logs WHERE item_id = ? AND item_type = 'SIM' AND employee = 'Miguel Arroyo' ORDER BY id DESC LIMIT 1",
      [sim.id]
    );
    
    if (logs.length > 0) {
      dbRun("DELETE FROM assignment_logs WHERE id = ?", [logs[0].id]);
      console.log(`Deleted loan log ID: ${logs[0].id}`);
    } else {
      console.log('No loan log found for Miguel Arroyo for this SIM.');
    }
    
    // Revert SIM card status
    dbRun("UPDATE sim_cards SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri' WHERE id = ?", [sim.id]);
    console.log("Reverted SIM Card status to 'Disponible'.");
    
  } else {
    // Maybe try finding by just searching logs directly
    console.log(`Could not find SIM Card with number ${simNum} in DB.`);
    
    // Let's delete the log by checking the JSON item_detail if needed
    const allSimLogs = dbAll("SELECT * FROM assignment_logs WHERE item_type = 'SIM' AND employee = 'Miguel Arroyo'");
    for (const log of allSimLogs) {
      if (log.item_detail && log.item_detail.includes(simNum)) {
        dbRun("DELETE FROM assignment_logs WHERE id = ?", [log.id]);
        console.log(`Deleted loan log ID: ${log.id} via JSON scan.`);
        
        // Try parsing JSON to get ID
        try {
          const detail = JSON.parse(log.item_detail);
          dbRun("UPDATE sim_cards SET status = 'Disponible', current_handler = 'Miguel Angel Alvizuri' WHERE id = ?", [detail.id]);
          console.log(`Reverted SIM Card status to 'Disponible' (ID: ${detail.id}).`);
        } catch (e) {}
      }
    }
  }
  
  saveDatabase();
}

run();
