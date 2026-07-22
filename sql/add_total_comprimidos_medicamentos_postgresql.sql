-- Adiciona o total real de comprimidos em estoque ao medicamento.
--   total_comprimidos: fonte de verdade do estoque, usada nos alertas e
--                      ajustada a cada administracao registrada.
-- A quantidade de caixas (quantidade_caixas) passa a ser derivada:
--   quantidade_caixas = total_comprimidos / quantidade_por_caixa (caixas cheias).

ALTER TABLE medicamentos ADD COLUMN IF NOT EXISTS total_comprimidos integer;

-- Backfill dos registros existentes: total = caixas * comprimidos por caixa.
UPDATE medicamentos
SET total_comprimidos = COALESCE(quantidade_caixas, 0) * COALESCE(quantidade_por_caixa, 1)
WHERE total_comprimidos IS NULL;
