-- Migração (PostgreSQL): tabela "responsaveis" + relação com acolhidos.
-- Todo acolhido tem um responsável legal. O responsável tem CRUD próprio e
-- pode estar vinculado a um ou mais acolhidos (a coluna acolhidos.responsavel_id
-- é anulável para não quebrar registros legados; a obrigatoriedade é garantida
-- pela regra de negócio da API). Idempotente: pode ser rodado mais de uma vez.

-- 1) Tabela de responsáveis.
CREATE TABLE IF NOT EXISTS public.responsaveis (
    id             BIGSERIAL PRIMARY KEY,
    usuario_id     BIGINT       NOT NULL REFERENCES public.usuarios (id),
    nome           VARCHAR(120) NOT NULL,
    rg             VARCHAR(20)  NULL,
    cpf            VARCHAR(14)  NULL,
    endereco       VARCHAR(200) NULL,
    bairro         VARCHAR(100) NULL,
    cidade         VARCHAR(100) NULL,
    estado         VARCHAR(2)   NULL,
    cep            VARCHAR(9)   NULL,
    celular        VARCHAR(20)  NULL,
    conveniado     BOOLEAN      NOT NULL DEFAULT FALSE,
    criado_em      TIMESTAMP    NULL,
    atualizado_em  TIMESTAMP    NULL
);

-- Unicidade de CPF por usuário (multi-tenant), quando informado.
CREATE UNIQUE INDEX IF NOT EXISTS uk_responsaveis_usuario_cpf
    ON public.responsaveis (usuario_id, cpf);

CREATE INDEX IF NOT EXISTS idx_responsaveis_usuario_nome
    ON public.responsaveis (usuario_id, nome);

-- 2) Coluna de vínculo em acolhidos (anulável para registros antigos).
ALTER TABLE public.acolhidos
    ADD COLUMN IF NOT EXISTS responsavel_id BIGINT NULL;

-- Chave estrangeira acolhidos.responsavel_id -> responsaveis.id (idempotente).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'acolhidos'
      AND constraint_name = 'fk_acolhidos_responsavel'
  ) THEN
    ALTER TABLE public.acolhidos
        ADD CONSTRAINT fk_acolhidos_responsavel
        FOREIGN KEY (responsavel_id) REFERENCES public.responsaveis (id);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_acolhidos_responsavel
    ON public.acolhidos (responsavel_id);
