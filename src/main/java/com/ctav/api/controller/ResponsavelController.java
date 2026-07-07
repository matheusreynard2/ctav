package com.ctav.api.controller;

import com.ctav.api.dto.ResponsavelRequestDTO;
import com.ctav.api.dto.ResponsavelResponseDTO;
import com.ctav.api.service.ResponsavelService;

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

@Path("/api/responsaveis")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ResponsavelController {

    @Inject
    ResponsavelService responsavelService;

    @GET
    public Response listar() {
        List<ResponsavelResponseDTO> lista = responsavelService.listar();
        return Response.ok(lista).build();
    }

    @POST
    public Response criar(@Valid ResponsavelRequestDTO dto) {
        return Response.ok(responsavelService.criar(dto)).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(responsavelService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid ResponsavelRequestDTO dto) {
        return Response.ok(responsavelService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        responsavelService.deletar(id);
        return Response.noContent().build();
    }
}
