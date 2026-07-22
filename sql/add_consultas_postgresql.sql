-- Tabela de agendamento de consultas.
--
-- Rode este script ANTES de subir o JAR em producao (ou deixe o Hibernate
-- criar a tabela em ambientes com database.generation=update). O script e
-- idempotente e seguro de reexecutar.
--
-- Vinculada ao usuario (conta/tenant) e ao acolhido. Restrita as permissoes
-- administrador (1) e psicologo (2) na camada de aplicacao.

CREATE TABLE IF NOT EXISTS consultas (
    id            bigserial PRIMARY KEY,
    usuario_id    bigint       NOT NULL REFERENCES usuarios (id),
    acolhido_id   bigint       NOT NULL REFERENCES acolhidos (id),
    data_hora     timestamp    NOT NULL,
    descricao     varchar(1000) NOT NULL,
    profissional   varchar(150),
    local_consulta varchar(150),
    status         varchar(20)  NOT NULL DEFAULT 'AGENDADA',
    criado_em     timestamp,
    atualizado_em timestamp
);

CREATE INDEX IF NOT EXISTS idx_consultas_usuario_acolhido
    ON consultas (usuario_id, acolhido_id);

CREATE INDEX IF NOT EXISTS idx_consultas_usuario_data
    ON consultas (usuario_id, data_hora);

-- Resumo do que ocorreu na consulta (preenchido ao concluí-la). Idempotente:
-- adiciona a coluna caso a tabela já exista sem ela.
ALTER TABLE consultas
    ADD COLUMN IF NOT EXISTS resumo text;
