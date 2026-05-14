package com.ctav.api.dto;

import com.ctav.api.entity.Remedio;
import java.time.LocalDateTime;

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
public class RemedioResponseDTO {

    private Long id;
    private String nome;
    private String descricao;
    private Integer quantidade_caixas;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static RemedioResponseDTO fromEntity(Remedio remedio) {
        return RemedioResponseDTO.builder()
                .id(remedio.getId())
                .nome(remedio.getNome())
                .descricao(remedio.getDescricao())
                .quantidade_caixas(remedio.getQuantidade_caixas())
                .criadoEm(remedio.getCriadoEm())
                .atualizadoEm(remedio.getAtualizadoEm())
                .build();
    }
}
