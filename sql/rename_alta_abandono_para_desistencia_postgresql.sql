-- Migração (PostgreSQL): renomeia o tipo de alta ABANDONO para DESISTENCIA.
-- IMPORTANTE: rode este script ANTES de subir a nova versão da API. Como o
-- tipo de alta é gravado como texto (EnumType.STRING), linhas antigas com
-- 'ABANDONO' passariam a falhar ao carregar depois que o enum foi renomeado.
-- É idempotente: se não houver linhas 'ABANDONO', nada acontece.

UPDATE public.acolhidos
SET tipo_alta = 'DESISTENCIA',
    descricao_alta = CASE
        WHEN descricao_alta ILIKE '%abandono%'
            THEN 'Consideramos desistência quando o acolhido, por vontade própria, decide interromper o tratamento em qualquer momento.'
        ELSE descricao_alta
    END
WHERE tipo_alta = 'ABANDONO';

-- A restrição CHECK gerada pelo Hibernate ainda lista o valor antigo
-- ('ABANDONO'). O generation=update não a atualiza, então recriamos a
-- constraint com os valores atuais do enum TipoAlta.
ALTER TABLE public.acolhidos DROP CONSTRAINT IF EXISTS acolhidos_tipo_alta_check;
ALTER TABLE public.acolhidos ADD CONSTRAINT acolhidos_tipo_alta_check
    CHECK (tipo_alta IS NULL OR tipo_alta IN ('CONCLUSAO', 'ADMINISTRATIVA', 'DESISTENCIA', 'RECAIDA'));
