package com.ctav.api.controller;

import com.ctav.api.dto.MotivoRequestDTO;
import com.ctav.api.dto.MotivoResponseDTO;
import com.ctav.api.enums.CategoriaMotivo;
import com.ctav.api.service.MotivoService;

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
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/motivos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MotivoController {

    @Inject
    MotivoService motivoService;

    // categoria: ADESAO ou DESISTENCIA. Ex.: GET /api/motivos?categoria=ADESAO
    @GET
    public Response listar(@QueryParam("categoria") CategoriaMotivo categoria) {
        List<MotivoResponseDTO> lista = motivoService.listar(
                categoria == null ? CategoriaMotivo.ADESAO : categoria);
        return Response.ok(lista).build();
    }

    @POST
    public Response criar(@Valid MotivoRequestDTO dto) {
        return Response.ok(motivoService.criar(dto)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(motivoService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid MotivoRequestDTO dto) {
        return Response.ok(motivoService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        motivoService.deletar(id);
        return Response.noContent().build();
    }
}
