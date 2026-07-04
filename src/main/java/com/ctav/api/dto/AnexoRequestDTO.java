package com.ctav.api.dto;

import com.ctav.api.enums.TipoAnexo;
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
public class AnexoRequestDTO {

    @NotBlank(message = "O nome do arquivo é obrigatório")
    @Size(min = 2, max = 120, message = "O nome do arquivo deve ter entre 2 e 120 caracteres")
    private String nomeArquivo;

    @NotNull(message = "O tipo é obrigatório")
    private TipoAnexo tipo;
}
