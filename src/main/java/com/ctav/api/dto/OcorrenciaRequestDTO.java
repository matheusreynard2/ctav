package com.ctav.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;

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
public class OcorrenciaRequestDTO {

    // Opcional: a ocorrencia pode envolver um ou mais acolhidos (ou nenhum).
    private List<Long> acolhidoIds;

    @NotBlank(message = "Informe qual foi a ocorrência")
    @Size(min = 2, max = 200, message = "A ocorrência deve ter entre 2 e 200 caracteres")
    private String titulo;

    @NotBlank(message = "A descrição é obrigatória")
    @Size(min = 2, max = 1000, message = "A descrição deve ter entre 2 e 1000 caracteres")
    private String descricao;

    private LocalDate dataOcorrencia;
}
