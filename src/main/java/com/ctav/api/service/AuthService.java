package com.ctav.api.service;

import com.ctav.api.entity.Usuario;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.repository.UsuarioRepository;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.mindrot.jbcrypt.BCrypt;

@ApplicationScoped
public class AuthService {

    @Inject
    UsuarioRepository usuarioRepository;

    /**
     * Valida as credenciais e devolve o usuario autenticado.
     * Mensagem de erro generica de proposito (nao revela se o usuario existe).
     */
    public Usuario autenticar(String username, String senha) {
        if (username == null || username.isBlank() || senha == null || senha.isBlank()) {
            throw new BusinessException("Usuário e senha são obrigatórios.");
        }

        Usuario usuario = usuarioRepository.findByUsername(username.trim())
                .orElseThrow(() -> new BusinessException("Usuário ou senha inválidos."));

        if (!verificarSenha(senha, usuario.getSenhaHash())) {
            throw new BusinessException("Usuário ou senha inválidos.");
        }

        return usuario;
    }

    public String gerarHash(String senha) {
        return BCrypt.hashpw(senha, BCrypt.gensalt(12));
    }

    private boolean verificarSenha(String senha, String hash) {
        if (hash == null || hash.isBlank()) {
            return false;
        }
        try {
            return BCrypt.checkpw(senha, hash);
        } catch (IllegalArgumentException ex) {
            // hash em formato invalido
            return false;
        }
    }
}
