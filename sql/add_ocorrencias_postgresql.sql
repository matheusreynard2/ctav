-- Migração (PostgreSQL): tabela "ocorrencias" + relação N:N com acolhidos.
-- Uma ocorrência pode envolver um ou mais acolhidos. Ao excluir um acolhido,
-- os vínculos dele são removidos (join table) mas a ocorrência permanece na
-- lista para consulta/edição (nomes preservados no snapshot acolhidos_nomes).
-- Idempotente. Também migra bancos vindos da versão 1:1 (coluna acolhido_id).

-- 1) Tabela principal (esquema atual, sem colunas legadas).
CREATE TABLE IF NOT EXISTS public.ocorrencias (
    id                BIGSERIAL PRIMARY KEY,
    usuario_id        BIGINT       NOT NULL REFERENCES public.usuarios (id),
    acolhidos_nomes   VARCHAR(500) NULL,
    titulo            VARCHAR(200) NOT NULL,
    descricao         VARCHAR(1000) NOT NULL,
    data_ocorrencia   DATE         NULL,
    criado_em         TIMESTAMP    NULL,
    atualizado_em     TIMESTAMP    NULL
);

ALTER TABLE public.ocorrencias
    ADD COLUMN IF NOT EXISTS acolhidos_nomes VARCHAR(500) NULL;

CREATE INDEX IF NOT EXISTS idx_ocorrencias_usuario
    ON public.ocorrencias (usuario_id);

-- 2) Tabela de junção N:N entre ocorrências e acolhidos.
CREATE TABLE IF NOT EXISTS public.ocorrencia_acolhidos (
    ocorrencia_id BIGINT NOT NULL REFERENCES public.ocorrencias (id) ON DELETE CASCADE,
    acolhido_id   BIGINT NOT NULL REFERENCES public.acolhidos (id) ON DELETE CASCADE,
    PRIMARY KEY (ocorrencia_id, acolhido_id)
);

CREATE INDEX IF NOT EXISTS idx_ocorrencia_acolhidos_ocorrencia
    ON public.ocorrencia_acolhidos (ocorrencia_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_acolhidos_acolhido
    ON public.ocorrencia_acolhidos (acolhido_id);

-- 3) Migração de bancos vindos da versão 1:1: copia acolhido_id para a tabela
--    N:N, preenche o snapshot de nomes e remove as colunas/índices legados.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ocorrencias'
      AND column_name = 'acolhido_id'
  ) THEN
    INSERT INTO public.ocorrencia_acolhidos (ocorrencia_id, acolhido_id)
    SELECT o.id, o.acolhido_id
    FROM public.ocorrencias o
    WHERE o.acolhido_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'ocorrencias'
      AND column_name = 'acolhido_nome'
  ) THEN
    UPDATE public.ocorrencias o
    SET acolhidos_nomes = o.acolhido_nome
    WHERE o.acolhidos_nomes IS NULL AND o.acolhido_nome IS NOT NULL;
  END IF;

  DROP INDEX IF EXISTS public.idx_ocorrencias_usuario_acolhido;
  ALTER TABLE public.ocorrencias DROP COLUMN IF EXISTS acolhido_id;
  ALTER TABLE public.ocorrencias DROP COLUMN IF EXISTS acolhido_nome;
END $$;
