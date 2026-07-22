-- Opcoes escolhidas nos termos assinados no acolhimento.
--   autoriza_uso_imagem: se o acolhido autorizou o uso de imagem (Acordo de
--                        Acolhimento).
--   entrega_celular:     se o acolhido fez a entrega do aparelho celular
--                        (Termo de Entrega de Celular).
-- Ambas anulaveis: null quando o termo nao foi preenchido.

ALTER TABLE acolhidos ADD COLUMN IF NOT EXISTS autoriza_uso_imagem boolean;
ALTER TABLE acolhidos ADD COLUMN IF NOT EXISTS entrega_celular boolean;
