import { Router } from 'express';
import { supabase } from '../_supabase.js';

const router = Router();

// ── GET /api/logs — Get all assignment logs ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { item_type, item_id, employee, from, to, action, team } = req.query;
    let query = supabase.from('assignment_logs').select('*').order('created_at', { ascending: false });

    if (item_type) query = query.eq('item_type', item_type);
    if (item_id) query = query.eq('item_id', item_id);
    if (employee) query = query.eq('employee', employee);
    if (action) query = query.eq('action', action);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data: logs, error } = await query;
    if (error) throw error;

    // Parse item_detail JSON for each log
    let parsed = logs.map((log) => ({
      ...log,
      item_detail: typeof log.item_detail === 'string' ? JSON.parse(log.item_detail) : log.item_detail,
    }));

    if (team && team !== 'ALL') {
      const { data: teamEmps } = await supabase.from('employees').select('name').eq('team', team);
      const teamEmpNames = new Set((teamEmps || []).map(e => (e.name || '').trim().toLowerCase()));

      parsed = parsed.filter(log => {
        const empName = (log.employee || '').trim().toLowerCase();
        const itemTeam = log.item_detail?.team;
        return teamEmpNames.has(empName) || itemTeam === team;
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error('[Logs] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch assignment logs' });
  }
});

export default router;
