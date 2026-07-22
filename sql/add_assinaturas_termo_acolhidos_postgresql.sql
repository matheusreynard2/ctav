-- Adiciona as colunas de assinatura do termo de concordância terapêutica na
-- tabela de acolhidos. As imagens são armazenadas como data URL (base64) em
-- colunas TEXT. Em ambientes com hibernate.database.generation=update as colunas
-- são criadas automaticamente; este script serve para produção/manual.

ALTER TABLE acolhidos
    ADD COLUMN IF NOT EXISTS assinatura_acolhido TEXT,
    ADD COLUMN IF NOT EXISTS assinatura_responsavel TEXT;
