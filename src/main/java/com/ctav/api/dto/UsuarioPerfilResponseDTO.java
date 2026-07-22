package com.ctav.api.dto;

import com.ctav.api.entity.Usuario;
import com.ctav.api.security.Permissao;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Dados do perfil do usuario logado. O id e somente leitura (identifica o dono
// de todos os registros do sistema) e nunca pode ser alterado.
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UsuarioPerfilResponseDTO {

    private Long id;
    private String username;
    private String nome;
    private Integer permissaoId;
    private String permissao;
    private Long contaId;
    private LocalDateTime criadoEm;

    public static UsuarioPerfilResponseDTO fromEntity(Usuario usuario) {
        // Usuário sem permissão explícita (base anterior ao sistema de
        // permissões) é tratado como administrador, igual ao /login e /me.
        Integer permissaoId = usuario.getPermissaoId() == null
                ? Permissao.ADMINISTRADOR
                : usuario.getPermissaoId();
        return UsuarioPerfilResponseDTO.builder()
                .id(usuario.getId())
                .username(usuario.getUsername())
                .nome(usuario.getNome())
                .permissaoId(permissaoId)
                .permissao(Permissao.nome(permissaoId))
                .contaId(usuario.getContaIdEfetiva())
                .criadoEm(usuario.getCriadoEm())
                .build();
    }
}
