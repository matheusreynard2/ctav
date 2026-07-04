package com.ctav.api.controller;

import com.ctav.api.dto.CombinadoRequestDTO;
import com.ctav.api.dto.CombinadoResponseDTO;
import com.ctav.api.service.CombinadoService;

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

@Path("/api/combinados")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class CombinadoController {

    @Inject
    CombinadoService combinadoService;

    @POST
    public Response criar(@Valid CombinadoRequestDTO dto) {
        CombinadoResponseDTO criado = combinadoService.criar(dto);
        return Response.ok(criado).build();
    }

    @GET
    public Response listar() {
        List<CombinadoResponseDTO> lista = combinadoService.listar();
        return Response.ok(lista).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(combinadoService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid CombinadoRequestDTO dto) {
        return Response.ok(combinadoService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        combinadoService.deletar(id);
        return Response.noContent().build();
    }
}
