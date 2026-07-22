package com.ctav.api.dto;

import com.ctav.api.enums.StatusConsulta;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

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
public class ConsultaRequestDTO {

    @NotNull(message = "O acolhido é obrigatório")
    private Long acolhidoId;

    @NotNull(message = "A data e a hora da consulta são obrigatórias")
    private LocalDateTime dataHora;

    @NotBlank(message = "A descrição é obrigatória")
    @Size(min = 2, max = 1000, message = "A descrição deve ter entre 2 e 1000 caracteres")
    private String descricao;

    @Size(max = 150, message = "O profissional pode ter no máximo 150 caracteres")
    private String profissional;

    @Size(max = 150, message = "O local pode ter no máximo 150 caracteres")
    private String local;

    // Quando não informado, o service assume AGENDADA.
    private StatusConsulta status;

    @Size(max = 4000, message = "O resumo pode ter no máximo 4000 caracteres")
    private String resumo;
}
