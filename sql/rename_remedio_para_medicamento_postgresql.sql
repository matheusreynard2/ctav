-- =====================================================================
-- Migracao: "remedio" -> "medicamento"
--   - copia os dados de remedios para medicamentos (preservando ids);
--   - renomeia a tabela de vinculo prescricoes -> acolhido_medicamento
--     (vinculada a medicamentos, com dose por periodo);
--   - migra os vinculos antigos de acolhido_remedio;
--   - remove as tabelas antigas remedios e acolhido_remedio.
--
-- Banco: PostgreSQL
--
-- Contexto: este script assume que a aplicacao ja foi iniciada ao menos uma
-- vez (o Hibernate criou as tabelas vazias "medicamentos", "prescricoes" e
-- "administracoes_medicamento") e que as tabelas antigas "remedios" e
-- "acolhido_remedio" ainda existem com dados. Rode com a aplicacao PARADA.
-- =====================================================================

BEGIN;

-- 1) Copia os medicamentos a partir de remedios, preservando os ids
--    (assim os vinculos antigos continuam validos).
INSERT INTO medicamentos
    (id, usuario_id, nome, descricao, quantidade_caixas, quantidade_por_caixa, criado_em, atualizado_em)
SELECT id, usuario_id, nome, descricao, quantidade_caixas, quantidade_por_caixa, criado_em, atualizado_em
FROM remedios
ON CONFLICT (id) DO NOTHING;

-- Reposiciona a sequence de identidade de medicamentos apos o maior id migrado.
SELECT setval(
    pg_get_serial_sequence('medicamentos', 'id'),
    GREATEST((SELECT COALESCE(MAX(id), 1) FROM medicamentos), 1)
);

-- 2) Renomeia a tabela de vinculo (vazia) prescricoes -> acolhido_medicamento.
ALTER TABLE prescricoes RENAME TO acolhido_medicamento;
ALTER TABLE acolhido_medicamento
    RENAME CONSTRAINT uk_prescricoes_acolhido_medicamento TO uk_acolhido_medicamento;

-- 3) Migra os vinculos antigos (acolhido_remedio) para acolhido_medicamento,
--    com dose 0 (as doses devem ser preenchidas na edicao de cada acolhido).
INSERT INTO acolhido_medicamento
    (usuario_id, acolhido_id, medicamento_id, dose_manha, dose_tarde, dose_noite, criado_em, atualizado_em)
SELECT a.usuario_id, ar.acolhido_id, ar.remedio_id, 0, 0, 0, NOW(), NOW()
FROM acolhido_remedio ar
JOIN acolhidos a ON a.id = ar.acolhido_id
ON CONFLICT (acolhido_id, medicamento_id) DO NOTHING;

-- 4) Remove as tabelas antigas.
DROP TABLE acolhido_remedio;
DROP TABLE remedios;

COMMIT;
