package com.ctav.api.dto;

import com.ctav.api.entity.FotoPertence;
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
public class FotoPertenceResponseDTO {

    private Long id;
    private String nomeArquivo;
    private String contentType;
    private long tamanhoBytes;
    // URL pre-assinada (temporaria) para exibir a imagem diretamente no frontend.
    private String url;
    private LocalDateTime enviadoEm;

    public static FotoPertenceResponseDTO fromEntity(FotoPertence foto, String url) {
        return FotoPertenceResponseDTO.builder()
                .id(foto.getId())
                .nomeArquivo(foto.getNomeArquivo())
                .contentType(foto.getContentType())
                .tamanhoBytes(foto.getTamanhoBytes())
                .url(url)
                .enviadoEm(foto.getEnviadoEm())
                .build();
    }
}
