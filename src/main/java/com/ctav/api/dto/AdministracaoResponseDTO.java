package com.ctav.api.dto;

import com.ctav.api.entity.AdministracaoMedicamento;
import com.ctav.api.enums.PeriodoDia;
import java.time.LocalDate;

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
public class AdministracaoResponseDTO {

    private Long id;
    private Long acolhidoId;
    private Long medicamentoId;
    private LocalDate data;
    private PeriodoDia periodo;
    private Boolean tomado;

    public static AdministracaoResponseDTO fromEntity(AdministracaoMedicamento adm) {
        return AdministracaoResponseDTO.builder()
                .id(adm.getId())
                .acolhidoId(adm.getAcolhido().getId())
                .medicamentoId(adm.getMedicamento().getId())
                .data(adm.getData())
                .periodo(adm.getPeriodo())
                .tomado(adm.getTomado())
                .build();
    }
}
