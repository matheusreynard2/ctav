package com.ctav.api.dto;

import com.ctav.api.enums.CategoriaMotivo;
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
public class MotivoRequestDTO {

    @NotNull(message = "A categoria do motivo é obrigatória")
    private CategoriaMotivo categoria;

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 2, max = 120, message = "O nome deve ter entre 2 e 120 caracteres")
    private String nome;

    @Size(max = 255, message = "A descrição pode ter no máximo 255 caracteres")
    private String descricao;
}
