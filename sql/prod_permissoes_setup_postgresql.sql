-- =====================================================================
-- Setup do sistema de permissões em PRODUÇÃO.
--
-- Resolve dois pontos:
--   1) Cria os usuários "testepsico" (2) e "testeadv" (3), que o seeder
--      automático NÃO cria em produção (o seeder é fixo no usuário "teste",
--      que só existe em desenvolvimento).
--   2) Garante que os usuários já existentes (ex.: "william") sejam
--      administradores e enxerguem/gerenciem as permissões.
--
-- Rode com o JAR PARADO e depois suba a aplicação já com o backend atualizado
-- (que inclui os endpoints de permissões).
--
-- Ajuste o nome do administrador de produção se não for "william":
--   troque as 3 ocorrências de 'william' abaixo.
-- =====================================================================

-- 1) Tabela de tipos de permissão.
CREATE TABLE IF NOT EXISTS permissoes_usuarios (
    id   integer      NOT NULL PRIMARY KEY,
    nome varchar(40)  NOT NULL
);

INSERT INTO permissoes_usuarios (id, nome) VALUES
    (1, 'administrador'),
    (2, 'psicologo'),
    (3, 'advogado'),
    (4, 'financeiro')
ON CONFLICT (id) DO NOTHING;

-- 2) Colunas em usuarios (nullable, para não travar a base existente).
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS permissao_id integer;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS conta_id bigint;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_usuarios_permissao'
    ) THEN
        ALTER TABLE usuarios
            ADD CONSTRAINT fk_usuarios_permissao
            FOREIGN KEY (permissao_id) REFERENCES permissoes_usuarios (id);
    END IF;
END $$;

-- 3) Usuários que já existiam (anteriores às permissões) viram administradores
--    e donos da própria conta de dados.
UPDATE usuarios SET permissao_id = 1 WHERE permissao_id IS NULL;
UPDATE usuarios SET conta_id = id WHERE conta_id IS NULL;

-- 4) Cria/ajusta "testepsico" (2) e "testeadv" (3) compartilhando a conta do
--    administrador de produção ("william"): mesma senha e mesmos dados.
--    Se já existirem, apenas corrige permissão/conta/senha.
INSERT INTO usuarios (username, senha_hash, nome, permissao_id, conta_id, criado_em)
SELECT 'testepsico', w.senha_hash, 'Usuário Psicólogo', 2, w.id, now()
FROM usuarios w
WHERE w.username = 'william'
ON CONFLICT (username) DO UPDATE
    SET permissao_id = EXCLUDED.permissao_id,
        conta_id     = EXCLUDED.conta_id,
        senha_hash   = EXCLUDED.senha_hash;

INSERT INTO usuarios (username, senha_hash, nome, permissao_id, conta_id, criado_em)
SELECT 'testeadv', w.senha_hash, 'Usuário Advogado', 3, w.id, now()
FROM usuarios w
WHERE w.username = 'william'
ON CONFLICT (username) DO UPDATE
    SET permissao_id = EXCLUDED.permissao_id,
        conta_id     = EXCLUDED.conta_id,
        senha_hash   = EXCLUDED.senha_hash;

-- Conferência (opcional):
-- SELECT id, username, permissao_id, conta_id FROM usuarios ORDER BY id;
