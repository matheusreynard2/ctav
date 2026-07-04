package com.ctav.api.dto;

import com.ctav.api.entity.Combinado;
import com.ctav.api.enums.TipoCombinado;
import java.time.LocalDate;
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
public class CombinadoResponseDTO {

    private Long id;
    private Long acolhidoId;
    private String acolhidoNome;
    private String acolhidoCpf;
    private TipoCombinado tipo;
    private String descricao;
    private LocalDate dataIda;
    private LocalDate dataVolta;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static CombinadoResponseDTO fromEntity(Combinado combinado) {
        return CombinadoResponseDTO.builder()
                .id(combinado.getId())
                .acolhidoId(combinado.getAcolhido() != null ? combinado.getAcolhido().getId() : null)
                .acolhidoNome(combinado.getAcolhido() != null ? combinado.getAcolhido().getNome() : null)
                .acolhidoCpf(combinado.getAcolhido() != null ? combinado.getAcolhido().getCpf() : null)
                .tipo(combinado.getTipo())
                .descricao(combinado.getDescricao())
                .dataIda(combinado.getDataIda())
                .dataVolta(combinado.getDataVolta())
                .criadoEm(combinado.getCriadoEm())
                .atualizadoEm(combinado.getAtualizadoEm())
                .build();
    }
}
