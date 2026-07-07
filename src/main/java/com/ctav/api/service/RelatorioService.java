package com.ctav.api.service;

import com.ctav.api.dto.RelatorioPdfRequestDTO;
import com.ctav.api.exception.BusinessException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.http.urlconnection.UrlConnectionHttpClient;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.lambda.LambdaClient;
import software.amazon.awssdk.services.lambda.model.InvokeRequest;
import software.amazon.awssdk.services.lambda.model.InvokeResponse;

// Encaminha a geracao de PDF de relatorios para uma funcao Lambda na AWS.
// Em desenvolvimento local, pode usar o script Node (invoke-local.mjs) quando
// a credencial local nao tem permissao lambda:InvokeFunction.
@ApplicationScoped
public class RelatorioService {

    private static final Logger LOG = Logger.getLogger(RelatorioService.class);

    private static final Set<String> TIPOS_VALIDOS =
            Set.of("quadro-mensal", "altas", "controle", "todos", "tutorial");

    @Inject
    ObjectMapper objectMapper;

    @ConfigProperty(name = "app.relatorios.lambda.function-name")
    String functionName;

    @ConfigProperty(name = "app.aws.region")
    String region;

    @ConfigProperty(name = "app.relatorios.local-node.enabled", defaultValue = "false")
    boolean localNodeEnabled;

    @ConfigProperty(name = "app.relatorios.local-node.script", defaultValue = "lambda/relatorios-pdf/invoke-local.mjs")
    String localNodeScript;

    private LambdaClient lambda;

    @PostConstruct
    void init() {
        if (!localNodeEnabled) {
            this.lambda = LambdaClient.builder()
                    .region(Region.of(region))
                    .httpClientBuilder(UrlConnectionHttpClient.builder())
                    .build();
        }
    }

    @PreDestroy
    void destroy() {
        if (lambda != null) {
            lambda.close();
        }
    }

    public byte[] gerarPdf(RelatorioPdfRequestDTO req) {
        if (req == null || req.tipo == null || !TIPOS_VALIDOS.contains(req.tipo)) {
            throw new BusinessException("Tipo de relatório inválido.");
        }
        boolean semDados = req.dados == null || req.dados.isNull();
        if (!"tutorial".equals(req.tipo) && semDados) {
            throw new BusinessException("Dados do relatório ausentes.");
        }

        String payload = montarPayload(req);

        if (localNodeEnabled) {
            return invocarNodeLocal(payload);
        }
        return invocarLambda(payload);
    }

    private byte[] invocarLambda(String payload) {
        InvokeResponse resposta;
        try {
            resposta = lambda.invoke(InvokeRequest.builder()
                    .functionName(functionName)
                    .payload(SdkBytes.fromUtf8String(payload))
                    .build());
        } catch (RuntimeException ex) {
            LOG.errorf(ex, "Falha ao invocar Lambda %s", functionName);
            throw new BusinessException(
                    "Não foi possível gerar o PDF. Verifique se a função Lambda está "
                            + "configurada e se a EC2/usuário tem permissão lambda:InvokeFunction.");
        }

        if (resposta.functionError() != null) {
            String detalhe = resposta.payload() != null
                    ? resposta.payload().asUtf8String()
                    : resposta.functionError();
            LOG.errorf("Lambda retornou erro: %s — %s", resposta.functionError(), detalhe);
            throw new BusinessException(
                    "Falha ao gerar o PDF na Lambda. Atualize o código da função "
                            + functionName + " na AWS (região " + region + ").");
        }

        return extrairPdfDeJson(resposta.payload().asUtf8String());
    }

    private byte[] invocarNodeLocal(String payload) {
        Path script = Path.of(localNodeScript).toAbsolutePath().normalize();
        if (!Files.isRegularFile(script)) {
            throw new BusinessException(
                    "Script local de PDF não encontrado: " + script
                            + ". Rode npm install em lambda/relatorios-pdf.");
        }

        ProcessBuilder pb = new ProcessBuilder("node", script.toString());
        pb.redirectErrorStream(true);
        pb.directory(script.getParent().toFile());

        try {
            Process processo = pb.start();

            try (OutputStream stdin = processo.getOutputStream()) {
                stdin.write(payload.getBytes(StandardCharsets.UTF_8));
            }

            String saida;
            try (InputStream stdout = processo.getInputStream()) {
                saida = new String(stdout.readAllBytes(), StandardCharsets.UTF_8);
            }

            boolean terminou = processo.waitFor(60, TimeUnit.SECONDS);
            if (!terminou) {
                processo.destroyForcibly();
                throw new BusinessException("Tempo esgotado ao gerar o PDF localmente.");
            }
            if (processo.exitValue() != 0) {
                LOG.errorf("Node retornou código %d: %s", processo.exitValue(), saida);
                throw new BusinessException(
                        "Falha ao gerar o PDF localmente. Confira se o Node.js está instalado "
                                + "e se rodou npm install em lambda/relatorios-pdf.");
            }

            return extrairPdfDeJson(saida);
        } catch (BusinessException ex) {
            throw ex;
        } catch (IOException | InterruptedException ex) {
            Thread.currentThread().interrupt();
            LOG.error("Erro ao executar script Node de PDF", ex);
            throw new BusinessException(
                    "Não foi possível executar o gerador local de PDF (Node.js).");
        }
    }

    private String montarPayload(RelatorioPdfRequestDTO req) {
        ObjectNode raiz = objectMapper.createObjectNode();
        raiz.put("tipo", req.tipo);
        raiz.set("dados", req.dados == null ? objectMapper.createObjectNode() : req.dados);
        try {
            return objectMapper.writeValueAsString(raiz);
        } catch (Exception ex) {
            throw new BusinessException("Não foi possível preparar os dados do relatório.");
        }
    }

    private byte[] extrairPdfDeJson(String json) {
        try {
            JsonNode corpo = objectMapper.readTree(json);
            JsonNode base64 = corpo.get("pdfBase64");
            if (base64 == null || !base64.isTextual() || base64.asText().isBlank()) {
                throw new BusinessException("O gerador de PDF não retornou um arquivo válido.");
            }
            return Base64.getDecoder().decode(base64.asText());
        } catch (BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BusinessException("Resposta inválida ao gerar o PDF do relatório.");
        }
    }
}
