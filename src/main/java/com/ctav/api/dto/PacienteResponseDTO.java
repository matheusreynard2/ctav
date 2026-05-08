package com.ctav.api.dto;

import com.ctav.api.entity.Paciente;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

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
    private String sexo;
    private String endereco;
    private List<RemedioResponseDTO> remedios_prescritos;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static PacienteResponseDTO fromEntity(Paciente paciente) {
        List<RemedioResponseDTO> remedios = paciente.getRemedios_prescritos() == null
                ? List.of()
                : paciente.getRemedios_prescritos().stream()
                        .map(RemedioResponseDTO::fromEntity)
                        .toList();

        return PacienteResponseDTO.builder()
                .id(paciente.getId())
                .nome(paciente.getNome())
                .cpf(paciente.getCpf())
                .dataNascimento(paciente.getDataNascimento())
                .email(paciente.getEmail())
                .telefone(paciente.getTelefone())
                .sexo(paciente.getSexo())
                .endereco(paciente.getEndereco())
                .remedios_prescritos(remedios)
                .criadoEm(paciente.getCriadoEm())
                .atualizadoEm(paciente.getAtualizadoEm())
                .build();
    }
}
