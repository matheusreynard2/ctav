package com.ctav.api.controller;

import com.ctav.api.dto.PertenceResponseDTO;
import com.ctav.api.service.PertenceService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;

/**
 * Listagem geral de pertences (de todos os acolhidos do usuário logado), usada
 * pela página de CRUD separado de pertences. A criação, edição, exclusão e o
 * gerenciamento de fotos continuam nas rotas aninhadas por acolhido
 * ({@link PertenceController}).
 */
@Path("/api/pertences")
@Produces(MediaType.APPLICATION_JSON)
public class PertenceGeralController {

    @Inject
    PertenceService pertenceService;

    @GET
    public Response listar() {
        List<PertenceResponseDTO> lista = pertenceService.listarTodos();
        return Response.ok(lista).build();
    }
}
