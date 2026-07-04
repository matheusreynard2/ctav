-- =====================================================================
-- Migracao PRODUCAO (PostgreSQL): remedios -> medicamentos
--                              acolhido_remedio -> acolhido_medicamento
--
-- Objetivo:
--   1) Copiar todos os registros de "remedios" para "medicamentos"
--      (preservando os ids, para manter os vinculos).
--   2) Copiar todos os vinculos de "acolhido_remedio" para
--      "acolhido_medicamento" (doses iniciam em 0; configure no controle
--      de administracao apos a migracao).
--   3) Remover as tabelas antigas quando a copia terminar.
--
-- PRE-REQUISITOS (obrigatorios):
--   a) Faca BACKUP do banco antes de executar.
--   b) Pare a aplicacao (nenhum processo usando o banco).
--   c) Se ainda existir "pacientes" / "paciente_remedio", rode antes:
--        sql/rename_legacy_paciente_para_acolhido_postgresql.sql
--   d) Suba a aplicacao NOVA uma vez (ou aplique o schema Hibernate) para
--      criar as tabelas vazias "medicamentos" e "acolhido_medicamento"
--      (ou "prescricoes", que sera renomeada abaixo).
--   e) Confirme que as tabelas antigas "remedios" e "acolhido_remedio"
--      ainda existem com dados em producao.
--
-- O script e idempotente: pode ser reexecutado se falhar no meio, desde
-- que as tabelas antigas ainda existam.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 0) Preparacao: renomear "prescricoes" -> "acolhido_medicamento" se
--    a aplicacao criou a tabela com o nome antigo da entidade Prescricao.
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'prescricoes'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhido_medicamento'
  ) THEN
    ALTER TABLE public.prescricoes RENAME TO acolhido_medicamento;
    RAISE NOTICE 'Tabela prescricoes renomeada para acolhido_medicamento.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'uk_prescricoes_acolhido_medicamento'
  ) THEN
    ALTER TABLE public.acolhido_medicamento
      RENAME CONSTRAINT uk_prescricoes_acolhido_medicamento TO uk_acolhido_medicamento;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 1) Validacao minima antes de copiar dados
-- ---------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'remedios'
  ) THEN
    RAISE NOTICE 'Tabela remedios nao encontrada — etapa 1 ignorada (migracao ja pode ter sido aplicada).';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'medicamentos'
  ) THEN
    RAISE EXCEPTION 'Tabela medicamentos nao existe. Suba a aplicacao nova antes de migrar.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhido_remedio'
  ) THEN
    RAISE NOTICE 'Tabela acolhido_remedio nao encontrada — etapa 2 ignorada (migracao ja pode ter sido aplicada).';
  ELSIF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhido_medicamento'
  ) THEN
    RAISE EXCEPTION 'Tabela acolhido_medicamento nao existe. Suba a aplicacao nova antes de migrar.';
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2) remedios -> medicamentos (preserva ids)
--    Adapta-se ao schema antigo (sem usuario_id, descricao ou
--    quantidade_por_caixa) preenchendo valores padrao quando necessario.
-- ---------------------------------------------------------------------
DO $$
DECLARE
  tem_usuario_id BOOLEAN;
  tem_descricao BOOLEAN;
  tem_qtd_por_caixa BOOLEAN;
  qtd_remedios BIGINT;
  qtd_inseridos BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'remedios'
  ) THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'remedios' AND column_name = 'usuario_id'
  ) INTO tem_usuario_id;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'remedios' AND column_name = 'descricao'
  ) INTO tem_descricao;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'remedios' AND column_name = 'quantidade_por_caixa'
  ) INTO tem_qtd_por_caixa;

  SELECT COUNT(*) FROM public.remedios INTO qtd_remedios;

  IF tem_usuario_id AND tem_descricao AND tem_qtd_por_caixa THEN
    INSERT INTO public.medicamentos
      (id, usuario_id, nome, descricao, quantidade_caixas, quantidade_por_caixa, criado_em, atualizado_em)
    SELECT
      r.id,
      r.usuario_id,
      r.nome,
      r.descricao,
      r.quantidade_caixas,
      r.quantidade_por_caixa,
      COALESCE(r.criado_em, NOW()),
      COALESCE(r.atualizado_em, NOW())
    FROM public.remedios r
    ON CONFLICT (id) DO NOTHING;

  ELSIF tem_descricao AND NOT tem_usuario_id THEN
    INSERT INTO public.medicamentos
      (id, usuario_id, nome, descricao, quantidade_caixas, quantidade_por_caixa, criado_em, atualizado_em)
    SELECT
      r.id,
      COALESCE(
        (SELECT a.usuario_id
         FROM public.acolhido_remedio ar
         JOIN public.acolhidos a ON a.id = ar.acolhido_id
         WHERE ar.remedio_id = r.id
         LIMIT 1),
        (SELECT u.id FROM public.usuarios u ORDER BY u.id LIMIT 1)
      ),
      r.nome,
      r.descricao,
      r.quantidade_caixas,
      CASE WHEN tem_qtd_por_caixa THEN r.quantidade_por_caixa ELSE 0 END,
      COALESCE(r.criado_em, NOW()),
      COALESCE(r.atualizado_em, NOW())
    FROM public.remedios r
    ON CONFLICT (id) DO NOTHING;

  ELSE
    -- Schema mais antigo: pode faltar descricao e/ou usuario_id
    INSERT INTO public.medicamentos
      (id, usuario_id, nome, descricao, quantidade_caixas, quantidade_por_caixa, criado_em, atualizado_em)
    SELECT
      r.id,
      COALESCE(
        CASE WHEN tem_usuario_id THEN r.usuario_id END,
        (SELECT a.usuario_id
         FROM public.acolhido_remedio ar
         JOIN public.acolhidos a ON a.id = ar.acolhido_id
         WHERE ar.remedio_id = r.id
         LIMIT 1),
        (SELECT u.id FROM public.usuarios u ORDER BY u.id LIMIT 1)
      ),
      r.nome,
      CASE WHEN tem_descricao THEN r.descricao ELSE '' END,
      r.quantidade_caixas,
      CASE WHEN tem_qtd_por_caixa THEN r.quantidade_por_caixa ELSE 0 END,
      COALESCE(r.criado_em, NOW()),
      COALESCE(r.atualizado_em, NOW())
    FROM public.remedios r
    ON CONFLICT (id) DO NOTHING;
  END IF;

  GET DIAGNOSTICS qtd_inseridos = ROW_COUNT;
  RAISE NOTICE 'remedios: % registro(s) na origem; % linha(s) inseridas em medicamentos (ignorando conflitos).',
    qtd_remedios, qtd_inseridos;

  PERFORM setval(
    pg_get_serial_sequence('medicamentos', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM public.medicamentos), 1)
  );
END $$;

-- ---------------------------------------------------------------------
-- 3) acolhido_remedio -> acolhido_medicamento
--    Doses comecam em 0 (definidas depois no controle de administracao).
-- ---------------------------------------------------------------------
DO $$
DECLARE
  qtd_vinculos BIGINT;
  qtd_inseridos BIGINT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhido_remedio'
  ) THEN
    RETURN;
  END IF;

  SELECT COUNT(*) FROM public.acolhido_remedio INTO qtd_vinculos;

  INSERT INTO public.acolhido_medicamento
    (usuario_id, acolhido_id, medicamento_id, dose_manha, dose_tarde, dose_noite, criado_em, atualizado_em)
  SELECT
    a.usuario_id,
    ar.acolhido_id,
    ar.remedio_id,
    0,
    0,
    0,
    NOW(),
    NOW()
  FROM public.acolhido_remedio ar
  JOIN public.acolhidos a ON a.id = ar.acolhido_id
  JOIN public.medicamentos m ON m.id = ar.remedio_id
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.acolhido_medicamento am
    WHERE am.acolhido_id = ar.acolhido_id
      AND am.medicamento_id = ar.remedio_id
  );

  GET DIAGNOSTICS qtd_inseridos = ROW_COUNT;
  RAISE NOTICE 'acolhido_remedio: % vinculo(s) na origem; % linha(s) inseridas em acolhido_medicamento.',
    qtd_vinculos, qtd_inseridos;
END $$;

-- ---------------------------------------------------------------------
-- 4) Conferencia antes de remover tabelas antigas
-- ---------------------------------------------------------------------
DO $$
DECLARE
  faltando_medicamentos BIGINT;
  faltando_vinculos BIGINT;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'remedios'
  ) THEN
    SELECT COUNT(*)
    INTO faltando_medicamentos
    FROM public.remedios r
    WHERE NOT EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = r.id);

    IF faltando_medicamentos > 0 THEN
      RAISE EXCEPTION
        'Abortando: % remedio(s) nao foram copiados para medicamentos. Revise os dados antes de continuar.',
        faltando_medicamentos;
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'acolhido_remedio'
  ) THEN
    SELECT COUNT(*)
    INTO faltando_vinculos
    FROM public.acolhido_remedio ar
    WHERE EXISTS (SELECT 1 FROM public.medicamentos m WHERE m.id = ar.remedio_id)
      AND NOT EXISTS (
        SELECT 1 FROM public.acolhido_medicamento am
        WHERE am.acolhido_id = ar.acolhido_id
          AND am.medicamento_id = ar.remedio_id
      );

    IF faltando_vinculos > 0 THEN
      RAISE EXCEPTION
        'Abortando: % vinculo(s) de acolhido_remedio nao foram copiados. Revise os dados antes de continuar.',
        faltando_vinculos;
    END IF;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 5) Remove tabelas antigas (somente se ainda existirem)
-- ---------------------------------------------------------------------
DROP TABLE IF EXISTS public.acolhido_remedio;
DROP TABLE IF EXISTS public.remedios;

COMMIT;

-- =====================================================================
-- Verificacao pos-migracao (rode manualmente apos o COMMIT):
--
-- SELECT COUNT(*) AS medicamentos FROM medicamentos;
-- SELECT COUNT(*) AS vinculos FROM acolhido_medicamento;
--
-- SELECT tablename FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('remedios', 'acolhido_remedio', 'medicamentos', 'acolhido_medicamento');
--
-- Esperado: remedios e acolhido_remedio ausentes; medicamentos e
-- acolhido_medicamento presentes com os dados migrados.
-- =====================================================================
