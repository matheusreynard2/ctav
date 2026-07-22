package com.ctav.api.controller;

import com.ctav.api.dto.EstoqueReservadoRequestDTO;
import com.ctav.api.dto.PrescricaoRequestDTO;
import com.ctav.api.dto.PrescricaoResponseDTO;
import com.ctav.api.service.PrescricaoService;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

@Path("/api/acolhidos/{acolhidoId}/prescricoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PrescricaoController {

    @Inject
    PrescricaoService prescricaoService;

    @PUT
    @Path("/doses")
    public Response atualizarDoses(@PathParam("acolhidoId") Long acolhidoId,
                                   @Valid List<PrescricaoRequestDTO> dtos) {
        List<PrescricaoResponseDTO> lista = prescricaoService.atualizarDoses(acolhidoId, dtos);
        return Response.ok(lista).build();
    }

    // Reconcilia toda a lista de prescrições do acolhido (vínculo, reserva e
    // doses) — usada pela página de controle total de medicação.
    @PUT
    public Response sincronizar(@PathParam("acolhidoId") Long acolhidoId,
                                @Valid List<PrescricaoRequestDTO> dtos) {
        List<PrescricaoResponseDTO> lista =
                prescricaoService.sincronizarPrescricoes(acolhidoId, dtos);
        return Response.ok(lista).build();
    }

    @PUT
    @Path("/{medicamentoId}/estoque")
    public Response atualizarEstoqueReservado(
            @PathParam("acolhidoId") Long acolhidoId,
            @PathParam("medicamentoId") Long medicamentoId,
            @Valid EstoqueReservadoRequestDTO dto) {
        PrescricaoResponseDTO atualizada = prescricaoService.atualizarEstoqueReservado(
                acolhidoId, medicamentoId, dto.getTotalComprimidos());
        return Response.ok(atualizada).build();
    }
}
