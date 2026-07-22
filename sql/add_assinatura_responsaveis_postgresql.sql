-- Adiciona a coluna de assinatura na tabela de responsáveis. A assinatura passa
-- a pertencer ao responsável (fonte única), sendo cadastrada/editada na tela de
-- responsáveis e reutilizada no termo de concordância dos acolhidos vinculados.
-- A imagem é armazenada como data URL (base64) em coluna TEXT. Em ambientes com
-- hibernate.database.generation=update a coluna é criada automaticamente; este
-- script serve para produção/manual.

ALTER TABLE responsaveis
    ADD COLUMN IF NOT EXISTS assinatura TEXT;

-- A coluna acolhidos.assinatura_responsavel deixa de ser usada (a assinatura do
-- responsável agora vem da tabela responsaveis). Ela é mantida por segurança;
-- para removê-la definitivamente, execute manualmente:
-- ALTER TABLE acolhidos DROP COLUMN IF EXISTS assinatura_responsavel;
