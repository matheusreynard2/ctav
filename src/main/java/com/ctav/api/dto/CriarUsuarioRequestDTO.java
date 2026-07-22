package com.ctav.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CriarUsuarioRequestDTO {

    @NotBlank(message = "Informe o nome de usuário")
    @Size(min = 2, max = 60, message = "O nome de usuário deve ter de 2 a 60 caracteres")
    private String username;

    @Size(max = 120, message = "O nome pode ter no máximo 120 caracteres")
    private String nome;

    @NotBlank(message = "Informe a senha")
    @Size(min = 4, max = 100, message = "A senha deve ter ao menos 4 caracteres")
    private String senha;

    @NotNull(message = "Informe a permissão")
    @Min(value = 1, message = "Permissão inválida")
    @Max(value = 4, message = "Permissão inválida")
    private Integer permissaoId;
}
