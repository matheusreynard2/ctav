package com.ctav.api.dto;

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
public class PertenceResponseDTO {

    private Long id;
    private Integer quantidade;
    private String item;
    private Long acolhidoId;
    private String acolhidoNome;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;
    @Builder.Default
    private List<FotoPertenceResponseDTO> fotos = List.of();
}
