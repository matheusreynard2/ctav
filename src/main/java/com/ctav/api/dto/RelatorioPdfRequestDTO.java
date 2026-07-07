package com.ctav.api.dto;

import com.fasterxml.jackson.databind.JsonNode;

// Recebe o pedido de geracao de PDF vindo do frontend. O campo "dados" e
// repassado tal e qual para a Lambda (que ja calcula o layout), por isso e um
// JsonNode generico: cada "tipo" espera uma estrutura diferente de dados.
public class RelatorioPdfRequestDTO {

    public String tipo;
    public JsonNode dados;
}
