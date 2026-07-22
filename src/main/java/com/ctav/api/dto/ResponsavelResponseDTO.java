package com.ctav.api.dto;

import com.ctav.api.entity.Responsavel;
import java.time.LocalDateTime;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResponsavelResponseDTO {

    private Long id;
    private String nome;
    private String rg;
    private String cpf;
    private String endereco;
    private String bairro;
    private String cidade;
    private String estado;
    private String cep;
    private String celular;
    private Boolean conveniado;
    // Assinatura do responsavel (imagem PNG em data URL base64); null quando
    // ainda nao ha assinatura.
    private String assinatura;
    // Quantidade de acolhidos vinculados a este responsavel (para exibicao e
    // para bloquear a exclusao quando ha vinculos).
    private Long qtdAcolhidos;
    // Nomes dos acolhidos vinculados (para exibicao no detalhe/edicao).
    private List<String> acolhidos;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static ResponsavelResponseDTO fromEntity(Responsavel responsavel) {
        return fromEntity(responsavel, null, null);
    }

    public static ResponsavelResponseDTO fromEntity(Responsavel responsavel, Long qtdAcolhidos) {
        return fromEntity(responsavel, qtdAcolhidos, null);
    }

    public static ResponsavelResponseDTO fromEntity(
            Responsavel responsavel, Long qtdAcolhidos, List<String> acolhidos) {
        return ResponsavelResponseDTO.builder()
                .id(responsavel.getId())
                .nome(responsavel.getNome())
                .rg(responsavel.getRg())
                .cpf(responsavel.getCpf())
                .endereco(responsavel.getEndereco())
                .bairro(responsavel.getBairro())
                .cidade(responsavel.getCidade())
                .estado(responsavel.getEstado())
                .cep(responsavel.getCep())
                .celular(responsavel.getCelular())
                .conveniado(responsavel.getConveniado())
                .assinatura(responsavel.getAssinatura())
                .qtdAcolhidos(qtdAcolhidos)
                .acolhidos(acolhidos)
                .criadoEm(responsavel.getCriadoEm())
                .atualizadoEm(responsavel.getAtualizadoEm())
                .build();
    }
}
