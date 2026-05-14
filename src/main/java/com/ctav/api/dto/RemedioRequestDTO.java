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
public class RemedioRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 2, max = 120, message = "O nome deve ter entre 2 e 120 caracteres")
    private String nome;

    @NotBlank(message = "A descrição é obrigatória")
    @Size(min = 2, max = 255, message = "A descrição deve ter entre 2 e 255 caracteres")
    private String descricao;

    @NotNull(message = "A quantidade de caixas é obrigatória")
    @Min(value = 0, message = "A quantidade de caixas não pode ser negativa")
    private Integer quantidade_caixas;
}
