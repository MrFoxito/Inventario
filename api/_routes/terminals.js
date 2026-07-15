import { Router } from 'express';
import { supabase } from '../_supabase.js';

const router = Router();

// ── GET /api/terminals — List all terminals ─────────────────────────
router.get('/', async (req, res) => {
  try {
    const { status, search, handler } = req.query;
    let query = supabase.from('terminals').select('*').order('id', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }
    if (handler) {
      query = query.eq('current_handler', handler);
    }
    if (search) {
      query = query.or(`fabricante.ilike.%${search}%,comercial.ilike.%${search}%,modelo.ilike.%${search}%,serial_number.ilike.%${search}%,imei1.ilike.%${search}%`);
    }

    const { data: terminals, error } = await query;
    if (error) throw error;
    
    res.json(terminals);
  } catch (err) {
    console.error('[Terminals] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch terminals' });
  }
});

// ── GET /api/terminals/:id — Get single terminal ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data: terminal, error } = await supabase
      .from('terminals')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error || !terminal) {
      return res.status(404).json({ error: 'Terminal not found' });
    }
    res.json(terminal);
  } catch (err) {
    console.error('[Terminals] Get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch terminal' });
  }
});

// ── POST /api/terminals — Create terminal ───────────────────────────
router.post('/', async (req, res) => {
  try {
    const { fabricante, comercial, modelo, serial_number, imei1, responsible, current_handler, ubicacion, status } = req.body;

    if (!fabricante || !comercial || !imei1) {
      return res.status(400).json({ error: 'Fields fabricante, comercial, and imei1 are required' });
    }

    const { data: created, error } = await supabase
      .from('terminals')
      .insert([{
        fabricante,
        comercial,
        modelo: modelo || null,
        serial_number: serial_number || null,
        imei1,
        responsible: responsible || 'Miguel Angel Alvizuri',
        current_handler: current_handler || 'Miguel Angel Alvizuri',
        ubicacion: ubicacion || null,
        status: status || 'Disponible'
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(created);
  } catch (err) {
    console.error('[Terminals] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create terminal' });
  }
});

// ── PUT /api/terminals/:id — Update terminal ────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { fabricante, comercial, modelo, serial_number, imei1, responsible, current_handler, ubicacion, status } = req.body;

    const { data: updated, error } = await supabase
      .from('terminals')
      .update({
        fabricante, comercial, modelo, serial_number, imei1,
        responsible, current_handler, ubicacion, status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    if (!updated) return res.status(404).json({ error: 'Terminal not found' });
    
    res.json(updated);
  } catch (err) {
    console.error('[Terminals] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update terminal' });
  }
});

// ── DELETE /api/terminals/:id — Delete terminal ─────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { data: existing, error: getErr } = await supabase
      .from('terminals')
      .select('status, current_handler')
      .eq('id', id)
      .single();
      
    if (getErr || !existing) return res.status(404).json({ error: 'Terminal not found' });

    if (existing.status === 'Prestado') {
      return res.status(400).json({
        error: 'Terminal is currently lent out. Return it before deleting.',
        warning: true,
        current_handler: existing.current_handler,
      });
    }

    const { error: delErr } = await supabase.from('terminals').delete().eq('id', id);
    if (delErr) throw delErr;

    res.json({ message: 'Terminal deleted successfully', id });
  } catch (err) {
    console.error('[Terminals] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to delete terminal' });
  }
});

export default router;
