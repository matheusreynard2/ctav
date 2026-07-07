-- Migração (PostgreSQL): adiciona o suporte a arquivo morto/histórico de acolhidos.
-- Cria as colunas "arquivado" e "arquivado_em" na tabela acolhidos.
-- É idempotente: em bancos que já possuem as colunas, não altera nada.
-- Em banco novo, o Hibernate (generation=update) também cria as colunas
-- automaticamente ao subir a API; este script cobre bancos de produção existentes.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhidos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'acolhidos' AND column_name = 'arquivado'
    ) THEN
      ALTER TABLE public.acolhidos
        ADD COLUMN arquivado boolean NOT NULL DEFAULT false;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'acolhidos' AND column_name = 'arquivado_em'
    ) THEN
      ALTER TABLE public.acolhidos
        ADD COLUMN arquivado_em timestamp NULL;
    END IF;
  END IF;
END $$;
