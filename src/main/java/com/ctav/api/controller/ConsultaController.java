package com.ctav.api.controller;

import com.ctav.api.dto.ConcluirConsultaRequestDTO;
import com.ctav.api.dto.ConsultaRequestDTO;
import com.ctav.api.dto.ConsultaResponseDTO;
import com.ctav.api.service.ConsultaService;

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

@Path("/api/consultas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class ConsultaController {

    @Inject
    ConsultaService consultaService;

    @POST
    public Response criar(@Valid ConsultaRequestDTO dto) {
        ConsultaResponseDTO criado = consultaService.criar(dto);
        return Response.ok(criado).build();
    }

    @GET
    public Response listar() {
        List<ConsultaResponseDTO> lista = consultaService.listar();
        return Response.ok(lista).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(consultaService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, @Valid ConsultaRequestDTO dto) {
        return Response.ok(consultaService.atualizar(id, dto)).build();
    }

    @PUT
    @Path("/{id}/concluir")
    public Response concluir(@PathParam("id") Long id,
                             @Valid ConcluirConsultaRequestDTO dto) {
        String resumo = dto != null ? dto.getResumo() : null;
        return Response.ok(consultaService.concluir(id, resumo)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        consultaService.deletar(id);
        return Response.noContent().build();
    }
}
