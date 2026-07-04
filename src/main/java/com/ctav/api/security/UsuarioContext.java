package com.ctav.api.security;

import com.ctav.api.entity.Usuario;

import jakarta.enterprise.context.RequestScoped;
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

    public Long id() {
        return usuarioLogado.getId();
    }

    /** Referencia gerenciada (sem consulta extra) para associar como dono de um registro. */
    public Usuario referencia() {
        return em.getReference(Usuario.class, usuarioLogado.getId());
    }
}
