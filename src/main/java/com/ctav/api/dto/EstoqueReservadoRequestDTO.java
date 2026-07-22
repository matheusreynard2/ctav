package com.ctav.api.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Ajuste do estoque reservado de um medicamento para um acolhido (edição direta
 * na listagem de medicamentos). O valor é o total de comprimidos que devem ficar
 * reservados exclusivamente para o acolhido.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EstoqueReservadoRequestDTO {

    @NotNull(message = "Informe o total de comprimidos reservados")
    @Min(value = 0, message = "O estoque reservado não pode ser negativo")
    private Integer totalComprimidos;
}
