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
    private Integer total_comprimidos;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static MedicamentoResponseDTO fromEntity(Medicamento medicamento) {
        Integer porCaixa = medicamento.getQuantidade_por_caixa();
        Integer caixas = medicamento.getQuantidade_caixas();
        // Compatibilidade com registros antigos ainda sem total_comprimidos.
        Integer total = medicamento.getTotal_comprimidos();
        if (total == null) {
            int pc = (porCaixa == null || porCaixa <= 0) ? 1 : porCaixa;
            total = (caixas == null ? 0 : caixas) * pc;
        }

        return MedicamentoResponseDTO.builder()
                .id(medicamento.getId())
                .nome(medicamento.getNome())
                .descricao(medicamento.getDescricao())
                .quantidade_caixas(caixas)
                .quantidade_por_caixa(porCaixa)
                .total_comprimidos(total)
                .criadoEm(medicamento.getCriadoEm())
                .atualizadoEm(medicamento.getAtualizadoEm())
                .build();
    }
}
