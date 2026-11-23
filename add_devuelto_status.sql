-- Ejecuta este script en el SQL Editor de tu panel de Supabase:
-- https://supabase.com/dashboard/project/xdnyvirfcrtfrzzkpill/sql/new

ALTER TABLE terminals DROP CONSTRAINT IF EXISTS terminals_status_check;
ALTER TABLE terminals ADD CONSTRAINT terminals_status_check CHECK (status IN ('Disponible', 'Prestado', 'Devuelto'));

ALTER TABLE sim_cards DROP CONSTRAINT IF EXISTS sim_cards_status_check;
ALTER TABLE sim_cards ADD CONSTRAINT sim_cards_status_check CHECK (status IN ('Disponible', 'Prestado', 'Devuelto'));
