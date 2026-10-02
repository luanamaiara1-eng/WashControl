-- Permite cadastrar veículos identificados apenas pelo modelo/nome, sem placa.
ALTER TABLE public.vehicles
  ALTER COLUMN plate DROP NOT NULL;
