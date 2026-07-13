import { Router } from 'express';
import { supabase } from '../supabase.js';

const router = Router();

// ── GET /api/employees — List all active employees ──────────────────
router.get('/', async (_req, res) => {
  try {
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('active', 1)
      .order('name', { ascending: true });
      
    if (empError) throw empError;

    // Fetch assignments for counts
    const { data: terminals, error: termError } = await supabase
      .from('terminals')
      .select('current_handler')
      .eq('status', 'Prestado');

    const { data: sims, error: simError } = await supabase
      .from('sim_cards')
      .select('current_handler')
      .eq('status', 'Prestado');

    if (termError) throw termError;
    if (simError) throw simError;

    const termCounts = {};
    terminals.forEach(t => {
      termCounts[t.current_handler] = (termCounts[t.current_handler] || 0) + 1;
    });

    const simCounts = {};
    sims.forEach(s => {
      simCounts[s.current_handler] = (simCounts[s.current_handler] || 0) + 1;
    });

    const result = employees.map(e => ({
      ...e,
      term_count: termCounts[e.name] || 0,
      sim_count: simCounts[e.name] || 0
    }));

    res.json(result);
  } catch (err) {
    console.error('[Employees] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// ── GET /api/employees/:id — Get single employee ────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json(data);
  } catch (err) {
    console.error('[Employees] Get error:', err.message);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// ── POST /api/employees — Create employee ───────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, phone } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Employee name is required' });
    }

    // Check for duplicate name
    const { data: existing } = await supabase
      .from('employees')
      .select('*')
      .eq('name', name.trim())
      .single();

    if (existing) {
      if (existing.active === 0) {
        // Reactivate
        const { data: reactivated, error } = await supabase
          .from('employees')
          .update({ 
            active: 1, 
            email: email || existing.email, 
            phone: phone || existing.phone 
          })
          .eq('id', existing.id)
          .select()
          .single();
          
        if (error) throw error;
        return res.status(201).json(reactivated);
      }
      return res.status(400).json({ error: 'An employee with this name already exists' });
    }

    const { data: created, error } = await supabase
      .from('employees')
      .insert([{ name: name.trim(), email: email || null, phone: phone || null }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(created);
  } catch (err) {
    console.error('[Employees] Create error:', err.message);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// ── PUT /api/employees/:id — Update employee ────────────────────────
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, email, phone } = req.body;

    const { data: updated, error } = await supabase
      .from('employees')
      .update({ name, email, phone })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    res.json(updated);
  } catch (err) {
    console.error('[Employees] Update error:', err.message);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// ── DELETE /api/employees/:id — Soft delete (deactivate) ────────────
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    const { error } = await supabase
      .from('employees')
      .update({ active: 0 })
      .eq('id', id);

    if (error) throw error;
    res.json({ message: 'Employee deactivated successfully', id });
  } catch (err) {
    console.error('[Employees] Delete error:', err.message);
    res.status(500).json({ error: 'Failed to deactivate employee' });
  }
});

export default router;
