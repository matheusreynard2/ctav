-- Sistema de permissões de usuários.
-- 1 = administrador (acesso total)
-- 2 = psicólogo, 3 = advogado (acesso somente às páginas de início e relatórios)
--
-- Observação: a aplicação também garante estes dados na subida (PermissaoSeeder),
-- inclusive a criação dos usuários "testepsico" (2) e "testeadv" (3). Este script
-- cobre o schema e os dados de referência para execução manual/produção.

-- Tabela de tipos de permissão.
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

-- Coluna de permissão em usuarios (nullable para não travar bases existentes).
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS permissao_id integer;

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

-- O usuário "teste" já existente passa a ser administrador (permissão 1).
UPDATE usuarios SET permissao_id = 1 WHERE username = 'teste';

-- Conta de dados (tenant) compartilhada: usuários vinculados à mesma conta
-- enxergam e alteram os mesmos registros do sistema. Nulo => a própria conta.
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS conta_id bigint;

-- Cada usuário existente é dono da própria conta por padrão.
UPDATE usuarios SET conta_id = id WHERE conta_id IS NULL;

-- Os usuários "testepsico" e "testeadv" compartilham a conta do "teste".
UPDATE usuarios
SET conta_id = (SELECT id FROM usuarios WHERE username = 'teste')
WHERE username IN ('testepsico', 'testeadv')
  AND EXISTS (SELECT 1 FROM usuarios WHERE username = 'teste');
