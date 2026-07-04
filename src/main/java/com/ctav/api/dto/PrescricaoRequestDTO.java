package com.ctav.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

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
public class PrescricaoRequestDTO {

    @NotNull(message = "O medicamento é obrigatório")
    private Long medicamentoId;

    @NotNull
    @Min(value = 0, message = "A dose não pode ser negativa")
    @Builder.Default
    private Integer doseManha = 0;

    @NotNull
    @Min(value = 0, message = "A dose não pode ser negativa")
    @Builder.Default
    private Integer doseTarde = 0;

    @NotNull
    @Min(value = 0, message = "A dose não pode ser negativa")
    @Builder.Default
    private Integer doseNoite = 0;
}
