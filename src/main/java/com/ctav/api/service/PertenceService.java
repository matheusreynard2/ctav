package com.ctav.api.service;

import com.ctav.api.dto.FotoPertenceResponseDTO;
import com.ctav.api.dto.PertenceRequestDTO;
import com.ctav.api.dto.PertenceResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.FotoPertence;
import com.ctav.api.entity.Pertence;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.PertenceRepository;
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
public class PertenceService {

    // Somente PNG/JPG, conforme requisito das fotos de pertences.
    private static final Set<String> TIPOS_FOTO_PERMITIDOS =
            Set.of("image/jpeg", "image/png");
    private static final long FOTO_TAMANHO_MAX = 10 * 1024 * 1024;
    private static final int MAX_PERTENCES = 200;
    private static final int MAX_FOTOS_POR_PERTENCE = 20;

    @Inject
    S3Client s3;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    PertenceRepository pertenceRepository;

    @Inject
    UsuarioContext usuarioContext;

    // Bucket dedicado as fotos de pertences. Em dev aponta para o mesmo bucket
    // dos anexos/fotos; em producao usa um bucket separado (ver application.properties).
    @ConfigProperty(name = "app.pertences-fotos.bucket")
    String bucket;

    @ConfigProperty(name = "app.aws.region")
    String region;

    // ===== CRUD de pertences =====

    @Transactional
    public List<PertenceResponseDTO> listar(Long acolhidoId) {
        buscarAcolhidoPorId(acolhidoId);
        List<Pertence> pertences = pertenceRepository.listarPorAcolhido(acolhidoId);
        if (pertences.isEmpty()) {
            return List.of();
        }
        try (S3Presigner presigner = criarPresigner()) {
            return pertences.stream()
                    .map(p -> toResponse(p, presigner))
                    .toList();
        }
    }

    /** Lista todos os pertences dos acolhidos do usuario logado (CRUD geral). */
    @Transactional
    public List<PertenceResponseDTO> listarTodos() {
        List<Pertence> pertences = pertenceRepository.listarPorUsuario(usuarioContext.id());
        if (pertences.isEmpty()) {
            return List.of();
        }
        try (S3Presigner presigner = criarPresigner()) {
            return pertences.stream()
                    .map(p -> toResponse(p, presigner))
                    .toList();
        }
    }

    @Transactional
    public PertenceResponseDTO buscarPorId(Long acolhidoId, Long id) {
        Pertence pertence = buscarPertence(acolhidoId, id);
        try (S3Presigner presigner = criarPresigner()) {
            return toResponse(pertence, presigner);
        }
    }

    @Transactional
    public PertenceResponseDTO criar(Long acolhidoId, PertenceRequestDTO dto) {
        Acolhido acolhido = buscarAcolhidoPorId(acolhidoId);
        validarLimitePertences(acolhidoId);

        Pertence pertence = Pertence.builder()
                .quantidade(dto.getQuantidade())
                .item(dto.getItem().trim())
                .acolhido(acolhido)
                .build();
        pertenceRepository.persist(pertence);
        return toResponseSemFotos(pertence);
    }

    @Transactional
    public PertenceResponseDTO atualizar(Long acolhidoId, Long id, PertenceRequestDTO dto) {
        Pertence pertence = buscarPertence(acolhidoId, id);
        pertence.setQuantidade(dto.getQuantidade());
        pertence.setItem(dto.getItem().trim());
        pertenceRepository.persist(pertence);
        try (S3Presigner presigner = criarPresigner()) {
            return toResponse(pertence, presigner);
        }
    }

    @Transactional
    public void deletar(Long acolhidoId, Long id) {
        Pertence pertence = buscarPertence(acolhidoId, id);
        // Remove os binarios do S3 antes de apagar o registro (as fotos saem em
        // cascata via orphanRemoval do OneToMany).
        pertence.getFotos().forEach(f -> removerObjetoS3(f.getChaveS3()));
        pertenceRepository.delete(pertence);
    }

    // ===== CRUD de fotos =====

    @Transactional
    public FotoPertenceResponseDTO adicionarFoto(Long acolhidoId, Long pertenceId, FileUpload arquivo) {
        Pertence pertence = buscarPertence(acolhidoId, pertenceId);
        validarFoto(arquivo);
        validarLimiteFotos(pertence);

        String chave = "acolhidos/" + acolhidoId + "/pertences/" + pertenceId + "/"
                + UUID.randomUUID() + "-" + arquivo.fileName();

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(chave)
                        .contentType(arquivo.contentType())
                        .build(),
                RequestBody.fromFile(arquivo.uploadedFile()));

        FotoPertence foto = FotoPertence.builder()
                .nomeArquivo(arquivo.fileName())
                .contentType(arquivo.contentType())
                .tamanhoBytes(arquivo.size())
                .chaveS3(chave)
                .pertence(pertence)
                .build();
        pertence.getFotos().add(foto);
        // Garante a geracao do id da foto antes de montar a resposta.
        pertenceRepository.persist(pertence);
        pertenceRepository.flush();

        try (S3Presigner presigner = criarPresigner()) {
            return FotoPertenceResponseDTO.fromEntity(foto, gerarUrlFoto(presigner, foto.getChaveS3()));
        }
    }

    @Transactional
    public void deletarFoto(Long acolhidoId, Long pertenceId, Long fotoId) {
        Pertence pertence = buscarPertence(acolhidoId, pertenceId);
        FotoPertence foto = pertence.getFotos().stream()
                .filter(f -> f.getId().equals(fotoId))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Foto não encontrada com o id: " + fotoId));
        removerObjetoS3(foto.getChaveS3());
        pertence.getFotos().remove(foto);
        pertenceRepository.persist(pertence);
    }

    /**
     * Remove todos os pertences de um acolhido (usado antes de excluir o
     * acolhido). Apaga os binarios das fotos no S3 e, em seguida, os registros
     * de pertences no banco — as fotos saem em cascata via orphanRemoval.
     */
    public void removerPertencesDoAcolhido(Long acolhidoId) {
        List<Pertence> pertences = pertenceRepository.listarPorAcolhido(acolhidoId);
        if (pertences.isEmpty()) {
            return;
        }
        pertences.forEach(p -> {
            p.getFotos().forEach(f -> removerObjetoS3(f.getChaveS3()));
            pertenceRepository.delete(p);
        });
    }

    // ===== auxiliares =====

    private Acolhido buscarAcolhidoPorId(Long id) {
        return acolhidoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + id));
    }

    private Pertence buscarPertence(Long acolhidoId, Long id) {
        // Valida que o acolhido pertence ao usuario logado.
        buscarAcolhidoPorId(acolhidoId);
        Pertence pertence = pertenceRepository.findByIdOptional(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pertence não encontrado com o id: " + id));
        if (pertence.getAcolhido() == null
                || !acolhidoId.equals(pertence.getAcolhido().getId())) {
            throw new ResourceNotFoundException("Pertence não encontrado com o id: " + id);
        }
        return pertence;
    }

    private PertenceResponseDTO toResponse(Pertence pertence, S3Presigner presigner) {
        List<FotoPertenceResponseDTO> fotos = pertence.getFotos().stream()
                .map(f -> FotoPertenceResponseDTO.fromEntity(f, gerarUrlFoto(presigner, f.getChaveS3())))
                .toList();
        return PertenceResponseDTO.builder()
                .id(pertence.getId())
                .quantidade(pertence.getQuantidade())
                .item(pertence.getItem())
                .acolhidoId(pertence.getAcolhido() != null ? pertence.getAcolhido().getId() : null)
                .acolhidoNome(pertence.getAcolhido() != null ? pertence.getAcolhido().getNome() : null)
                .criadoEm(pertence.getCriadoEm())
                .atualizadoEm(pertence.getAtualizadoEm())
                .fotos(fotos)
                .build();
    }

    private PertenceResponseDTO toResponseSemFotos(Pertence pertence) {
        return PertenceResponseDTO.builder()
                .id(pertence.getId())
                .quantidade(pertence.getQuantidade())
                .item(pertence.getItem())
                .acolhidoId(pertence.getAcolhido() != null ? pertence.getAcolhido().getId() : null)
                .acolhidoNome(pertence.getAcolhido() != null ? pertence.getAcolhido().getNome() : null)
                .criadoEm(pertence.getCriadoEm())
                .atualizadoEm(pertence.getAtualizadoEm())
                .fotos(List.of())
                .build();
    }

    private S3Presigner criarPresigner() {
        return S3Presigner.builder().region(Region.of(region)).build();
    }

    private String gerarUrlFoto(S3Presigner presigner, String chave) {
        GetObjectPresignRequest req = GetObjectPresignRequest.builder()
                .signatureDuration(Duration.ofMinutes(60))
                .getObjectRequest(b -> b.bucket(bucket).key(chave))
                .build();
        return presigner.presignGetObject(req).url().toString();
    }

    private void removerObjetoS3(String chave) {
        if (chave != null && !chave.isBlank()) {
            s3.deleteObject(b -> b.bucket(bucket).key(chave));
        }
    }

    private void validarFoto(FileUpload arquivo) {
        if (arquivo == null || arquivo.fileName() == null || arquivo.fileName().isBlank()) {
            throw new BusinessException("Selecione uma imagem para enviar.");
        }
        String contentType = arquivo.contentType();
        if (contentType == null || !TIPOS_FOTO_PERMITIDOS.contains(contentType)) {
            throw new BusinessException("Só são aceitas imagens JPG ou PNG.");
        }
        if (arquivo.size() > FOTO_TAMANHO_MAX) {
            throw new BusinessException("A imagem excede o limite de 10 MB.");
        }
    }

    private void validarLimitePertences(Long acolhidoId) {
        if (pertenceRepository.contarPorAcolhido(acolhidoId) >= MAX_PERTENCES) {
            throw new BusinessException("Limite de " + MAX_PERTENCES + " pertences atingido.");
        }
    }

    private void validarLimiteFotos(Pertence pertence) {
        if (pertence.getFotos().size() >= MAX_FOTOS_POR_PERTENCE) {
            throw new BusinessException(
                    "Limite de " + MAX_FOTOS_POR_PERTENCE + " fotos por pertence atingido.");
        }
    }
}
