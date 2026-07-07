package com.ctav.api.controller;

import com.ctav.api.dto.RelatorioPdfRequestDTO;
import com.ctav.api.service.RelatorioService;

import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/relatorios")
public class RelatorioController {

    @Inject
    RelatorioService relatorioService;

    // Gera o PDF do relatorio na Lambda e devolve os bytes para download.
    // O nome do arquivo e definido pelo frontend (que possui todos os dados).
    @POST
    @Path("/pdf")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces("application/pdf")
    public Response gerarPdf(RelatorioPdfRequestDTO req) {
        byte[] pdf = relatorioService.gerarPdf(req);
        return Response.ok(pdf)
                .type("application/pdf")
                .header("Content-Disposition", "attachment; filename=\"relatorio.pdf\"")
                .build();
    }
}
