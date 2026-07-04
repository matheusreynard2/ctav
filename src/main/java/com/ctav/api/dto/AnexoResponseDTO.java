package com.ctav.api.dto;

import com.ctav.api.entity.Anexo;
import com.ctav.api.enums.TipoAnexo;
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
public class AnexoResponseDTO {

    private Long id;
    private String nomeArquivo;
    private String contentType;
    private long tamanhoBytes;
    private TipoAnexo tipo;
    private LocalDateTime enviadoEm;
    private LocalDateTime atualizadoEm;

    public static AnexoResponseDTO fromEntity(Anexo anexo) {
        return AnexoResponseDTO.builder()
                .id(anexo.getId())
                .nomeArquivo(anexo.getNomeArquivo())
                .contentType(anexo.getContentType())
                .tamanhoBytes(anexo.getTamanhoBytes())
                .tipo(anexo.getTipo())
                .enviadoEm(anexo.getEnviadoEm())
                .atualizadoEm(anexo.getAtualizadoEm())
                .build();
    }
}
