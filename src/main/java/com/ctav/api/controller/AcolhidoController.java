package com.ctav.api.controller;

import com.ctav.api.dto.AcolhidoRequestDTO;
import com.ctav.api.dto.AcolhidoResponseDTO;
import com.ctav.api.dto.AssinaturasRequestDTO;
import com.ctav.api.service.AcolhidoService;

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
import java.util.List;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/acolhidos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AcolhidoController {

    @Inject
    AcolhidoService acolhidoService;

    @POST
    public Response criar(@Valid AcolhidoRequestDTO dto) {
        AcolhidoResponseDTO criado = acolhidoService.criar(dto);
        return Response.ok(criado).build();
    }

    @GET
    public Response listar() {
        List<AcolhidoResponseDTO> lista = acolhidoService.listar();
        return Response.ok(lista).build();
    }

    @GET
    @Path("/historico")
    public Response listarHistorico() {
        return Response.ok(acolhidoService.listarHistorico()).build();
    }

    @POST
    @Path("/historico")
    public Response arquivar(List<Long> ids) {
        int total = acolhidoService.arquivar(ids);
        return Response.ok(java.util.Map.of("arquivados", total)).build();
    }

    @POST
    @Path("/{id}/restaurar")
    public Response restaurar(@PathParam("id") Long id) {
        return Response.ok(acolhidoService.restaurar(id)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(acolhidoService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid AcolhidoRequestDTO dto) {
        return Response.ok(acolhidoService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        acolhidoService.deletar(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/foto")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response enviarFoto(@PathParam("id") Long id,
                               @RestForm("arquivo") FileUpload arquivo) {
        return Response.ok(acolhidoService.salvarFoto(id, arquivo)).build();
    }

    @DELETE
    @Path("/{id}/foto")
    public Response removerFoto(@PathParam("id") Long id) {
        return Response.ok(acolhidoService.removerFoto(id)).build();
    }

    @PUT
    @Path("/{id}/assinaturas")
    public Response atualizarAssinaturas(@PathParam("id") Long id, AssinaturasRequestDTO dto) {
        return Response.ok(acolhidoService.atualizarAssinaturas(
                id,
                dto.getAssinaturaAcolhido())).build();
    }
}
