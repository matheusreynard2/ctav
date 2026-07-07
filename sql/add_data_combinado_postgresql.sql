-- Migração (PostgreSQL): adiciona a coluna "data_combinado" na tabela combinados.
-- Usada para os tipos de combinado que NÃO são ressocialização.
-- Idempotente: não altera nada se a coluna já existir.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'combinados'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'combinados' AND column_name = 'data_combinado'
  ) THEN
    ALTER TABLE public.combinados ADD COLUMN data_combinado date NULL;
  END IF;
END $$;
