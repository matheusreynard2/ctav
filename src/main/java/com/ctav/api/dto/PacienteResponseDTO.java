package com.ctav.api.dto;

import com.ctav.api.entity.Paciente;
import com.ctav.api.entity.Sexo;
import java.time.LocalDate;
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
public class PacienteResponseDTO {

    private Long id;
    private String nome;
    private String cpf;
    private LocalDate dataNascimento;
    private String email;
    private String telefone;
    private Sexo sexo;
    private String endereco;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static PacienteResponseDTO fromEntity(Paciente paciente) {
        return PacienteResponseDTO.builder()
                .id(paciente.getId())
                .nome(paciente.getNome())
                .cpf(paciente.getCpf())
                .dataNascimento(paciente.getDataNascimento())
                .email(paciente.getEmail())
                .telefone(paciente.getTelefone())
                .sexo(paciente.getSexo())
                .endereco(paciente.getEndereco())
                .criadoEm(paciente.getCriadoEm())
                .atualizadoEm(paciente.getAtualizadoEm())
                .build();
    }
}
