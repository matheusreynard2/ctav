package com.ctav.api.dto;

import com.ctav.api.enums.TipoCombinado;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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
public class CombinadoRequestDTO {

    @NotNull(message = "O acolhido é obrigatório")
    private Long acolhidoId;

    @NotNull(message = "O tipo de combinado é obrigatório")
    private TipoCombinado tipo;

    @NotBlank(message = "A descrição é obrigatória")
    @Size(min = 2, max = 1000, message = "A descrição deve ter entre 2 e 1000 caracteres")
    private String descricao;

    // Obrigatórios somente quando o tipo for RESSOCIALIZACAO (validado no service).
    private LocalDate dataIda;

    private LocalDate dataVolta;
}
