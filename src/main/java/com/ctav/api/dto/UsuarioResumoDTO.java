package com.ctav.api.dto;

import com.ctav.api.entity.Usuario;
import com.ctav.api.security.Permissao;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Resumo de um usuário da conta, usado na tela de gestão de permissões.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioResumoDTO {

    private Long id;
    private String username;
    private String nome;
    private Integer permissaoId;
    private String permissao;
    // Indica se é o próprio usuário logado (não pode alterar a própria permissão).
    private boolean proprio;

    public static UsuarioResumoDTO fromEntity(Usuario usuario, Long identidadeId) {
        Integer permissaoId = usuario.getPermissaoId();
        return UsuarioResumoDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nome(usuario.getNome())
                .permissaoId(permissaoId)
                .permissao(Permissao.nome(permissaoId))
                .proprio(usuario.getId().equals(identidadeId))
                .build();
    }
}
