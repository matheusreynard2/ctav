package com.ctav.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Payload para atualizar apenas a assinatura do acolhido no termo de
// concordancia. O campo e uma imagem PNG em data URL (base64) ou null/vazio para
// remover a assinatura. A assinatura do responsavel e gerenciada na tela de
// responsaveis.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssinaturasRequestDTO {

    private String assinaturaAcolhido;
}
