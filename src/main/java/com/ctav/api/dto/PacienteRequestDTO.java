package com.ctav.api.dto;

import com.ctav.api.entity.Sexo;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
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
public class PacienteRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 2, max = 120, message = "O nome deve ter entre 2 e 120 caracteres")
    private String nome;

    @NotBlank(message = "O CPF é obrigatório")
    @Pattern(
        regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}",
        message = "CPF inválido. Use o formato 000.000.000-00 ou apenas números"
    )
    private String cpf;

    @NotNull(message = "A data de nascimento é obrigatória")
    @Past(message = "A data de nascimento deve estar no passado")
    private LocalDate dataNascimento;

    @Email(message = "Email inválido")
    @Size(max = 120)
    private String email;

    @Size(max = 20)
    private String telefone;

    private Sexo sexo;

    @Size(max = 200)
    private String endereco;
}
