import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// GET /api/dashboard/stats
router.get('/stats', async (_req, res) => {
  try {
    // ── Terminal stats ──
    const { count: termTotal } = await supabase.from('terminals').select('*', { count: 'exact', head: true });
    const { count: termAvail } = await supabase.from('terminals').select('*', { count: 'exact', head: true }).eq('status', 'Disponible');
    const { count: termLent } = await supabase.from('terminals').select('*', { count: 'exact', head: true }).eq('status', 'Prestado');

    // ── SIM card stats ──
    const { count: simTotal } = await supabase.from('sim_cards').select('*', { count: 'exact', head: true });
    const { count: simAvail } = await supabase.from('sim_cards').select('*', { count: 'exact', head: true }).eq('status', 'Disponible');
    const { count: simLent } = await supabase.from('sim_cards').select('*', { count: 'exact', head: true }).eq('status', 'Prestado');

    // ── Employee count ──
    const { count: empCount } = await supabase.from('employees').select('*', { count: 'exact', head: true }).eq('active', 1);

    // ── Recent activity (last 10 logs) ──
    const { data: recentLogs, error: logsError } = await supabase
      .from('assignment_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
      
    if (logsError) throw logsError;

    const parsedLogs = (recentLogs || []).map((log) => ({
      ...log,
      item_detail: typeof log.item_detail === 'string' ? JSON.parse(log.item_detail) : log.item_detail,
    }));

    const { data: terminalsData } = await supabase.from('terminals').select('fabricante');
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
      },
      simcards: {
        total: simTotal ?? 0,
        available: simAvail ?? 0,
        lent: simLent ?? 0,
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
