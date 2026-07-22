package com.ctav.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Troca de senha do usuario logado: exige a senha atual (confirmacao) e a nova.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AlterarSenhaRequestDTO {

    @NotBlank(message = "A senha atual é obrigatória")
    private String senhaAtual;

    @NotBlank(message = "A nova senha é obrigatória")
    @Size(min = 4, max = 100, message = "A nova senha deve ter entre 4 e 100 caracteres")
    private String novaSenha;
}
