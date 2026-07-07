package com.ctav.api.dto;

import com.ctav.api.entity.Motivo;
import com.ctav.api.enums.CategoriaMotivo;
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
public class MotivoResponseDTO {

    private Long id;
    private CategoriaMotivo categoria;
    private String nome;
    private String descricao;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static MotivoResponseDTO fromEntity(Motivo motivo) {
        return MotivoResponseDTO.builder()
                .id(motivo.getId())
                .categoria(motivo.getCategoria())
                .nome(motivo.getNome())
                .descricao(motivo.getDescricao())
                .criadoEm(motivo.getCriadoEm())
                .atualizadoEm(motivo.getAtualizadoEm())
                .build();
    }
}
