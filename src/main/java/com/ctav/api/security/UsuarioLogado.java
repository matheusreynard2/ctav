package com.ctav.api.security;

import jakarta.enterprise.context.RequestScoped;
import lombok.Getter;
import lombok.Setter;

/**
 * Guarda os dados do usuario autenticado na requisicao atual.
 * Preenchido pelo filtro de autenticacao e lido pelos controllers.
 */
@RequestScoped
@Getter
@Setter
public class UsuarioLogado {
    private Long id;
    private String username;
    private String nome;
    // Permissão de acesso (1 = administrador, 2 = psicólogo, 3 = advogado).
    private Integer permissaoId;
    // Conta de dados (tenant) a que o usuário pertence. Todos os registros do
    // sistema são isolados por esta conta, não pela identidade do usuário.
    private Long contaId;

    /** Conta de dados efetiva: a conta vinculada ou a própria identidade. */
    public Long getContaIdEfetiva() {
        return contaId != null ? contaId : id;
    }
}
