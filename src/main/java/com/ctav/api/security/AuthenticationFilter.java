package com.ctav.api.security;

import com.auth0.jwt.interfaces.DecodedJWT;
import com.ctav.api.service.JwtService;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.Cookie;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;
import java.util.Set;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@Priority(Priorities.AUTHENTICATION)
public class AuthenticationFilter implements ContainerRequestFilter {

    // Rotas sob /api que NAO exigem autenticacao.
    private static final Set<String> ROTAS_PUBLICAS = Set.of(
            "api/auth/login",
            "api/auth/logout",
            "api/auth/gerar-hash");

    @Inject
    JwtService jwtService;

    @Inject
    UsuarioLogado usuarioLogado;

    @ConfigProperty(name = "app.auth.cookie.name")
    String cookieName;

    @Override
    public void filter(ContainerRequestContext ctx) {
        // Libera preflight CORS.
        if ("OPTIONS".equalsIgnoreCase(ctx.getMethod())) {
            return;
        }

        String path = normalizar(ctx.getUriInfo().getPath());

        // Apenas as rotas da API sao protegidas (estaticos do SPA nao passam aqui).
        if (!path.startsWith("api/")) {
            return;
        }

        if (ROTAS_PUBLICAS.contains(path)) {
            return;
        }

        Cookie cookie = obterCookie(ctx);
        if (cookie == null || cookie.getValue() == null || cookie.getValue().isBlank()) {
            abortar(ctx);
            return;
        }

        try {
            DecodedJWT jwt = jwtService.validar(cookie.getValue());
            Long uid = jwt.getClaim("uid").asLong();
            if (uid == null) {
                // Token antigo sem o identificador do usuario: forca novo login.
                abortar(ctx);
                return;
            }
            usuarioLogado.setId(uid);
            usuarioLogado.setUsername(jwt.getSubject());
            usuarioLogado.setNome(jwt.getClaim("nome").asString());
        } catch (Exception ex) {
            abortar(ctx);
        }
    }

    private Cookie obterCookie(ContainerRequestContext ctx) {
        Map<String, Cookie> cookies = ctx.getCookies();
        return cookies == null ? null : cookies.get(cookieName);
    }

    private void abortar(ContainerRequestContext ctx) {
        ctx.abortWith(
                Response.status(Response.Status.UNAUTHORIZED)
                        .header(HttpHeaders.CONTENT_TYPE, "application/json")
                        .entity(Map.of("message", "Não autenticado."))
                        .build());
    }

    private String normalizar(String path) {
        if (path == null) {
            return "";
        }
        return path.startsWith("/") ? path.substring(1) : path;
    }
}
