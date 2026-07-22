import { Router } from 'express';
import ExcelJS from 'exceljs';
import { supabase } from '../_supabase.js';

const router = Router();

// ── GET /api/export/excel — Export inventory as Excel ────────────────
router.get('/excel', async (req, res) => {
  try {
    const targetTeam = req.query.team || 'ALL'; // 'PC', 'IMS', 'ALL'

    const { data: terminals, error: termError } = await supabase.from('terminals').select('*').order('id', { ascending: true });
    if (termError) throw termError;

    const { data: simCards, error: simError } = await supabase.from('sim_cards').select('*').order('id', { ascending: true });
    if (simError) throw simError;

    const { data: employees } = await supabase.from('employees').select('*');
    const empTeamMap = new Map();
    (employees || []).forEach(e => {
      if (e.name) empTeamMap.set(e.name.trim().toLowerCase(), e.team);
    });

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
        cell.font = { color: { argb: 'FF059669' }, bold: true }; // Emerald 600
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
      } else {
        cell.font = { color: { argb: 'FFDC2626' }, bold: true }; // Red 600
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
      }
    };

    // Helper to build a terminal sheet
    const buildTerminalSheet = (sheetName, list) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { header: 'Fabricante', key: 'fabricante', width: 15 },
        { header: 'Comercial', key: 'comercial', width: 25 },
        { header: 'Modelo', key: 'modelo', width: 18 },
        { header: 'Serial number', key: 'serial_number', width: 22 },
        { header: 'IMEI 1', key: 'imei1', width: 22 },
        { header: 'Team Orig.', key: 'team', width: 12 },
        { header: 'Responsible', key: 'responsible', width: 20 },
        { header: 'Current handler', key: 'current_handler', width: 22 },
        { header: 'Ubicación', key: 'ubicacion', width: 30 },
        { header: 'Estado', key: 'estado', width: 15 },
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      (list || []).forEach((t) => {
        const isAvail = t.status === 'Disponible';
        const estado = isAvail ? 'Disponible' : 'Ocupado';
        const ubicacion = isAvail ? 'Oficinas Huawei' : `En manos de ${t.current_handler || 'Desconocido'}`;
        
        const row = sheet.addRow({
          fabricante: t.fabricante || '',
          comercial: t.comercial || '',
          modelo: t.modelo || '',
          serial_number: t.serial_number || '',
          imei1: t.imei1 || '',
          team: t.team === 'PC' ? 'PS' : (t.team || 'PS'),
          responsible: t.responsible || '',
          current_handler: t.current_handler || '',
          ubicacion: ubicacion,
          estado: estado,
        });

        row.eachCell(cell => {
          cell.border = thinBorder;
          cell.numFmt = '@';
        });
        applyStatusStyle(row.getCell('estado'), isAvail);
      });
    };

    // Helper to build a SIM card sheet
    const buildSimSheet = (sheetName, list) => {
      const sheet = workbook.addWorksheet(sheetName);
      sheet.columns = [
        { header: 'ICCID', key: 'iccid', width: 25 },
        { header: 'IMSI', key: 'imsi', width: 20 },
        { header: 'MSISDN (Línea)', key: 'msisdn', width: 20 },
        { header: 'TIPO / PLAN', key: 'tipo_plan', width: 20 },
        { header: 'Team Orig.', key: 'team', width: 12 },
        { header: 'Owner', key: 'owner', width: 18 },
        { header: 'Current handler', key: 'current_handler', width: 25 },
        { header: 'Procedencia', key: 'procedencia', width: 15 },
        { header: 'Observacion', key: 'observacion', width: 25 },
        { header: 'Ubicación', key: 'ubicacion', width: 25 },
        { header: 'Estado', key: 'estado', width: 15 },
      ];

      sheet.getRow(1).eachCell((cell) => {
        cell.fill = headerFill;
        cell.font = headerFont;
        cell.border = thinBorder;
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      });

      (list || []).forEach((s) => {
        const isAvail = s.status === 'Disponible';
        const estado = isAvail ? 'Disponible' : 'Ocupado';
        
        const row = sheet.addRow({
          iccid: s.iccid || '',
          imsi: s.imsi || '',
          msisdn: s.msisdn || '',
          tipo_plan: s.tipo_plan || '',
          team: s.team === 'PC' ? 'PS' : (s.team || 'PS'),
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
        applyStatusStyle(row.getCell('estado'), isAvail);
      });
    };

    if (targetTeam === 'PC') {
      // PS Specific Report
      const termPS = (terminals || []).filter(t => t.team === 'PC');
      const simPS = (simCards || []).filter(s => s.team === 'PC');

      // External items borrowed by PS employees from other teams
      const extTermPS = (terminals || []).filter(t => 
        t.team !== 'PC' && 
        t.status === 'Prestado' && 
        empTeamMap.get((t.current_handler || '').trim().toLowerCase()) === 'PC'
      );
      const extSimPS = (simCards || []).filter(s => 
        s.team !== 'PC' && 
        s.status === 'Prestado' && 
        empTeamMap.get((s.current_handler || '').trim().toLowerCase()) === 'PC'
      );

      buildTerminalSheet('Terminales PS', termPS);
      buildSimSheet('SIM Cards PS', simPS);
      if (extTermPS.length > 0 || extSimPS.length > 0) {
        buildTerminalSheet('Term. Externos (Préstamo PS)', extTermPS);
        buildSimSheet('SIMs Externas (Préstamo PS)', extSimPS);
      }

    } else if (targetTeam === 'IMS') {
      // IMS Specific Report
      const termIMS = (terminals || []).filter(t => t.team === 'IMS');
      const simIMS = (simCards || []).filter(s => s.team === 'IMS');

      // External items borrowed by IMS employees from other teams
      const extTermIMS = (terminals || []).filter(t => 
        t.team !== 'IMS' && 
        t.status === 'Prestado' && 
        empTeamMap.get((t.current_handler || '').trim().toLowerCase()) === 'IMS'
      );
      const extSimIMS = (simCards || []).filter(s => 
        s.team !== 'IMS' && 
        s.status === 'Prestado' && 
        empTeamMap.get((s.current_handler || '').trim().toLowerCase()) === 'IMS'
      );

      buildTerminalSheet('Terminales IMS', termIMS);
      buildSimSheet('SIM Cards IMS', simIMS);
      if (extTermIMS.length > 0 || extSimIMS.length > 0) {
        buildTerminalSheet('Term. Externos (Préstamo IMS)', extTermIMS);
        buildSimSheet('SIMs Externas (Préstamo IMS)', extSimIMS);
      }

    } else {
      // Global Consolidated Report
      buildTerminalSheet('Terminales', terminals);
      buildSimSheet('SIMCARDS', simCards);
    }

    // ── Send Response ──
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    const labelTeam = targetTeam === 'PC' ? 'PS' : targetTeam;
    const filename = `inventario_${labelTeam}_${dateStr}.xlsx`;

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
