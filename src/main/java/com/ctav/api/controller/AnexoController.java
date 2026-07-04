package com.ctav.api.controller;

import com.ctav.api.dto.AnexoRequestDTO;
import com.ctav.api.dto.AnexoResponseDTO;
import com.ctav.api.service.AnexoService;
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
import java.util.Map;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/acolhidos/{acolhidoId}/anexos")
@Produces(MediaType.APPLICATION_JSON)
public class AnexoController {

    @Inject
    AnexoService anexoService;

    @POST
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response criar(@PathParam("acolhidoId") Long acolhidoId,
                          @RestForm("arquivo") FileUpload arquivo,
                          @RestForm("nomeArquivo") String nomeArquivo,
                          @RestForm("tipo") String tipo) {
        AnexoResponseDTO criado = anexoService.criar(acolhidoId, arquivo, nomeArquivo, tipo);
        return Response.status(Response.Status.CREATED).entity(criado).build();
    }

    @GET
    public Response listar(@PathParam("acolhidoId") Long acolhidoId) {
        List<AnexoResponseDTO> lista = anexoService.listar(acolhidoId);
        return Response.ok(lista).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("id") Long id) {
        return Response.ok(anexoService.buscarPorId(id)).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response atualizar(@PathParam("id") Long id, @Valid AnexoRequestDTO dto) {
        return Response.ok(anexoService.atualizar(id, dto)).build();
    }

    @GET
    @Path("/{id}/download")
    public Response download(@PathParam("id") Long id) {
        String url = anexoService.gerarLinkDownload(id);
        return Response.ok(Map.of("url", url)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        anexoService.deletar(id);
        return Response.noContent().build();
    }
}
