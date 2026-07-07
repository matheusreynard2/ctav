package com.ctav.api.dto;

import com.ctav.api.entity.Acolhido;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Resumo enxuto de um acolhido para uso em listas de outras entidades. */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcolhidoResumoDTO {

    private Long id;
    private String nome;
    private String cpf;

    public static AcolhidoResumoDTO fromEntity(Acolhido acolhido) {
        if (acolhido == null) {
            return null;
        }
        return AcolhidoResumoDTO.builder()
                .id(acolhido.getId())
                .nome(acolhido.getNome())
                .cpf(acolhido.getCpf())
                .build();
    }
}
