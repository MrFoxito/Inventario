import { Router } from 'express';
import { supabase } from '../supabase.js';
import { generateToken, verifyToken } from '../middleware/auth.js';

const router = Router();

// Universal password for all non-admin accounts (as requested by user)
const UNIVERSAL_PASSWORD = 'password';

// ── POST /api/auth/login ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Admin Backdoor
    if (email.toLowerCase() === 'miguelalvizuri7@gmail.com' && password === 'Losmickijr123') {
      const token = generateToken({ name: 'Administrador General', role: 'Admin', email });
      return res.json({ token, user: { name: 'Administrador General', role: 'Admin', email } });
    }

    // Look for employee (case-insensitive in Supabase using ilike)
    const { data: employee, error } = await supabase
      .from('employees')
      .select('*')
      .ilike('email', email.trim())
      .single();
    
    if (error || !employee) {
      return res.status(401).json({ error: 'Credenciales inválidas o usuario no registrado' });
    }

    if (password !== UNIVERSAL_PASSWORD) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Define role (All employees in the database are Viewers)
    const role = 'Viewer';

    const user = {
      name: employee.name,
      role: role,
      email: employee.email
    };

    const token = generateToken(user);
    res.json({ token, user });

  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Error interno del servidor al procesar el login' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────
// Get current logged-in user profile
router.get('/me', verifyToken, (req, res) => {
  res.json({ user: req.user });
});

export default router;
