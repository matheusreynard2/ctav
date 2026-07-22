package com.ctav.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Atualizacao dos dados de perfil do usuario (nome e nome de usuario). O id
// nunca e enviado/alterado.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AtualizarPerfilRequestDTO {

    @NotBlank(message = "O nome de usuário é obrigatório")
    @Size(min = 2, max = 60, message = "O nome de usuário deve ter entre 2 e 60 caracteres")
    private String username;

    @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres")
    private String nome;
}
