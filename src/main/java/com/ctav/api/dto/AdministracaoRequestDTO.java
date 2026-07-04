package com.ctav.api.dto;

import com.ctav.api.enums.PeriodoDia;
import jakarta.validation.constraints.NotNull;
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
public class AdministracaoRequestDTO {

    @NotNull(message = "O medicamento é obrigatório")
    private Long medicamentoId;

    @NotNull(message = "A data é obrigatória")
    private LocalDate data;

    @NotNull(message = "O período é obrigatório")
    private PeriodoDia periodo;

    @NotNull(message = "Informe se o medicamento foi tomado")
    private Boolean tomado;
}
