-- Tabelas de pertences do acolhido e das fotos de cada pertence.
--
-- Rode este script ANTES de subir o JAR em producao (ou deixe o Hibernate
-- criar as tabelas em ambientes com database.generation=update). O script e
-- idempotente e seguro de reexecutar.
--
-- Um pertence pertence a um acolhido (quantidade + item). Cada pertence pode
-- ter varias fotos (PNG/JPG) cujo binario fica em bucket S3 dedicado; aqui
-- guardamos apenas os metadados e a chave do objeto no bucket.

CREATE TABLE IF NOT EXISTS pertences (
    id            bigserial     PRIMARY KEY,
    acolhido_id   bigint        NOT NULL REFERENCES acolhidos (id),
    quantidade    integer       NOT NULL,
    item          varchar(200)  NOT NULL,
    criado_em     timestamp,
    atualizado_em timestamp
);

CREATE INDEX IF NOT EXISTS idx_pertences_acolhido
    ON pertences (acolhido_id);

CREATE TABLE IF NOT EXISTS fotos_pertences (
    id             bigserial    PRIMARY KEY,
    pertence_id    bigint       NOT NULL REFERENCES pertences (id),
    nome_arquivo   varchar(255) NOT NULL,
    content_type   varchar(100) NOT NULL,
    tamanho_bytes  bigint       NOT NULL,
    chave_s3       varchar(512) NOT NULL,
    enviado_em     timestamp    NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fotos_pertences_pertence
    ON fotos_pertences (pertence_id);

-- Concordancia com o Termo de Responsabilidade sobre Pertences, coletada no
-- acolhimento (null = nao preenchido). Idempotente.
ALTER TABLE acolhidos
    ADD COLUMN IF NOT EXISTS concorda_pertences boolean;
