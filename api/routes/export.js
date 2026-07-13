import { Router } from 'express';
import ExcelJS from 'exceljs';
import { supabase } from '../supabase.js';

const router = Router();

// ── GET /api/export/excel — Export inventory as Excel ────────────────
router.get('/excel', async (_req, res) => {
  try {
    const { data: terminals, error: termError } = await supabase.from('terminals').select('*').order('id', { ascending: true });
    if (termError) throw termError;

    const { data: simCards, error: simError } = await supabase.from('sim_cards').select('*').order('id', { ascending: true });
    if (simError) throw simError;

    const workbook = new ExcelJS.Workbook();
    
    // Style configurations
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
    const headerFont = { color: { argb: 'FFFFFFFF' }, bold: true };
    const thinBorder = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
    
    // Helper to apply green/red colors for status
    const applyStatusStyle = (cell, isAvailable) => {
      if (isAvailable) {
        cell.font = { color: { argb: 'FF059669' }, bold: true }; // Emerald 600 (Green)
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }; // Light green bg
      } else {
        cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red 600
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } }; // Light red bg
      }
    };

    // ── Build Terminales sheet ──
    const termSheet = workbook.addWorksheet('Terminales');
    termSheet.columns = [
      { header: 'Fabricante', key: 'fabricante', width: 15 },
      { header: 'Comercial', key: 'comercial', width: 25 },
      { header: 'Modelo', key: 'modelo', width: 18 },
      { header: 'Serial number', key: 'serial_number', width: 22 },
      { header: 'IMEI 1', key: 'imei1', width: 22 },
      { header: 'Responsible', key: 'responsible', width: 20 },
      { header: 'Current handler', key: 'current_handler', width: 20 },
      { header: 'Ubicación', key: 'ubicacion', width: 30 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    // Style Terminal Headers
    termSheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    (terminals || []).forEach((t) => {
      const isAvail = t.status === 'Disponible';
      const estado = isAvail ? 'Disponible' : 'Ocupado';
      const ubicacion = isAvail ? 'Oficinas Huawei' : `En manos de ${t.current_handler || 'Desconocido'}`;
      
      const row = termSheet.addRow({
        fabricante: t.fabricante || '',
        comercial: t.comercial || '',
        modelo: t.modelo || '',
        serial_number: t.serial_number || '',
        imei1: t.imei1 || '',
        responsible: t.responsible || '',
        current_handler: t.current_handler || '',
        ubicacion: ubicacion,
        estado: estado,
      });

      row.eachCell(cell => {
        cell.border = thinBorder;
        cell.numFmt = '@';
      });
      // Apply color rule to 'Estado'
      applyStatusStyle(row.getCell('estado'), isAvail);
    });

    // ── Build SIMCARDS sheet ──
    const simSheet = workbook.addWorksheet('SIMCARDS');
    simSheet.columns = [
      { header: 'ICCID', key: 'iccid', width: 25 },
      { header: 'IMSI', key: 'imsi', width: 20 },
      { header: 'MSISDN (Línea)', key: 'msisdn', width: 20 },
      { header: 'TIPO / PLAN', key: 'tipo_plan', width: 20 },
      { header: 'Owner', key: 'owner', width: 15 },
      { header: 'Current handler', key: 'current_handler', width: 25 },
      { header: 'Procedencia', key: 'procedencia', width: 15 },
      { header: 'Observacion', key: 'observacion', width: 25 },
      { header: 'Ubicación', key: 'ubicacion', width: 25 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    simSheet.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = thinBorder;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    (simCards || []).forEach((s) => {
      const isAvail = s.status === 'Disponible';
      const estado = isAvail ? 'Disponible' : 'Ocupado';
      
      const row = simSheet.addRow({
        iccid: s.iccid || '',
        imsi: s.imsi || '',
        msisdn: s.msisdn || '',
        tipo_plan: s.tipo_plan || '',
        owner: s.owner || '',
        current_handler: s.current_handler || '',
        procedencia: s.procedencia || '',
        observacion: s.observacion || '',
        ubicacion: s.estado_actual || '',
        estado: estado,
      });

      row.eachCell(cell => {
        cell.border = thinBorder;
        cell.numFmt = '@';
      });
      // Apply color rule to 'Estado'
      applyStatusStyle(row.getCell('estado'), isAvail);
    });

    // ── Send Response ──
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const filename = `inventario_${dateStr}.xlsx`;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error('[Export] Excel error:', err.message);
    res.status(500).json({ error: 'Failed to export excel' });
  }
});

export default router;
