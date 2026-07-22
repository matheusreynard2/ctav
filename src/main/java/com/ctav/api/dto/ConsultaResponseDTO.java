package com.ctav.api.dto;

import com.ctav.api.entity.Consulta;
import com.ctav.api.enums.StatusConsulta;
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
public class ConsultaResponseDTO {

    private Long id;
    private Long acolhidoId;
    private String acolhidoNome;
    private String acolhidoCpf;
    private LocalDateTime dataHora;
    private String descricao;
    private String profissional;
    private String local;
    private StatusConsulta status;
    private String resumo;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static ConsultaResponseDTO fromEntity(Consulta consulta) {
        return ConsultaResponseDTO.builder()
                .id(consulta.getId())
                .acolhidoId(consulta.getAcolhido() != null ? consulta.getAcolhido().getId() : null)
                .acolhidoNome(consulta.getAcolhido() != null ? consulta.getAcolhido().getNome() : null)
                .acolhidoCpf(consulta.getAcolhido() != null ? consulta.getAcolhido().getCpf() : null)
                .dataHora(consulta.getDataHora())
                .descricao(consulta.getDescricao())
                .profissional(consulta.getProfissional())
                .local(consulta.getLocal())
                .status(consulta.getStatus())
                .resumo(consulta.getResumo())
                .criadoEm(consulta.getCriadoEm())
                .atualizadoEm(consulta.getAtualizadoEm())
                .build();
    }
}
