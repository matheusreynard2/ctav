package com.ctav.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
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
public class ResponsavelRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 2, max = 120, message = "O nome deve ter entre 2 e 120 caracteres")
    private String nome;

    @Size(max = 20, message = "O RG pode ter no máximo 20 caracteres")
    private String rg;

    @NotBlank(message = "O CPF é obrigatório")
    @Pattern(
            regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}",
            message = "CPF inválido. Use o formato 000.000.000-00 ou apenas números"
    )
    private String cpf;

    @Size(max = 200, message = "O endereço pode ter no máximo 200 caracteres")
    private String endereco;

    @Size(max = 100, message = "O bairro pode ter no máximo 100 caracteres")
    private String bairro;

    @Size(max = 100, message = "A cidade pode ter no máximo 100 caracteres")
    private String cidade;

    @Size(max = 2, message = "Use a sigla do estado (UF) com 2 letras")
    private String estado;

    @Size(max = 9, message = "O CEP pode ter no máximo 9 caracteres")
    private String cep;

    @Size(max = 20, message = "O celular pode ter no máximo 20 caracteres")
    private String celular;

    private Boolean conveniado;

    // Assinatura do responsavel (imagem PNG em data URL base64). No cadastro e
    // gravada quando desenhada; na atualizacao, quando null preserva o valor
    // atual e quando vazia ("") remove a assinatura.
    private String assinatura;
}
