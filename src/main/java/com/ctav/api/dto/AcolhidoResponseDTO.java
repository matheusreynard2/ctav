package com.ctav.api.dto;

import com.ctav.api.entity.Acolhido;
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
public class AcolhidoResponseDTO {

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

    public static AcolhidoResponseDTO fromEntity(Acolhido acolhido) {
        List<RemedioResponseDTO> remedios = acolhido.getRemedios_prescritos() == null
                ? List.of()
                : acolhido.getRemedios_prescritos().stream()
                        .map(RemedioResponseDTO::fromEntity)
                        .toList();

        return AcolhidoResponseDTO.builder()
                .id(acolhido.getId())
                .nome(acolhido.getNome())
                .cpf(acolhido.getCpf())
                .dataNascimento(acolhido.getDataNascimento())
                .email(acolhido.getEmail())
                .telefone(acolhido.getTelefone())
                .sexo(acolhido.getSexo())
                .endereco(acolhido.getEndereco())
                .remedios_prescritos(remedios)
                .criadoEm(acolhido.getCriadoEm())
                .atualizadoEm(acolhido.getAtualizadoEm())
                .build();
    }
}
