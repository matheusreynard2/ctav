package com.ctav.api.service;

import com.ctav.api.dto.AnexoRequestDTO;
import com.ctav.api.dto.AnexoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Anexo;
import com.ctav.api.enums.TipoAnexo;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.AnexoRepository;
import com.ctav.api.security.UsuarioContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@ApplicationScoped
public class AnexoService {

    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of("application/pdf", "image/jpeg", "image/png",
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    private static final long TAMANHO_MAX = 10 * 1024 * 1024;
    private static final int MAX_ANEXOS = 50;

    @Inject
    S3Client s3;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    AnexoRepository anexoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @ConfigProperty(name = "app.anexos.bucket")
    String bucket;

    @Transactional
    public AnexoResponseDTO criar(Long acolhidoId, FileUpload arquivo, String nomeArquivo, String tipo) {
        Acolhido acolhido = buscarAcolhidoPorId(acolhidoId);
        validarArquivo(arquivo);
        validarLimiteAnexos(acolhidoId);

        String contentType = arquivo.contentType();
        String nomeArquivoFinal = resolverNomeArquivo(nomeArquivo, arquivo.fileName());
        TipoAnexo tipoAnexo = parseTipo(tipo);

        String chave = "acolhidos/" + acolhidoId + "/"
                + UUID.randomUUID() + "-" + arquivo.fileName();

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(chave)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromFile(arquivo.uploadedFile()));

        Anexo anexo = Anexo.builder()
                .nomeArquivo(nomeArquivoFinal)
                .contentType(contentType)
                .tamanhoBytes(arquivo.size())
                .tipo(tipoAnexo)
                .chaveS3(chave)
                .acolhido(acolhido)
                .build();

        anexoRepository.persist(anexo);
        return AnexoResponseDTO.fromEntity(anexo);
    }

    public List<AnexoResponseDTO> listar(Long acolhidoId) {
        buscarAcolhidoPorId(acolhidoId);
        return anexoRepository.listarPorAcolhido(acolhidoId)
                .stream()
                .map(AnexoResponseDTO::fromEntity)
                .toList();
    }

    public AnexoResponseDTO buscarPorId(Long id) {
        return AnexoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public AnexoResponseDTO atualizar(Long id, AnexoRequestDTO dto) {
        Anexo anexo = buscarEntidadePorId(id);
        anexo.setNomeArquivo(dto.getNomeArquivo().trim());
        anexo.setTipo(dto.getTipo());
        anexoRepository.persist(anexo);
        return AnexoResponseDTO.fromEntity(anexo);
    }

    public String gerarLinkDownload(Long id) {
        Anexo anexo = buscarEntidadePorId(id);

        try (S3Presigner presigner = S3Presigner.builder()
                .region(Region.SA_EAST_1)
                .build()) {
            GetObjectPresignRequest req = GetObjectPresignRequest.builder()
                    .signatureDuration(Duration.ofMinutes(15))
                    .getObjectRequest(b -> b.bucket(bucket).key(anexo.getChaveS3()))
                    .build();
            return presigner.presignGetObject(req).url().toString();
        }
    }

    @Transactional
    public void deletar(Long id) {
        Anexo anexo = buscarEntidadePorId(id);
        s3.deleteObject(b -> b.bucket(bucket).key(anexo.getChaveS3()));
        anexoRepository.delete(anexo);
    }

    private Acolhido buscarAcolhidoPorId(Long id) {
        return acolhidoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + id));
    }

    private Anexo buscarEntidadePorId(Long id) {
        Anexo anexo = anexoRepository.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Anexo não encontrado com o id: " + id));
        // Garante que o anexo pertence a um acolhido do usuario logado.
        if (anexo.getAcolhido() == null
                || anexo.getAcolhido().getUsuario() == null
                || !usuarioContext.id().equals(anexo.getAcolhido().getUsuario().getId())) {
            throw new ResourceNotFoundException("Anexo não encontrado com o id: " + id);
        }
        return anexo;
    }

    private void validarArquivo(FileUpload arquivo) {
        if (arquivo == null || arquivo.fileName() == null || arquivo.fileName().isBlank()) {
            throw new BusinessException("Selecione um arquivo para enviar.");
        }

        String contentType = arquivo.contentType();
        if (contentType == null || !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BusinessException("Só são aceitos PDF, JPG, PNG ou Excel (.xlsx).");
        }

        if (arquivo.size() > TAMANHO_MAX) {
            throw new BusinessException("Arquivo excede o limite de 10 MB.");
        }
    }

    private void validarLimiteAnexos(Long acolhidoId) {
        if (anexoRepository.contarPorAcolhido(acolhidoId) >= MAX_ANEXOS) {
            throw new BusinessException("Limite de " + MAX_ANEXOS + " anexos atingido.");
        }
    }

    private TipoAnexo parseTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new BusinessException("Informe o tipo do anexo.");
        }
        try {
            return TipoAnexo.valueOf(tipo.trim().toUpperCase());
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Tipo de anexo inválido: " + tipo);
        }
    }

    private String resolverNomeArquivo(String nomeArquivoInformado, String nomeArquivoUpload) {
        if (nomeArquivoInformado != null && !nomeArquivoInformado.isBlank()) {
            return nomeArquivoInformado.trim();
        }
        if (nomeArquivoUpload == null || nomeArquivoUpload.isBlank()) {
            throw new BusinessException("O nome do arquivo é obrigatório.");
        }
        int ponto = nomeArquivoUpload.lastIndexOf('.');
        if (ponto > 0) {
            return nomeArquivoUpload.substring(0, ponto);
        }
        return nomeArquivoUpload;
    }
}
