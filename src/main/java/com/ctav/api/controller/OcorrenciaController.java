package com.ctav.api.controller;

import com.ctav.api.dto.OcorrenciaRequestDTO;
import com.ctav.api.dto.OcorrenciaResponseDTO;
import com.ctav.api.service.OcorrenciaService;

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

@Path("/api/ocorrencias")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class OcorrenciaController {

    @Inject
    OcorrenciaService ocorrenciaService;

    @POST
    public Response criar(@Valid OcorrenciaRequestDTO dto) {
        OcorrenciaResponseDTO criada = ocorrenciaService.criar(dto);
        return Response.ok(criada).build();
    }

    @GET
    public Response listar() {
        List<OcorrenciaResponseDTO> lista = ocorrenciaService.listar();
        return Response.ok(lista).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(ocorrenciaService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid OcorrenciaRequestDTO dto) {
        return Response.ok(ocorrenciaService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        ocorrenciaService.deletar(id);
        return Response.noContent().build();
    }
}
