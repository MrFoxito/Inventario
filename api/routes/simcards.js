import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// ── GET /api/simcards — List all SIM cards ──────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, handler } = req.query;
    let query = supabase.from('sim_cards').select('*').order('id', { ascending: true });

    if (status) query = query.eq('status', status);
    if (handler) query = query.eq('current_handler', handler);

    if (search) {
      query = query.or(`iccid.ilike.%${search}%,imsi.ilike.%${search}%,msisdn.ilike.%${search}%,tipo_plan.ilike.%${search}%,owner.ilike.%${search}%,current_handler.ilike.%${search}%,procedencia.ilike.%${search}%,observacion.ilike.%${search}%`);
    }

    const { data: simCards, error } = await query;
    if (error) throw error;
    
    res.json(simCards);
  } catch (err) {
    console.error('[SIMCards] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch SIM cards' });
  }
});

// ── GET /api/simcards/:id — Get single SIM card ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: sim, error } = await supabase
      .from('sim_cards')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !sim) {
      return res.status(404).json({ error: 'SIM card not found' });
    }
    res.json(sim);
  } catch (err) {
    console.error('[SIMCards] Get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch SIM card' });
  }
});

// ── POST /api/simcards — Create SIM card ────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { iccid, imsi, msisdn, tipo_plan, owner, current_handler, procedencia, observacion, estado_actual, status } = req.body;

    const { data: created, error } = await supabase
      .from('sim_cards')
      .insert([{
        iccid: iccid || null,
        imsi: imsi || null,
        msisdn: msisdn || null,
        tipo_plan: tipo_plan || null,
        owner: owner || 'Miguel Angel Alvizuri',
        current_handler: current_handler || 'Miguel Angel Alvizuri',
        procedencia: procedencia || null,
        observacion: observacion || null,
        estado_actual: estado_actual || null,
        status: status || 'Disponible'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(created);
  } catch (err) {
    console.error('[SIMCards] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create SIM card' });
  }
});

// ── PUT /api/simcards/:id — Update SIM card ─────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { iccid, imsi, msisdn, tipo_plan, owner, current_handler, procedencia, observacion, estado_actual, status } = req.body;

    const { data: updated, error } = await supabase
      .from('sim_cards')
      .update({
        iccid, imsi, msisdn, tipo_plan,
        owner, current_handler, procedencia,
        observacion, estado_actual, status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'SIM card not found' });

    res.json(updated);
  } catch (err) {
    console.error('[SIMCards] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update SIM card' });
  }
});

// ── DELETE /api/simcards/:id — Delete SIM card ──────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { data: existing, error: getErr } = await supabase
      .from('sim_cards')
      .select('status, current_handler')
      .eq('id', id)
      .single();

    if (getErr || !existing) return res.status(404).json({ error: 'SIM card not found' });

    if (existing.status === 'Prestado') {
      return res.status(400).json({
        error: 'SIM card is currently lent out. Return it before deleting.',
        warning: true,
        current_handler: existing.current_handler,
      });
    }

    const { error: delErr } = await supabase.from('sim_cards').delete().eq('id', id);
    if (delErr) throw delErr;

    res.json({ message: 'SIM card deleted successfully', id });
  } catch (err) {
    console.error('[SIMCards] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete SIM card' });
  }
});

export default router;
