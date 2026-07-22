package com.ctav.api.controller;

import com.ctav.api.dto.AlterarSenhaRequestDTO;
import com.ctav.api.dto.AtualizarPerfilRequestDTO;
import com.ctav.api.dto.LoginRequestDTO;
import com.ctav.api.dto.UsuarioPerfilResponseDTO;
import com.ctav.api.entity.Usuario;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.security.Permissao;
import com.ctav.api.security.UsuarioLogado;
import com.ctav.api.service.AuthService;
import com.ctav.api.service.JwtService;
import com.ctav.api.service.UsuarioService;

import io.quarkus.runtime.LaunchMode;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.NewCookie;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthController {

    @Inject
    AuthService authService;

    @Inject
    JwtService jwtService;

    @Inject
    UsuarioService usuarioService;

    @Inject
    UsuarioLogado usuarioLogado;

    @ConfigProperty(name = "app.auth.cookie.name")
    String cookieName;

    @ConfigProperty(name = "app.auth.cookie.secure")
    boolean cookieSecure;

    @POST
    @Path("/login")
    public Response login(@Valid LoginRequestDTO dto) {
        Usuario usuario = authService.autenticar(dto.getUsername(), dto.getSenha());
        String token = jwtService.gerarToken(
                usuario.getId(), usuario.getUsername(), usuario.getNome(),
                usuario.getPermissaoId(), usuario.getContaIdEfetiva());

        NewCookie cookie = construirCookie(token, (int) jwtService.getExpirationSegundos());

        return Response.ok(Map.of(
                        "username", usuario.getUsername(),
                        "nome", usuario.getNome() == null ? "" : usuario.getNome(),
                        "permissaoId", usuario.getPermissaoId() == null
                                ? Permissao.ADMINISTRADOR
                                : usuario.getPermissaoId(),
                        "permissao", Permissao.nome(
                                usuario.getPermissaoId() == null
                                        ? Permissao.ADMINISTRADOR
                                        : usuario.getPermissaoId())))
                .cookie(cookie)
                .build();
    }

    @POST
    @Path("/logout")
    public Response logout() {
        // Cookie expirado para o navegador remover o token.
        NewCookie cookie = construirCookie("", 0);
        return Response.ok(Map.of("message", "Logout realizado.")).cookie(cookie).build();
    }

    @GET
    @Path("/me")
    public Response me() {
        Integer permissaoId = usuarioLogado.getPermissaoId() == null
                ? Permissao.ADMINISTRADOR
                : usuarioLogado.getPermissaoId();
        return Response.ok(Map.of(
                "username", usuarioLogado.getUsername() == null ? "" : usuarioLogado.getUsername(),
                "nome", usuarioLogado.getNome() == null ? "" : usuarioLogado.getNome(),
                "permissaoId", permissaoId,
                "permissao", Permissao.nome(permissaoId))).build();
    }

    // Perfil completo do usuario logado (inclui id somente leitura e data de
    // criacao), usado na tela de configuracoes.
    @GET
    @Path("/perfil")
    public Response perfil() {
        return Response.ok(usuarioService.buscarPerfil()).build();
    }

    // Atualiza nome e nome de usuario. Como esses dados vao no JWT (usados pelo
    // filtro de autenticacao e pelo cabecalho), o token/cookie e regerado.
    @PUT
    @Path("/perfil")
    public Response atualizarPerfil(@Valid AtualizarPerfilRequestDTO dto) {
        UsuarioPerfilResponseDTO perfil = usuarioService.atualizarPerfil(dto);

        String token = jwtService.gerarToken(
                perfil.getId(), perfil.getUsername(), perfil.getNome(),
                perfil.getPermissaoId(), perfil.getContaId());
        NewCookie cookie = construirCookie(token, (int) jwtService.getExpirationSegundos());

        // Sincroniza o contexto da requisicao atual com os novos dados.
        usuarioLogado.setUsername(perfil.getUsername());
        usuarioLogado.setNome(perfil.getNome());

        Integer permissaoId = perfil.getPermissaoId() == null
                ? Permissao.ADMINISTRADOR
                : perfil.getPermissaoId();
        return Response.ok(Map.of(
                        "username", perfil.getUsername(),
                        "nome", perfil.getNome() == null ? "" : perfil.getNome(),
                        "permissaoId", permissaoId,
                        "permissao", Permissao.nome(permissaoId)))
                .cookie(cookie)
                .build();
    }

    @PUT
    @Path("/senha")
    public Response alterarSenha(@Valid AlterarSenhaRequestDTO dto) {
        usuarioService.alterarSenha(dto);
        return Response.ok(Map.of("message", "Senha alterada com sucesso.")).build();
    }

    /**
     * Utilitario SOMENTE em desenvolvimento para gerar o hash BCrypt de uma senha,
     * facilitando a criacao manual de usuarios no banco. Indisponivel em producao.
     */
    @GET
    @Path("/gerar-hash")
    @Produces(MediaType.TEXT_PLAIN)
    public Response gerarHash(@QueryParam("senha") String senha) {
        if (LaunchMode.current() != LaunchMode.DEVELOPMENT) {
            throw new ResourceNotFoundException("Recurso indisponível.");
        }
        if (senha == null || senha.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Informe a senha em ?senha=...").build();
        }
        return Response.ok(authService.gerarHash(senha)).build();
    }

    private NewCookie construirCookie(String valor, int maxAgeSegundos) {
        return new NewCookie.Builder(cookieName)
                .value(valor)
                .path("/")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite(NewCookie.SameSite.LAX)
                .maxAge(maxAgeSegundos)
                .build();
    }
}
