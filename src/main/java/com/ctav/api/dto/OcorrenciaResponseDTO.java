package com.ctav.api.dto;

import com.ctav.api.entity.Ocorrencia;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

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
public class OcorrenciaResponseDTO {

    private Long id;
    // Acolhidos atualmente vinculados (ativos) e seus ids.
    private List<AcolhidoResumoDTO> acolhidos;
    private List<Long> acolhidoIds;
    // Snapshot dos nomes no momento do registro (pode conter acolhidos ja
    // excluidos) e um resumo pronto para exibicao.
    private String acolhidosNomes;
    private String acolhidosResumo;
    private String titulo;
    private String descricao;
    private LocalDate dataOcorrencia;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static OcorrenciaResponseDTO fromEntity(Ocorrencia ocorrencia) {
        List<AcolhidoResumoDTO> vinculados = ocorrencia.getAcolhidos() == null
                ? List.of()
                : ocorrencia.getAcolhidos().stream()
                        .map(AcolhidoResumoDTO::fromEntity)
                        .filter(a -> a != null)
                        .sorted((a, b) -> String.valueOf(a.getNome())
                                .compareToIgnoreCase(String.valueOf(b.getNome())))
                        .collect(Collectors.toList());

        String nomesVinculados = vinculados.stream()
                .map(AcolhidoResumoDTO::getNome)
                .collect(Collectors.joining(", "));

        // Preferimos os nomes dos acolhidos vinculados; se nao houver nenhum
        // vinculo ativo, recorremos ao snapshot (nomes de quando foi registrada).
        String resumo;
        if (!nomesVinculados.isBlank()) {
            resumo = nomesVinculados;
        } else if (ocorrencia.getAcolhidosNomes() != null
                && !ocorrencia.getAcolhidosNomes().isBlank()) {
            resumo = ocorrencia.getAcolhidosNomes();
        } else {
            resumo = null;
        }

        return OcorrenciaResponseDTO.builder()
                .id(ocorrencia.getId())
                .acolhidos(vinculados)
                .acolhidoIds(vinculados.stream()
                        .map(AcolhidoResumoDTO::getId)
                        .collect(Collectors.toList()))
                .acolhidosNomes(ocorrencia.getAcolhidosNomes())
                .acolhidosResumo(resumo)
                .titulo(ocorrencia.getTitulo())
                .descricao(ocorrencia.getDescricao())
                .dataOcorrencia(ocorrencia.getDataOcorrencia())
                .criadoEm(ocorrencia.getCriadoEm())
                .atualizadoEm(ocorrencia.getAtualizadoEm())
                .build();
    }
}
