package com.ctav.api.controller;

import com.ctav.api.dto.AlterarPermissaoRequestDTO;
import com.ctav.api.dto.AtualizarUsuarioRequestDTO;
import com.ctav.api.dto.CriarUsuarioRequestDTO;
import com.ctav.api.service.UsuarioService;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

// Gestão de usuários da conta (somente administrador). O acesso já é restrito
// pelo filtro de autorização; os serviços reforçam a checagem de permissão.
@Path("/api/usuarios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UsuarioController {

    @Inject
    UsuarioService usuarioService;

    @GET
    public Response listar() {
        return Response.ok(usuarioService.listarUsuariosDaConta()).build();
    }

    @POST
    public Response criar(@Valid CriarUsuarioRequestDTO dto) {
        return Response.status(Response.Status.CREATED)
                .entity(usuarioService.criarUsuario(dto))
                .build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id,
                              @Valid AtualizarUsuarioRequestDTO dto) {
        return Response.ok(usuarioService.atualizarUsuario(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        usuarioService.excluirUsuario(id);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}/permissao")
    public Response alterarPermissao(@PathParam("id") Long id,
                                     @Valid AlterarPermissaoRequestDTO dto) {
        return Response.ok(usuarioService.alterarPermissao(id, dto.getPermissaoId())).build();
    }
}
