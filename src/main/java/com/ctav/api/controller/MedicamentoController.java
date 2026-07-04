package com.ctav.api.controller;

import com.ctav.api.dto.MedicamentoRequestDTO;
import com.ctav.api.dto.MedicamentoResponseDTO;
import com.ctav.api.service.MedicamentoService;

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

@Path("/api/medicamentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class MedicamentoController {

    @Inject
    MedicamentoService medicamentoService;

    @POST
    public Response criar(@Valid MedicamentoRequestDTO dto) {
        MedicamentoResponseDTO criado = medicamentoService.criar(dto);
        return Response.ok(criado).build();
    }

    @GET
    public Response listar() {
        List<MedicamentoResponseDTO> lista = medicamentoService.listar();
        return Response.ok(lista).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(medicamentoService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid MedicamentoRequestDTO dto) {
        return Response.ok(medicamentoService.atualizar(id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        medicamentoService.deletar(id);
        return Response.noContent().build();
    }
}
