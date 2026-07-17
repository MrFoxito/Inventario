import { Router } from 'express';
import { supabase } from '../_supabase.js';

const router = Router();

// ── GET /api/reports/weekly — Generate weekly report ────────────────
router.get('/weekly', async (_req, res) => {
  try {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fromDate = weekAgo.toISOString();
    const toDate = now.toISOString();

    // Get logs from last 7 days
    const { data: logs, error: logsError } = await supabase
      .from('assignment_logs')
      .select('*')
      .gte('created_at', fromDate)
      .order('created_at', { ascending: true });

    if (logsError) throw logsError;

    // Parse item details
    const parsedLogs = (logs || []).map((log) => ({
      ...log,
      item_detail: typeof log.item_detail === 'string' ? JSON.parse(log.item_detail) : (log.item_detail || {}),
    }));

    // Separate loans and returns
    const loans = parsedLogs.filter((l) => l.action === 'Préstamo');
    const returns = parsedLogs.filter((l) => l.action === 'Devolución');

    // Group loans by employee
    const loansByEmployee = {};
    for (const loan of loans) {
      if (!loansByEmployee[loan.employee]) loansByEmployee[loan.employee] = [];
      loansByEmployee[loan.employee].push(loan);
    }

    // Group returns by employee
    const returnsByEmployee = {};
    for (const ret of returns) {
      if (!returnsByEmployee[ret.employee]) returnsByEmployee[ret.employee] = [];
      returnsByEmployee[ret.employee].push(ret);
    }

    // Build report text
    let reportText = '2. Inventory Updates (Terminals & SIMcards)\n\n';

    if (loans.length === 0 && returns.length === 0) {
      reportText += 'No inventory updates or testing assignments were made this week.\n\n';
    } else {
      reportText += 'This week, the inventory of terminals and SIM cards was updated and assigned to the team for testing activities:\n\n';

      // Loans section
      for (const [employee, empLoans] of Object.entries(loansByEmployee)) {
        reportText += `${employee}:\n`;
        for (const loan of empLoans) {
          const d = loan.item_detail;
          if (loan.item_type === 'Terminal') {
            reportText += `Assigned Terminal: ${d.comercial || 'N/A'} (Model: ${d.modelo || 'N/A'}, SN: ${d.serial_number || 'N/A'}, IMEI: ${d.imei1 || 'N/A'})\n`;
          } else {
            reportText += `Assigned SIM: ${d.msisdn || d.iccid || 'N/A'} (ICCID: ${d.iccid || 'N/A'})\n`;
          }
        }
        reportText += '\n';
      }

      // Returns section
      for (const [employee, empReturns] of Object.entries(returnsByEmployee)) {
        const returnedNames = empReturns
          .map((r) => {
            const name = r.item_detail?.comercial || r.item_detail?.msisdn || r.item_detail?.iccid || 'N/A';
            return r.item_type === 'SIM' ? `SIM Card ${name}` : name;
          })
          .join(', ');
        reportText += `Note: ${employee} returned his previous equipment (${returnedNames}), which are now successfully returned to the general inventory.\n\n`;
      }
    }

    // Available inventory
    const { data: availableTerminals, error: termError } = await supabase
      .from('terminals')
      .select('*')
      .eq('status', 'Disponible')
      .order('comercial', { ascending: true });

    if (termError) throw termError;

    reportText += 'General Inventory (Available):\n';
    if (!availableTerminals || availableTerminals.length === 0) {
      reportText += 'No terminals currently available.\n';
    } else {
      for (const t of availableTerminals) {
        reportText += `${t.comercial} (IMEI: ${t.imei1})\n`;
      }
    }

    res.json({
      report_text: reportText,
      period: {
        from: fromDate,
        to: toDate,
      },
      stats: {
        loans: loans.length,
        returns: returns.length,
      },
    });
  } catch (err) {
    console.error('[Reports] Weekly error:', err.message);
    res.status(500).json({ error: 'Failed to generate weekly report' });
  }
});

export default router;
