package com.ctav.api.security;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.util.Map;

/**
 * Restringe os endpoints da API conforme a permissão do usuário autenticado.
 *
 * <ul>
 *   <li>Administrador (1): acesso total.</li>
 *   <li>Psicólogo (2) e Advogado (3): acesso somente ao necessário para as
 *       páginas de início e de relatórios (leitura de acolhidos/administrações
 *       e geração de PDF de relatórios), além das rotas da própria conta.</li>
 * </ul>
 *
 * Executa depois do {@link AuthenticationFilter} (que popula o usuário logado).
 */
@Provider
@Priority(Priorities.AUTHORIZATION)
public class AutorizacaoFilter implements ContainerRequestFilter {

    @Inject
    UsuarioLogado usuarioLogado;

    @Override
    public void filter(ContainerRequestContext ctx) {
        if ("OPTIONS".equalsIgnoreCase(ctx.getMethod())) {
            return;
        }

        String path = normalizar(ctx.getUriInfo().getPath());
        if (!path.startsWith("api/")) {
            return;
        }

        // Administrador (ou token legado sem permissão) tem acesso total.
        if (Permissao.isAdministrador(usuarioLogado.getPermissaoId())) {
            return;
        }

        if (permitidoParaAcessoRestrito(ctx.getMethod(), path)) {
            return;
        }

        // Psicólogo (2): além do acesso restrito comum, gerencia o CRUD de
        // agendamento de consultas.
        if (Permissao.PSICOLOGO == valorPermissao(usuarioLogado.getPermissaoId())
                && path.startsWith("api/consultas")) {
            return;
        }

        ctx.abortWith(
                Response.status(Response.Status.FORBIDDEN)
                        .header(HttpHeaders.CONTENT_TYPE, "application/json")
                        .entity(Map.of(
                                "message",
                                "Você não tem permissão para acessar este recurso."))
                        .build());
    }

    /**
     * Endpoints liberados para os perfis psicólogo/advogado (páginas de início
     * e de relatórios).
     */
    private boolean permitidoParaAcessoRestrito(String metodo, String path) {
        boolean ehGet = "GET".equalsIgnoreCase(metodo);
        boolean ehPost = "POST".equalsIgnoreCase(metodo);

        // Rotas da própria conta (sessão, perfil, senha, logout).
        if (path.startsWith("api/auth/")) {
            return true;
        }

        // Dados de leitura usados pelos relatórios (lista de acolhidos ativos e
        // do histórico) e pela página inicial.
        if (ehGet && (path.equals("api/acolhidos") || path.equals("api/acolhidos/historico"))) {
            return true;
        }

        // Registros de administração de medicamentos (base do relatório de
        // controle): api/acolhidos/{id}/administracoes[...]
        String[] partes = path.split("/");
        if (ehGet
                && partes.length >= 4
                && partes[0].equals("api")
                && partes[1].equals("acolhidos")
                && partes[3].equals("administracoes")) {
            return true;
        }

        // Geração do PDF de relatórios.
        if (ehPost && path.equals("api/relatorios/pdf")) {
            return true;
        }

        return false;
    }

    private int valorPermissao(Integer permissaoId) {
        return permissaoId == null ? Permissao.ADMINISTRADOR : permissaoId;
    }

    private String normalizar(String path) {
        if (path == null) {
            return "";
        }
        return path.startsWith("/") ? path.substring(1) : path;
    }
}
