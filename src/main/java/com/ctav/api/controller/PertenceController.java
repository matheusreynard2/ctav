package com.ctav.api.controller;

import com.ctav.api.dto.PertenceRequestDTO;
import com.ctav.api.dto.PertenceResponseDTO;
import com.ctav.api.service.PertenceService;
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

@Path("/api/acolhidos/{acolhidoId}/pertences")
@Produces(MediaType.APPLICATION_JSON)
public class PertenceController {

    @Inject
    PertenceService pertenceService;

    @GET
    public Response listar(@PathParam("acolhidoId") Long acolhidoId) {
        List<PertenceResponseDTO> lista = pertenceService.listar(acolhidoId);
        return Response.ok(lista).build();
    }

    @POST
    @Consumes(MediaType.APPLICATION_JSON)
    public Response criar(@PathParam("acolhidoId") Long acolhidoId,
                          @Valid PertenceRequestDTO dto) {
        PertenceResponseDTO criado = pertenceService.criar(acolhidoId, dto);
        return Response.status(Response.Status.CREATED).entity(criado).build();
    }

    @GET
    @Path("/{id}")
    public Response buscarPorId(@PathParam("acolhidoId") Long acolhidoId,
                                @PathParam("id") Long id) {
        return Response.ok(pertenceService.buscarPorId(acolhidoId, id)).build();
    }

    @PUT
    @Path("/{id}")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response atualizar(@PathParam("acolhidoId") Long acolhidoId,
                              @PathParam("id") Long id,
                              @Valid PertenceRequestDTO dto) {
        return Response.ok(pertenceService.atualizar(acolhidoId, id, dto)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("acolhidoId") Long acolhidoId,
                            @PathParam("id") Long id) {
        pertenceService.deletar(acolhidoId, id);
        return Response.noContent().build();
    }

    // ===== Fotos do pertence (CRUD) =====

    @POST
    @Path("/{pertenceId}/fotos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response adicionarFoto(@PathParam("acolhidoId") Long acolhidoId,
                                  @PathParam("pertenceId") Long pertenceId,
                                  @RestForm("arquivo") FileUpload arquivo) {
        return Response.status(Response.Status.CREATED)
                .entity(pertenceService.adicionarFoto(acolhidoId, pertenceId, arquivo))
                .build();
    }

    @DELETE
    @Path("/{pertenceId}/fotos/{fotoId}")
    public Response deletarFoto(@PathParam("acolhidoId") Long acolhidoId,
                                @PathParam("pertenceId") Long pertenceId,
                                @PathParam("fotoId") Long fotoId) {
        pertenceService.deletarFoto(acolhidoId, pertenceId, fotoId);
        return Response.noContent().build();
    }
}
