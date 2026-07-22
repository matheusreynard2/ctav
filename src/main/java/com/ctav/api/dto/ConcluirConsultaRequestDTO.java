package com.ctav.api.dto;

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
public class ConcluirConsultaRequestDTO {

    @Size(max = 4000, message = "O resumo pode ter no máximo 4000 caracteres")
    private String resumo;
}
