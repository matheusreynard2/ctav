package com.ctav.api.dto;

import com.ctav.api.entity.Prescricao;

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
public class PrescricaoResponseDTO {

    private Long id;
    private Long medicamentoId;
    private String medicamentoNome;
    private String medicamentoDescricao;
    private Integer doseManha;
    private Integer doseTarde;
    private Integer doseNoite;
    // Estoque reservado deste medicamento para o acolhido.
    private Integer totalComprimidos;
    // Tamanho da caixa do medicamento (para exibir a equivalencia em caixas).
    private Integer quantidadePorCaixa;
    // Estoque livre (nao alocado) do medicamento, disponivel para reservar.
    private Integer medicamentoEstoqueLivre;

    public static PrescricaoResponseDTO fromEntity(Prescricao prescricao) {
        return PrescricaoResponseDTO.builder()
                .id(prescricao.getId())
                .medicamentoId(prescricao.getMedicamento().getId())
                .medicamentoNome(prescricao.getMedicamento().getNome())
                .medicamentoDescricao(prescricao.getMedicamento().getDescricao())
                .doseManha(prescricao.getDoseManha())
                .doseTarde(prescricao.getDoseTarde())
                .doseNoite(prescricao.getDoseNoite())
                .totalComprimidos(prescricao.getTotalComprimidos())
                .quantidadePorCaixa(prescricao.getMedicamento().getQuantidade_por_caixa())
                .medicamentoEstoqueLivre(prescricao.getMedicamento().getTotal_comprimidos())
                .build();
    }
}
