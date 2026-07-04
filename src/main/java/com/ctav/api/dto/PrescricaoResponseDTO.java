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

    public static PrescricaoResponseDTO fromEntity(Prescricao prescricao) {
        return PrescricaoResponseDTO.builder()
                .id(prescricao.getId())
                .medicamentoId(prescricao.getMedicamento().getId())
                .medicamentoNome(prescricao.getMedicamento().getNome())
                .medicamentoDescricao(prescricao.getMedicamento().getDescricao())
                .doseManha(prescricao.getDoseManha())
                .doseTarde(prescricao.getDoseTarde())
                .doseNoite(prescricao.getDoseNoite())
                .build();
    }
}
