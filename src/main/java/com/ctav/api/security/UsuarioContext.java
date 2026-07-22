package com.ctav.api.security;

import com.ctav.api.entity.Usuario;

import jakarta.enterprise.context.RequestScoped;
// (Permissao usada nos métodos de checagem de permissão)
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

/**
 * Atalho para acessar o usuario autenticado dentro dos services,
 * garantindo o isolamento de dados por usuario (multi-tenant).
 */
@RequestScoped
public class UsuarioContext {

    @Inject
    UsuarioLogado usuarioLogado;

    @Inject
    EntityManager em;

    /**
     * Id da CONTA de dados (tenant) do usuário logado. Usado por todos os
     * services para isolar/consultar os registros do sistema. Usuários
     * vinculados à mesma conta compartilham os mesmos dados.
     */
    public Long id() {
        return usuarioLogado.getContaIdEfetiva();
    }

    /** Id da IDENTIDADE do usuário logado (para perfil, senha e permissão). */
    public Long identidadeId() {
        return usuarioLogado.getId();
    }

    public Integer permissaoId() {
        return usuarioLogado.getPermissaoId();
    }

    public boolean isAdministrador() {
        return Permissao.isAdministrador(usuarioLogado.getPermissaoId());
    }

    /** Referencia gerenciada (sem consulta extra) para associar como dono de um registro. */
    public Usuario referencia() {
        return em.getReference(Usuario.class, usuarioLogado.getContaIdEfetiva());
    }
}
