package com.ctav.api.controller;

import com.ctav.api.dto.LoginRequestDTO;
import com.ctav.api.entity.Usuario;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.security.UsuarioLogado;
import com.ctav.api.service.AuthService;
import com.ctav.api.service.JwtService;

import io.quarkus.runtime.LaunchMode;
import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
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
                usuario.getId(), usuario.getUsername(), usuario.getNome());

        NewCookie cookie = construirCookie(token, (int) jwtService.getExpirationSegundos());

        return Response.ok(Map.of(
                        "username", usuario.getUsername(),
                        "nome", usuario.getNome() == null ? "" : usuario.getNome()))
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
        return Response.ok(Map.of(
                "username", usuarioLogado.getUsername() == null ? "" : usuarioLogado.getUsername(),
                "nome", usuarioLogado.getNome() == null ? "" : usuarioLogado.getNome())).build();
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
