-- Migração one-shot (PostgreSQL): renomeia tabela e relacionamento Paciente → Acolhido.
-- Execute antes de subir a API após atualizar o código, se o banco ainda usa os nomes antigos.
-- Em banco novo (sem tabela pacientes), este script não altera nada.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'pacientes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhidos'
  ) THEN
    ALTER TABLE public.pacientes RENAME TO acolhidos;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'paciente_remedio'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'paciente_remedio' AND column_name = 'paciente_id'
    ) THEN
      ALTER TABLE public.paciente_remedio RENAME COLUMN paciente_id TO acolhido_id;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'acolhido_remedio'
    ) THEN
      ALTER TABLE public.paciente_remedio RENAME TO acolhido_remedio;
    END IF;
  END IF;
END $$;
