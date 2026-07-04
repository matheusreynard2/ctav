package com.ctav.api.service;

import com.ctav.api.dto.AcolhidoRequestDTO;
import com.ctav.api.dto.AcolhidoResponseDTO;
import com.ctav.api.dto.PrescricaoRequestDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Medicamento;
import com.ctav.api.entity.Prescricao;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.AdministracaoRepository;
import com.ctav.api.repository.CombinadoRepository;
import com.ctav.api.repository.MedicamentoRepository;
import com.ctav.api.enums.TipoAlta;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@ApplicationScoped
public class AcolhidoService {

    private static final Set<String> TIPOS_FOTO_PERMITIDOS =
            Set.of("image/jpeg", "image/png", "image/webp");
    private static final long FOTO_TAMANHO_MAX = 10 * 1024 * 1024;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    MedicamentoRepository medicamentoRepository;

    @Inject
    CombinadoRepository combinadoRepository;

    @Inject
    AdministracaoRepository administracaoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Inject
    S3Client s3;

    @ConfigProperty(name = "app.anexos.bucket")
    String bucket;

    @Transactional
    public AcolhidoResponseDTO criar(AcolhidoRequestDTO dto) {
        validarUnicidade(dto.getCpf(), dto.getEmail(), null);

        Acolhido acolhido = Acolhido.builder()
                .usuario(usuarioContext.referencia())
                .nome(dto.getNome())
                .cpf(dto.getCpf())
                .dataNascimento(dto.getDataNascimento())
                .dataAcolhimentoCtav(dto.getDataAcolhimentoCtav())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .sexo(dto.getSexo())
                .endereco(dto.getEndereco())
                .quarto(dto.getQuarto())
                .alta(Boolean.TRUE.equals(dto.getAlta()))
                .dataAlta(Boolean.TRUE.equals(dto.getAlta()) ? dto.getDataAlta() : null)
                .tipoAlta(tipoAltaEfetivo(dto))
                .descricaoAlta(descricaoAltaEfetiva(dto))
                .build();

        sincronizarPrescricoes(acolhido, dto.getPrescricoes());

        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    public List<AcolhidoResponseDTO> listar() {
        List<Acolhido> acolhidos = acolhidoRepository.listarPorUsuario(usuarioContext.id());
        try (S3Presigner presigner = criarPresigner()) {
            return acolhidos.stream()
                    .map(a -> toResponse(a, presigner))
                    .toList();
        }
    }

    public AcolhidoResponseDTO buscarPorId(Long id) {
        return toResponse(buscarEntidadePorId(id));
    }

    @Transactional
    public AcolhidoResponseDTO atualizar(Long id, AcolhidoRequestDTO dto) {
        Acolhido acolhido = buscarEntidadePorId(id);
        validarUnicidade(dto.getCpf(), dto.getEmail(), id);

        acolhido.setNome(dto.getNome());
        acolhido.setCpf(dto.getCpf());
        acolhido.setDataNascimento(dto.getDataNascimento());
        acolhido.setDataAcolhimentoCtav(dto.getDataAcolhimentoCtav());
        acolhido.setEmail(dto.getEmail());
        acolhido.setTelefone(dto.getTelefone());
        acolhido.setSexo(dto.getSexo());
        acolhido.setEndereco(dto.getEndereco());
        acolhido.setQuarto(dto.getQuarto());
        boolean teveAlta = Boolean.TRUE.equals(dto.getAlta());
        acolhido.setAlta(teveAlta);
        acolhido.setDataAlta(teveAlta ? dto.getDataAlta() : null);
        acolhido.setTipoAlta(tipoAltaEfetivo(dto));
        acolhido.setDescricaoAlta(descricaoAltaEfetiva(dto));
        sincronizarPrescricoes(acolhido, dto.getPrescricoes());
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    @Transactional
    public void deletar(Long id) {
        Acolhido acolhido = buscarEntidadePorId(id);
        // Remove a foto do S3, se existir.
        removerObjetoS3(acolhido.getFotoChaveS3());
        // Remove combinados e administracoes vinculados antes de excluir o acolhido,
        // garantindo a exclusao e evitando violacao de chave estrangeira.
        // (As prescricoes saem em cascata via orphanRemoval do OneToMany.)
        combinadoRepository.deleteByAcolhidoIdAndUsuario(id, usuarioContext.id());
        administracaoRepository.deleteByAcolhidoId(id);
        acolhidoRepository.delete(acolhido);
    }

    @Transactional
    public AcolhidoResponseDTO salvarFoto(Long id, FileUpload arquivo) {
        Acolhido acolhido = buscarEntidadePorId(id);
        validarFoto(arquivo);

        // Remove a foto anterior do S3 (se houver) antes de subir a nova.
        removerObjetoS3(acolhido.getFotoChaveS3());

        String chave = "acolhidos/" + id + "/foto/"
                + UUID.randomUUID() + "-" + arquivo.fileName();

        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(bucket)
                        .key(chave)
                        .contentType(arquivo.contentType())
                        .build(),
                RequestBody.fromFile(arquivo.uploadedFile()));

        acolhido.setFotoChaveS3(chave);
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    @Transactional
    public AcolhidoResponseDTO removerFoto(Long id) {
        Acolhido acolhido = buscarEntidadePorId(id);
        removerObjetoS3(acolhido.getFotoChaveS3());
        acolhido.setFotoChaveS3(null);
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    // O tipo/descricao da alta so fazem sentido quando o acolhido teve alta.
    private TipoAlta tipoAltaEfetivo(AcolhidoRequestDTO dto) {
        return Boolean.TRUE.equals(dto.getAlta()) ? dto.getTipoAlta() : null;
    }

    // A descricao e sempre derivada do enum, garantindo texto padronizado.
    private String descricaoAltaEfetiva(AcolhidoRequestDTO dto) {
        TipoAlta tipo = tipoAltaEfetivo(dto);
        return tipo != null ? tipo.getDescricao() : null;
    }

    private Acolhido buscarEntidadePorId(Long id) {
        return acolhidoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + id));
    }

    // Reconcilia a lista de prescricoes do acolhido com o que foi enviado:
    // atualiza doses existentes, cria novas e remove as que sairam (orphanRemoval).
    private void sincronizarPrescricoes(Acolhido acolhido, List<PrescricaoRequestDTO> dtos) {
        List<PrescricaoRequestDTO> entradas = dtos == null ? List.of() : dtos;

        // Deduplica por medicamento, mantendo a ultima ocorrencia.
        Map<Long, PrescricaoRequestDTO> porMedicamento = new LinkedHashMap<>();
        for (PrescricaoRequestDTO dto : entradas) {
            if (dto != null && dto.getMedicamentoId() != null) {
                porMedicamento.put(dto.getMedicamentoId(), dto);
            }
        }

        Map<Long, Medicamento> medicamentos =
                carregarMedicamentosValidados(porMedicamento.keySet());

        if (acolhido.getPrescricoes() == null) {
            acolhido.setPrescricoes(new ArrayList<>());
        }
        List<Prescricao> atuais = acolhido.getPrescricoes();

        // Remove as prescricoes cujo medicamento nao veio na requisicao.
        atuais.removeIf(p -> !porMedicamento.containsKey(p.getMedicamento().getId()));

        Map<Long, Prescricao> atuaisPorMedicamento = atuais.stream()
                .collect(Collectors.toMap(p -> p.getMedicamento().getId(), p -> p));

        for (PrescricaoRequestDTO dto : porMedicamento.values()) {
            Prescricao existente = atuaisPorMedicamento.get(dto.getMedicamentoId());
            if (existente != null) {
                // Mantem as doses definidas no controle de administracao.
            } else {
                Prescricao nova = Prescricao.builder()
                        .usuario(usuarioContext.referencia())
                        .acolhido(acolhido)
                        .medicamento(medicamentos.get(dto.getMedicamentoId()))
                        .doseManha(valorDose(dto.getDoseManha()))
                        .doseTarde(valorDose(dto.getDoseTarde()))
                        .doseNoite(valorDose(dto.getDoseNoite()))
                        .build();
                atuais.add(nova);
            }
        }
    }

    private int valorDose(Integer valor) {
        return valor == null || valor < 0 ? 0 : valor;
    }

    private Map<Long, Medicamento> carregarMedicamentosValidados(Set<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<Long> idsUnicos = ids.stream().distinct().toList();
        List<Medicamento> encontrados =
                medicamentoRepository.listByIdsAndUsuario(idsUnicos, usuarioContext.id());

        if (encontrados.size() != idsUnicos.size()) {
            Set<Long> idsEncontrados = encontrados.stream()
                    .map(Medicamento::getId)
                    .collect(Collectors.toCollection(HashSet::new));
            List<Long> idsFaltando = idsUnicos.stream()
                    .filter(oid -> !idsEncontrados.contains(oid))
                    .toList();
            throw new ResourceNotFoundException(
                    "Medicamento(s) não encontrado(s) com os ids: " + idsFaltando);
        }

        return encontrados.stream()
                .collect(Collectors.toMap(Medicamento::getId, m -> m));
    }

    private AcolhidoResponseDTO toResponse(Acolhido acolhido) {
        if (acolhido.getFotoChaveS3() == null || acolhido.getFotoChaveS3().isBlank()) {
            return AcolhidoResponseDTO.fromEntity(acolhido);
        }
        try (S3Presigner presigner = criarPresigner()) {
            return toResponse(acolhido, presigner);
        }
    }

    private AcolhidoResponseDTO toResponse(Acolhido acolhido, S3Presigner presigner) {
        AcolhidoResponseDTO dto = AcolhidoResponseDTO.fromEntity(acolhido);
        if (acolhido.getFotoChaveS3() != null && !acolhido.getFotoChaveS3().isBlank()) {
            dto.setFotoUrl(gerarUrlFoto(presigner, acolhido.getFotoChaveS3()));
        }
        return dto;
    }

    private S3Presigner criarPresigner() {
        return S3Presigner.builder().region(Region.SA_EAST_1).build();
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
            throw new BusinessException("Só são aceitas imagens JPG, PNG ou WEBP.");
        }
        if (arquivo.size() > FOTO_TAMANHO_MAX) {
            throw new BusinessException("A imagem excede o limite de 10 MB.");
        }
    }

    private void validarUnicidade(String cpf, String email, Long idAtual) {
        acolhidoRepository.findByCpfAndUsuario(cpf, usuarioContext.id()).ifPresent(p -> {
            if (idAtual == null || !p.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um acolhido cadastrado com este CPF");
            }
        });

        if (email != null && !email.isBlank()) {
            acolhidoRepository.findByEmailAndUsuario(email, usuarioContext.id()).ifPresent(p -> {
                if (idAtual == null || !p.getId().equals(idAtual)) {
                    throw new BusinessException("Já existe um acolhido cadastrado com este email");
                }
            });
        }
    }
}
