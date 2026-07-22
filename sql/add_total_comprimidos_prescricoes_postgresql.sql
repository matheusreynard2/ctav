-- Estoque restrito por acolhido: cada vinculo acolhido<->medicamento passa a ter
-- um estoque proprio (total_comprimidos alocado/reservado para aquele acolhido).
-- O estoque do medicamento (medicamentos.total_comprimidos) passa a representar o
-- estoque LIVRE (nao alocado a nenhum acolhido), que pode ser reservado para os
-- acolhidos conforme necessario.
--
-- A administracao diaria passa a debitar/creditar o estoque da PRESCRICAO
-- (acolhido_medicamento.total_comprimidos), e nao mais o estoque do medicamento.

-- IMPORTANTE: rode este script ANTES de subir o JAR. Caso a aplicacao ja tenha
-- tentado subir, o Hibernate (database.generation=update) tenta adicionar a
-- coluna diretamente como "integer not null", o que falha em tabelas com linhas
-- existentes (ERROR: column "total_comprimidos" ... contains null values).
--
-- Os passos abaixo sao idempotentes e seguros em qualquer estado atual da
-- coluna (inexistente, ou ja criada como nullable e com valores nulos).

-- 1) Cria a coluna, se ainda nao existir, SEM forcar NOT NULL neste momento.
ALTER TABLE acolhido_medicamento
    ADD COLUMN IF NOT EXISTS total_comprimidos integer;

-- 2) Preenche com 0 qualquer registro existente (inclusive nulos deixados por
--    uma tentativa anterior de subida da aplicacao).
UPDATE acolhido_medicamento
SET total_comprimidos = 0
WHERE total_comprimidos IS NULL;

-- 3) Define o valor padrao e a restricao NOT NULL (agora ja sem nulos).
ALTER TABLE acolhido_medicamento
    ALTER COLUMN total_comprimidos SET DEFAULT 0;

ALTER TABLE acolhido_medicamento
    ALTER COLUMN total_comprimidos SET NOT NULL;
