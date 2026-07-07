-- Migração (PostgreSQL): cria a tabela de motivos (adesão/desistência) e os
-- vínculos no acolhido. Em banco novo, o Hibernate (generation=update) também
-- cria isso ao subir a API; este script cobre bancos de produção existentes.
-- É idempotente.

-- 1) Tabela de motivos
CREATE TABLE IF NOT EXISTS public.motivos (
    id            BIGSERIAL PRIMARY KEY,
    usuario_id    BIGINT      NOT NULL REFERENCES public.usuarios (id),
    categoria     VARCHAR(20) NOT NULL,
    nome          VARCHAR(120) NOT NULL,
    descricao     VARCHAR(255),
    criado_em     TIMESTAMP,
    atualizado_em TIMESTAMP,
    CONSTRAINT uk_motivos_usuario_categoria_nome UNIQUE (usuario_id, categoria, nome)
);

CREATE INDEX IF NOT EXISTS idx_motivos_usuario_categoria
    ON public.motivos (usuario_id, categoria);

-- 2) Colunas de vínculo no acolhido
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhidos'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'acolhidos' AND column_name = 'motivo_adesao_id'
    ) THEN
      ALTER TABLE public.acolhidos ADD COLUMN motivo_adesao_id BIGINT
        REFERENCES public.motivos (id);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'acolhidos' AND column_name = 'motivo_desistencia_id'
    ) THEN
      ALTER TABLE public.acolhidos ADD COLUMN motivo_desistencia_id BIGINT
        REFERENCES public.motivos (id);
    END IF;
  END IF;
END $$;
