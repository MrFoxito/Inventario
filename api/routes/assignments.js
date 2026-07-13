import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// ── POST /api/assignments/lend — Lend an item to an employee ────────
router.post('/lend', async (req, res) => {
  try {
    const { item_type, item_id, employee, notes } = req.body;

    if (!item_type || !item_id || !employee) {
      return res.status(400).json({ error: 'item_type, item_id, and employee are required' });
    }

    if (!['Terminal', 'SIM'].includes(item_type)) {
      return res.status(400).json({ error: "item_type must be 'Terminal' or 'SIM'" });
    }

    let item;
    const locationText = `En manos de ${employee}`;

    if (item_type === 'Terminal') {
      const { data, error } = await supabase.from('terminals').select('*').eq('id', item_id).single();
      if (error || !data) return res.status(404).json({ error: 'Terminal not found' });
      item = data;

      if (item.status === 'Prestado') {
        return res.status(400).json({ error: `Terminal is already lent to ${item.current_handler}` });
      }

      await supabase.from('terminals').update({
        status: 'Prestado',
        current_handler: employee,
        ubicacion: locationText,
        updated_at: new Date().toISOString()
      }).eq('id', item_id);

      const { data: updatedItem } = await supabase.from('terminals').select('*').eq('id', item_id).single();
      item = updatedItem;
    } else {
      const { data, error } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
      if (error || !data) return res.status(404).json({ error: 'SIM card not found' });
      item = data;

      if (item.status === 'Prestado') {
        return res.status(400).json({ error: `SIM card is already lent to ${item.current_handler}` });
      }

      await supabase.from('sim_cards').update({
        status: 'Prestado',
        current_handler: employee,
        estado_actual: locationText,
        updated_at: new Date().toISOString()
      }).eq('id', item_id);

      const { data: updatedItem } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
      item = updatedItem;
    }

    // Create assignment log
    const { data: logEntry, error: logError } = await supabase.from('assignment_logs').insert([{
      item_type,
      item_id,
      action: 'Préstamo',
      employee,
      notes: notes || null,
      item_detail: JSON.stringify(item)
    }]).select().single();

    if (logError) throw logError;

    logEntry.item_detail = JSON.parse(logEntry.item_detail);
    res.status(201).json(logEntry);
  } catch (err) {
    console.error('[Assignments] Lend error:', err.message);
    res.status(500).json({ error: 'Failed to process lending' });
  }
});

// ── POST /api/assignments/return — Return an item ───────────────────
router.post('/return', async (req, res) => {
  try {
    const { item_type, item_id, notes } = req.body;

    if (!item_type || !item_id) {
      return res.status(400).json({ error: 'item_type and item_id are required' });
    }

    if (!['Terminal', 'SIM'].includes(item_type)) {
      return res.status(400).json({ error: "item_type must be 'Terminal' or 'SIM'" });
    }

    let item;
    let previousHandler;
    const defaultLocation = 'En oficina Huawei - Disponible';

    if (item_type === 'Terminal') {
      const { data, error } = await supabase.from('terminals').select('*').eq('id', item_id).single();
      if (error || !data) return res.status(404).json({ error: 'Terminal not found' });
      
      item = data;
      previousHandler = item.current_handler;

      await supabase.from('terminals').update({
        status: 'Disponible',
        current_handler: 'Miguel Angel Alvizuri',
        ubicacion: defaultLocation,
        updated_at: new Date().toISOString()
      }).eq('id', item_id);

      const { data: updatedItem } = await supabase.from('terminals').select('*').eq('id', item_id).single();
      item = updatedItem;
    } else {
      const { data, error } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
      if (error || !data) return res.status(404).json({ error: 'SIM card not found' });
      
      item = data;
      previousHandler = item.current_handler;

      await supabase.from('sim_cards').update({
        status: 'Disponible',
        current_handler: 'Miguel Angel Alvizuri',
        estado_actual: defaultLocation,
        updated_at: new Date().toISOString()
      }).eq('id', item_id);

      const { data: updatedItem } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
      item = updatedItem;
    }

    // Create assignment log
    const { data: logEntry, error: logError } = await supabase.from('assignment_logs').insert([{
      item_type,
      item_id,
      action: 'Devolución',
      employee: previousHandler || 'Unknown',
      notes: notes || null,
      item_detail: JSON.stringify(item)
    }]).select().single();

    if (logError) throw logError;

    logEntry.item_detail = JSON.parse(logEntry.item_detail);
    res.status(201).json(logEntry);
  } catch (err) {
    console.error('[Assignments] Return error:', err.message);
    res.status(500).json({ error: 'Failed to process return' });
  }
});

// ── GET /api/assignments/email/:logId — Generate email text ─────────
router.get('/email/:logId', async (req, res) => {
  try {
    const logIds = String(req.params.logId).split(',').map(Number).filter(Boolean);
    if (logIds.length === 0) return res.status(400).json({ error: 'Invalid log IDs' });
    
    const { data: logs, error: logsError } = await supabase
      .from('assignment_logs')
      .select('*')
      .in('id', logIds);
      
    if (logsError) throw logsError;
    if (!logs || logs.length === 0) return res.status(404).json({ error: 'Assignment logs not found' });

    const employee = logs[0].employee;
    const { data: emp } = await supabase.from('employees').select('email').eq('name', employee).single();

    const lang = req.query.lang === 'es' ? 'es' : 'en';
    
    let equipmentList = '';
    logs.forEach((log, index) => {
      const detail = log.item_detail ? JSON.parse(log.item_detail) : {};
      if (log.item_type === 'Terminal') {
        equipmentList += lang === 'es'
          ? `--- Ítem ${index + 1} (Terminal) ---\nFabricante: ${detail.fabricante || 'N/A'}\nNombre Comercial: ${detail.comercial || 'N/A'}\nModelo: ${detail.modelo || 'N/A'}\nNúmero de Serie: ${detail.serial_number || 'N/A'}\nIMEI 1: ${detail.imei1 || 'N/A'}\n\n`
          : `--- Item ${index + 1} (Terminal) ---\nBrand: ${detail.fabricante || 'N/A'}\nCommercial Name: ${detail.comercial || 'N/A'}\nModel: ${detail.modelo || 'N/A'}\nSerial Number: ${detail.serial_number || 'N/A'}\nIMEI 1: ${detail.imei1 || 'N/A'}\n\n`;
      } else {
        equipmentList += lang === 'es'
          ? `--- Ítem ${index + 1} (SIM Card) ---\nPlan: ${detail.tipo_plan || 'N/A'}\nLínea (MSISDN): ${detail.msisdn || 'N/A'}\nICCID: ${detail.iccid || 'N/A'}\nIMSI: ${detail.imsi || 'N/A'}\n\n`
          : `--- Item ${index + 1} (SIM Card) ---\nPlan: ${detail.tipo_plan || 'N/A'}\nMSISDN (Line): ${detail.msisdn || 'N/A'}\nICCID: ${detail.iccid || 'N/A'}\nIMSI: ${detail.imsi || 'N/A'}\n\n`;
      }
    });

    const emailText = lang === 'es'
      ? `Estimado(a) ${employee},\n\nEste correo confirma el préstamo del siguiente equipo móvil del inventario para tu uso:\n\n${equipmentList}Se adjunta el inventario actualizado.\n\nSaludos cordiales,\nMiguel Angel Alvizuri`
      : `Dear ${employee},\n\nThis email is to confirm the loan of the following mobile equipment from the inventory for your use:\n\n${equipmentList}The updated inventory is attached.\n\nBest regards,\nMiguel Angel Alvizuri`;

    res.json({ email_text: emailText, employee_email: emp?.email || null });
  } catch (err) {
    console.error('[Assignments] Email error:', err.message);
    res.status(500).json({ error: 'Failed to generate email' });
  }
});

// ── POST /api/assignments/lend-bulk ──────────────────────────────────
router.post('/lend-bulk', async (req, res) => {
  try {
    const { items, employee, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0 || !employee) {
      return res.status(400).json({ error: 'items array and employee are required' });
    }

    const logIds = [];
    const locationText = `En manos de ${employee}`;

    for (const reqItem of items) {
      const { item_type, item_id } = reqItem;
      let item;

      if (item_type === 'Terminal') {
        const { data } = await supabase.from('terminals').select('*').eq('id', item_id).single();
        if (!data || data.status === 'Prestado') continue;
        
        await supabase.from('terminals').update({
          status: 'Prestado',
          current_handler: employee,
          ubicacion: locationText,
          updated_at: new Date().toISOString()
        }).eq('id', item_id);
        
        const { data: updatedItem } = await supabase.from('terminals').select('*').eq('id', item_id).single();
        item = updatedItem;
      } else if (item_type === 'SIM') {
        const { data } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
        if (!data || data.status === 'Prestado') continue;
        
        await supabase.from('sim_cards').update({
          status: 'Prestado',
          current_handler: employee,
          estado_actual: locationText,
          updated_at: new Date().toISOString()
        }).eq('id', item_id);
        
        const { data: updatedItem } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
        item = updatedItem;
      } else {
        continue;
      }

      const { data: logEntry, error: logError } = await supabase.from('assignment_logs').insert([{
        item_type,
        item_id,
        action: 'Préstamo',
        employee,
        notes: notes || null,
        item_detail: JSON.stringify(item)
      }]).select().single();

      if (logError) {
        console.error("Insert Log Error:", logError);
        return res.status(500).json({ error: 'Failed to insert log: ' + logError.message });
      }

      if (logEntry) logIds.push(logEntry.id);
    }

    res.status(201).json({ message: 'Bulk lend processed successfully', log_ids: logIds });
  } catch (err) {
    console.error('[Assignments] Bulk lend error:', err.message);
    res.status(500).json({ error: 'Failed to process bulk lending' });
  }
});

// ── POST /api/assignments/return-bulk ───────────────────────────────
router.post('/return-bulk', async (req, res) => {
  try {
    const { items, notes } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const logIds = [];
    const defaultLocation = 'En oficina Huawei - Disponible';

    for (const reqItem of items) {
      const { item_type, item_id } = reqItem;
      let item;
      let previousHandler;

      if (item_type === 'Terminal') {
        const { data } = await supabase.from('terminals').select('*').eq('id', item_id).single();
        if (!data || data.status === 'Disponible') continue;
        
        previousHandler = data.current_handler;
        await supabase.from('terminals').update({
          status: 'Disponible',
          current_handler: 'Miguel Angel Alvizuri',
          ubicacion: defaultLocation,
          updated_at: new Date().toISOString()
        }).eq('id', item_id);
        
        const { data: updatedItem } = await supabase.from('terminals').select('*').eq('id', item_id).single();
        item = updatedItem;
      } else if (item_type === 'SIM') {
        const { data } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
        if (!data || data.status === 'Disponible') continue;
        
        previousHandler = data.current_handler;
        await supabase.from('sim_cards').update({
          status: 'Disponible',
          current_handler: 'Miguel Angel Alvizuri',
          estado_actual: defaultLocation,
          updated_at: new Date().toISOString()
        }).eq('id', item_id);
        
        const { data: updatedItem } = await supabase.from('sim_cards').select('*').eq('id', item_id).single();
        item = updatedItem;
      } else {
        continue;
      }

      const { data: logEntry } = await supabase.from('assignment_logs').insert([{
        item_type,
        item_id,
        action: 'Devolución',
        employee: previousHandler || 'Unknown',
        notes: notes || null,
        item_detail: JSON.stringify(item)
      }]).select().single();

      if (logEntry) logIds.push(logEntry.id);
    }

    res.status(201).json({ message: 'Bulk return processed successfully', log_ids: logIds });
  } catch (err) {
    console.error('[Assignments] Bulk return error:', err.message);
    res.status(500).json({ error: 'Failed to process bulk returning' });
  }
});

export default router;
