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
}
