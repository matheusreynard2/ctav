package com.ctav.api.dto;

import com.ctav.api.entity.Medicamento;
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
public class MedicamentoResponseDTO {

    private Long id;
    private String nome;
    private String descricao;
    private Integer quantidade_caixas;
    private Integer quantidade_por_caixa;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static MedicamentoResponseDTO fromEntity(Medicamento medicamento) {
        return MedicamentoResponseDTO.builder()
                .id(medicamento.getId())
                .nome(medicamento.getNome())
                .descricao(medicamento.getDescricao())
                .quantidade_caixas(medicamento.getQuantidade_caixas())
                .quantidade_por_caixa(medicamento.getQuantidade_por_caixa())
                .criadoEm(medicamento.getCriadoEm())
                .atualizadoEm(medicamento.getAtualizadoEm())
                .build();
    }
}
