package com.ctav.api.controller;

import com.ctav.api.dto.AdministracaoRequestDTO;
import com.ctav.api.dto.AdministracaoResponseDTO;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.service.AdministracaoService;

import jakarta.inject.Inject;
import jakarta.validation.Valid;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.time.LocalDate;
import java.time.format.DateTimeParseException;
import java.util.List;

@Path("/api/acolhidos/{acolhidoId}/administracoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AdministracaoController {

    @Inject
    AdministracaoService administracaoService;

    @GET
    public Response listar(@PathParam("acolhidoId") Long acolhidoId,
                           @QueryParam("data") String data,
                           @QueryParam("ano") Integer ano,
                           @QueryParam("mes") Integer mes) {
        List<AdministracaoResponseDTO> lista;
        if (ano != null && mes != null) {
            validarAnoMes(ano, mes);
            lista = administracaoService.listarMes(acolhidoId, ano, mes);
        } else if (data != null && !data.isBlank()) {
            lista = administracaoService.listar(acolhidoId, parseData(data));
        } else {
            throw new BusinessException(
                    "Informe a data (AAAA-MM-DD) ou o ano e o mês (parâmetros 'ano' e 'mes').");
        }
        return Response.ok(lista).build();
    }

    @PUT
    public Response registrar(@PathParam("acolhidoId") Long acolhidoId,
                              @Valid AdministracaoRequestDTO dto) {
        return Response.ok(administracaoService.registrar(acolhidoId, dto)).build();
    }

    private LocalDate parseData(String data) {
        try {
            return LocalDate.parse(data);
        } catch (DateTimeParseException e) {
            throw new BusinessException("Data inválida. Use o formato AAAA-MM-DD.");
        }
    }

    private void validarAnoMes(int ano, int mes) {
        if (ano < 1900 || ano > 2100) {
            throw new BusinessException("Ano inválido.");
        }
        if (mes < 1 || mes > 12) {
            throw new BusinessException("Mês inválido. Use um valor entre 1 e 12.");
        }
    }
}
