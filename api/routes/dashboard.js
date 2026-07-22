import { Router } from 'express';
import { supabase } from '../_supabase.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const team = req.query.team; // 'PC', 'IMS', 'ALL'

    let termQuery = supabase.from('terminals').select('*', { count: 'exact', head: true });
    let termAvailQuery = supabase.from('terminals').select('*', { count: 'exact', head: true }).eq('status', 'Disponible');
    let termLentQuery = supabase.from('terminals').select('*', { count: 'exact', head: true }).eq('status', 'Prestado');

    let simQuery = supabase.from('sim_cards').select('*', { count: 'exact', head: true });
    let simAvailQuery = supabase.from('sim_cards').select('*', { count: 'exact', head: true }).eq('status', 'Disponible');
    let simLentQuery = supabase.from('sim_cards').select('*', { count: 'exact', head: true }).eq('status', 'Prestado');

    let empQuery = supabase.from('employees').select('*', { count: 'exact', head: true }).eq('active', 1);

    if (team && team !== 'ALL') {
      termQuery = termQuery.eq('team', team);
      termAvailQuery = termAvailQuery.eq('team', team);
      termLentQuery = termLentQuery.eq('team', team);

      simQuery = simQuery.eq('team', team);
      simAvailQuery = simAvailQuery.eq('team', team);
      simLentQuery = simLentQuery.eq('team', team);

      empQuery = empQuery.eq('team', team);
    }

    const [{ count: termTotal }, { count: termAvail }, { count: termLent }] = await Promise.all([
      termQuery, termAvailQuery, termLentQuery
    ]);

    const [{ count: simTotal }, { count: simAvail }, { count: simLent }] = await Promise.all([
      simQuery, simAvailQuery, simLentQuery
    ]);

    const { count: empCount } = await empQuery;

    // Global totals for comparison
    const { count: globalTermTotal } = await supabase.from('terminals').select('*', { count: 'exact', head: true });
    const { count: globalSimTotal } = await supabase.from('sim_cards').select('*', { count: 'exact', head: true });

    // ── Recent activity (last 30 logs, then filter by team) ──
    const { data: recentLogs, error: logsError } = await supabase
      .from('assignment_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(30);
      
    if (logsError) throw logsError;

    let parsedLogs = (recentLogs || []).map((log) => ({
      ...log,
      item_detail: typeof log.item_detail === 'string' ? JSON.parse(log.item_detail) : log.item_detail,
    }));

    if (team && team !== 'ALL') {
      const { data: teamEmps } = await supabase.from('employees').select('name').eq('team', team);
      const teamEmpNames = new Set((teamEmps || []).map(e => (e.name || '').trim().toLowerCase()));

      parsedLogs = parsedLogs.filter(log => {
        const empName = (log.employee || '').trim().toLowerCase();
        const itemTeam = log.item_detail?.team;
        return teamEmpNames.has(empName) || itemTeam === team;
      });
    }

    parsedLogs = parsedLogs.slice(0, 10);

    let termDataQuery = supabase.from('terminals').select('fabricante');
    if (team && team !== 'ALL') {
      termDataQuery = termDataQuery.eq('team', team);
    }
    const { data: terminalsData } = await termDataQuery;

    const brandsCount = {};
    if (terminalsData) {
      terminalsData.forEach(t => {
        const brand = t.fabricante || 'Otros';
        brandsCount[brand] = (brandsCount[brand] || 0) + 1;
      });
    }
    const brandDistribution = Object.keys(brandsCount)
      .map(name => ({ name, value: brandsCount[name] }))
      .sort((a, b) => b.value - a.value);

    res.json({
      terminals: {
        total: termTotal ?? 0,
        available: termAvail ?? 0,
        lent: termLent ?? 0,
        globalTotal: globalTermTotal ?? 0,
      },
      simcards: {
        total: simTotal ?? 0,
        available: simAvail ?? 0,
        lent: simLent ?? 0,
        globalTotal: globalSimTotal ?? 0,
      },
      recent_activity: parsedLogs,
      employees: {
        total: empCount ?? 0,
      },
      brandDistribution,
    });
  } catch (err) {
    console.error('[Dashboard] Error:', err.message);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

export default router;
