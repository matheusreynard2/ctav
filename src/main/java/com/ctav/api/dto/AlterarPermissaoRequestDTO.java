package com.ctav.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AlterarPermissaoRequestDTO {

    @NotNull(message = "Informe a permissão")
    @Min(value = 1, message = "Permissão inválida")
    @Max(value = 4, message = "Permissão inválida")
    private Integer permissaoId;
}
