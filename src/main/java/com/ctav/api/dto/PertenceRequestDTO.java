package com.ctav.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class PertenceRequestDTO {

    @NotNull(message = "Informe a quantidade.")
    @Min(value = 1, message = "A quantidade deve ser de pelo menos 1.")
    private Integer quantidade;

    @NotBlank(message = "Informe o item.")
    @Size(max = 200, message = "O item deve ter no máximo 200 caracteres.")
    private String item;
}
