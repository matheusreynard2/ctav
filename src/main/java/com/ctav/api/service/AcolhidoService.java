package com.ctav.api.service;

import com.ctav.api.dto.AcolhidoRequestDTO;
import com.ctav.api.dto.AcolhidoResponseDTO;
import com.ctav.api.dto.PrescricaoRequestDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Medicamento;
import com.ctav.api.entity.Motivo;
import com.ctav.api.entity.Prescricao;
import com.ctav.api.entity.Responsavel;
import com.ctav.api.enums.CategoriaMotivo;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.AdministracaoRepository;
import com.ctav.api.repository.CombinadoRepository;
import com.ctav.api.repository.MedicamentoRepository;
import com.ctav.api.repository.OcorrenciaRepository;
import com.ctav.api.repository.ResponsavelRepository;
import com.ctav.api.enums.TipoAlta;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.Duration;
import java.time.LocalDateTime;
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
    MedicamentoService medicamentoService;

    @Inject
    MotivoService motivoService;

    @Inject
    ResponsavelService responsavelService;

    @Inject
    ResponsavelRepository responsavelRepository;

    @Inject
    CombinadoRepository combinadoRepository;

    @Inject
    com.ctav.api.repository.ConsultaRepository consultaRepository;

    @Inject
    AdministracaoRepository administracaoRepository;

    @Inject
    OcorrenciaRepository ocorrenciaRepository;

    @Inject
    PertenceService pertenceService;

    @Inject
    UsuarioContext usuarioContext;

    @Inject
    S3Client s3;

    @ConfigProperty(name = "app.anexos.bucket")
    String bucket;

    @Transactional
    public AcolhidoResponseDTO criar(AcolhidoRequestDTO dto) {
        validarUnicidade(dto.getCpf(), dto.getEmail(), null);

        // Cadastro direto no histórico exige alta (com data e tipo).
        if (Boolean.TRUE.equals(dto.getArquivado()) && !Boolean.TRUE.equals(dto.getAlta())) {
            throw new BusinessException(
                    "Para cadastrar diretamente no histórico é necessário informar a alta do acolhido.");
        }

        Motivo motivoAdesao = resolverMotivoAdesao(dto.getMotivoAdesaoId());
        Motivo motivoDesistencia = resolverMotivoDesistencia(dto);
        Responsavel responsavel = resolverResponsavel(dto.getResponsavelId());

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
                .motivoAdesao(motivoAdesao)
                .motivoDesistencia(motivoDesistencia)
                .responsavel(responsavel)
                .arquivado(Boolean.TRUE.equals(dto.getArquivado()))
                .arquivadoEm(Boolean.TRUE.equals(dto.getArquivado())
                        ? LocalDateTime.now()
                        : null)
                .assinaturaAcolhido(normalizarAssinatura(dto.getAssinaturaAcolhido()))
                .autorizaUsoImagem(dto.getAutorizaUsoImagem())
                .entregaCelular(dto.getEntregaCelular())
                .concordaPertences(dto.getConcordaPertences())
                .build();

        // A assinatura do responsavel coletada no termo e gravada na propria
        // entidade Responsavel (fonte unica), reutilizada pelos acolhidos ligados.
        if (dto.getAssinaturaResponsavel() != null && responsavel != null) {
            responsavel.setAssinatura(normalizarAssinatura(dto.getAssinaturaResponsavel()));
        }

        sincronizarPrescricoes(acolhido, dto.getPrescricoes());

        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    // Lista apenas os acolhidos ativos (fora do arquivo morto).
    public List<AcolhidoResponseDTO> listar() {
        List<Acolhido> acolhidos =
                acolhidoRepository.listarAtivosPorUsuario(usuarioContext.id());
        try (S3Presigner presigner = criarPresigner()) {
            return acolhidos.stream()
                    .map(a -> toResponse(a, presigner))
                    .toList();
        }
    }

    // Lista os acolhidos que estao no arquivo morto/historico.
    public List<AcolhidoResponseDTO> listarHistorico() {
        List<Acolhido> acolhidos =
                acolhidoRepository.listarArquivadosPorUsuario(usuarioContext.id());
        try (S3Presigner presigner = criarPresigner()) {
            return acolhidos.stream()
                    .map(a -> toResponse(a, presigner))
                    .toList();
        }
    }

    // Envia um ou mais acolhidos para o arquivo morto. Mantem todos os dados
    // relacionados (prescricoes, administracoes, anexos, combinados) intactos,
    // apenas retirando-os da lista principal. Retorna quantos foram arquivados.
    @Transactional
    public int arquivar(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            throw new BusinessException("Selecione ao menos um acolhido para enviar ao histórico.");
        }
        List<Acolhido> alvos = ids.stream()
                .filter(java.util.Objects::nonNull)
                .distinct()
                .map(this::buscarEntidadePorId)
                .toList();

        // Só é permitido arquivar acolhidos que tiveram alta.
        List<String> semAlta = alvos.stream()
                .filter(a -> !Boolean.TRUE.equals(a.getAlta()))
                .map(Acolhido::getNome)
                .toList();
        if (!semAlta.isEmpty()) {
            throw new BusinessException(
                    "Só é possível enviar ao histórico acolhidos que tiveram alta. "
                            + "Sem alta: " + String.join(", ", semAlta));
        }

        LocalDateTime agora = LocalDateTime.now();
        int total = 0;
        for (Acolhido acolhido : alvos) {
            if (!Boolean.TRUE.equals(acolhido.getArquivado())) {
                acolhido.setArquivado(true);
                acolhido.setArquivadoEm(agora);
                acolhidoRepository.persist(acolhido);
                total++;
            }
        }
        return total;
    }

    // Restaura um acolhido do arquivo morto de volta para a lista de acolhidos.
    @Transactional
    public AcolhidoResponseDTO restaurar(Long id) {
        Acolhido acolhido = buscarEntidadePorId(id);
        acolhido.setArquivado(false);
        acolhido.setArquivadoEm(null);
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
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
        acolhido.setMotivoAdesao(resolverMotivoAdesao(dto.getMotivoAdesaoId()));
        acolhido.setMotivoDesistencia(resolverMotivoDesistencia(dto));
        Responsavel responsavel = resolverResponsavel(dto.getResponsavelId());
        acolhido.setResponsavel(responsavel);
        // So altera o arquivamento quando o cliente envia explicitamente o campo,
        // preservando o estado atual em edicoes normais (form nao envia o campo).
        if (dto.getArquivado() != null) {
            boolean arquivar = Boolean.TRUE.equals(dto.getArquivado());
            boolean jaArquivado = Boolean.TRUE.equals(acolhido.getArquivado());
            acolhido.setArquivado(arquivar);
            if (arquivar && !jaArquivado) {
                acolhido.setArquivadoEm(LocalDateTime.now());
            } else if (!arquivar) {
                acolhido.setArquivadoEm(null);
            }
        }
        // A assinatura do acolhido so e alterada quando enviada explicitamente
        // (o formulario de edicao nao a envia, preservando o valor atual). A
        // edicao dedicada usa o endpoint /assinaturas.
        if (dto.getAssinaturaAcolhido() != null) {
            acolhido.setAssinaturaAcolhido(normalizarAssinatura(dto.getAssinaturaAcolhido()));
        }
        // A assinatura do responsavel, quando enviada, e gravada na entidade
        // Responsavel vinculada (fonte unica).
        if (dto.getAssinaturaResponsavel() != null && responsavel != null) {
            responsavel.setAssinatura(normalizarAssinatura(dto.getAssinaturaResponsavel()));
        }
        // As opcoes dos termos so sao alteradas quando enviadas explicitamente
        // (o formulario de edicao normal nao as envia, preservando o valor atual).
        if (dto.getAutorizaUsoImagem() != null) {
            acolhido.setAutorizaUsoImagem(dto.getAutorizaUsoImagem());
        }
        if (dto.getEntregaCelular() != null) {
            acolhido.setEntregaCelular(dto.getEntregaCelular());
        }
        if (dto.getConcordaPertences() != null) {
            acolhido.setConcordaPertences(dto.getConcordaPertences());
        }
        sincronizarPrescricoes(acolhido, dto.getPrescricoes());
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    // Atualiza somente a assinatura do acolhido no termo de concordancia. Valor em
    // branco remove a assinatura. Usado pela edicao direta nas listagens. A
    // assinatura do responsavel e gerenciada na tela de responsaveis.
    @Transactional
    public AcolhidoResponseDTO atualizarAssinaturas(Long id, String assinaturaAcolhido) {
        Acolhido acolhido = buscarEntidadePorId(id);
        acolhido.setAssinaturaAcolhido(normalizarAssinatura(assinaturaAcolhido));
        acolhidoRepository.persist(acolhido);
        return toResponse(acolhido);
    }

    private String normalizarAssinatura(String valor) {
        return valor != null && !valor.isBlank() ? valor : null;
    }

    @Transactional
    public void deletar(Long id) {
        Acolhido acolhido = buscarEntidadePorId(id);
        // Guarda o responsavel vinculado para, ao final, remove-lo tambem.
        Long responsavelId = acolhido.getResponsavel() != null
                ? acolhido.getResponsavel().getId()
                : null;
        // Remove a foto do S3, se existir.
        removerObjetoS3(acolhido.getFotoChaveS3());
        // Remove os pertences do acolhido (fotos no S3 + registros no banco).
        pertenceService.removerPertencesDoAcolhido(id);
        // Remove combinados e administracoes vinculados antes de excluir o acolhido,
        // garantindo a exclusao e evitando violacao de chave estrangeira.
        // (As prescricoes saem em cascata via orphanRemoval do OneToMany.)
        combinadoRepository.deleteByAcolhidoIdAndUsuario(id, usuarioContext.id());
        consultaRepository.deleteByAcolhidoIdAndUsuario(id, usuarioContext.id());
        administracaoRepository.deleteByAcolhidoId(id);
        // Devolve ao estoque livre dos medicamentos o que estava reservado para
        // este acolhido antes de remover as prescricoes (em cascata).
        if (acolhido.getPrescricoes() != null) {
            acolhido.getPrescricoes().forEach(p -> medicamentoService.liberarEstoque(
                    p.getMedicamento(), valorEstoque(p.getTotalComprimidos())));
        }
        // As ocorrencias nao sao excluidas: apenas os vinculos deste acolhido
        // sao removidos, permanecendo na lista para consulta/edicao (os nomes
        // ficam preservados no snapshot da ocorrencia).
        ocorrenciaRepository.desvincularAcolhido(id);
        acolhidoRepository.delete(acolhido);

        // Exclui tambem o responsavel vinculado, desde que ele nao esteja ligado
        // a outros acolhidos (evita quebrar registros que compartilham o mesmo
        // responsavel). O flush garante que a contagem reflita a exclusao acima.
        if (responsavelId != null) {
            acolhidoRepository.flush();
            if (responsavelRepository.contarAcolhidos(responsavelId) == 0) {
                responsavelRepository.findByIdAndUsuario(responsavelId, usuarioContext.id())
                        .ifPresent(responsavelRepository::delete);
            }
        }
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

    // Motivo de adesao e sempre obrigatorio (inclusive na edicao).
    private Motivo resolverMotivoAdesao(Long id) {
        if (id == null) {
            throw new BusinessException("O motivo de adesão é obrigatório.");
        }
        return motivoService.obterDoUsuario(id, CategoriaMotivo.ADESAO);
    }

    // Responsavel e sempre obrigatorio (todo acolhido tem um responsavel).
    private Responsavel resolverResponsavel(Long id) {
        if (id == null) {
            throw new BusinessException("O responsável é obrigatório.");
        }
        return responsavelService.obterDoUsuario(id);
    }

    // Motivo de desistencia so se aplica (e e obrigatorio) quando a alta e por
    // desistencia; nos demais casos e limpo.
    private Motivo resolverMotivoDesistencia(AcolhidoRequestDTO dto) {
        boolean desistencia = Boolean.TRUE.equals(dto.getAlta())
                && dto.getTipoAlta() == TipoAlta.DESISTENCIA;
        if (!desistencia) {
            return null;
        }
        if (dto.getMotivoDesistenciaId() == null) {
            throw new BusinessException("Informe o motivo da desistência.");
        }
        return motivoService.obterDoUsuario(dto.getMotivoDesistenciaId(), CategoriaMotivo.DESISTENCIA);
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

        // Prescricoes que serao removidas (medicamento ausente na requisicao):
        // devolvem ao estoque livre do medicamento o que estava reservado ao
        // acolhido, antes de sair da lista (orphanRemoval).
        atuais.stream()
                .filter(p -> !porMedicamento.containsKey(p.getMedicamento().getId()))
                .forEach(p -> medicamentoService.liberarEstoque(
                        p.getMedicamento(), valorEstoque(p.getTotalComprimidos())));
        atuais.removeIf(p -> !porMedicamento.containsKey(p.getMedicamento().getId()));

        Map<Long, Prescricao> atuaisPorMedicamento = atuais.stream()
                .collect(Collectors.toMap(p -> p.getMedicamento().getId(), p -> p));

        for (PrescricaoRequestDTO dto : porMedicamento.values()) {
            Prescricao existente = atuaisPorMedicamento.get(dto.getMedicamentoId());
            Medicamento medicamento = medicamentos.get(dto.getMedicamentoId());
            int novaReserva = valorEstoque(dto.getTotalComprimidos());
            if (existente != null) {
                // Atualiza as doses conforme enviado pelo formulario (que na edicao
                // vem pre-carregado com as doses atuais, preservando-as quando nao ha
                // alteracao).
                existente.setDoseManha(valorDose(dto.getDoseManha()));
                existente.setDoseTarde(valorDose(dto.getDoseTarde()));
                existente.setDoseNoite(valorDose(dto.getDoseNoite()));

                // Ajusta a reserva de estoque: move comprimidos entre o estoque
                // livre do medicamento e o estoque exclusivo deste acolhido.
                int reservaAtual = valorEstoque(existente.getTotalComprimidos());
                int delta = novaReserva - reservaAtual;
                if (delta > 0) {
                    medicamentoService.reservarEstoque(medicamento, delta);
                } else if (delta < 0) {
                    medicamentoService.liberarEstoque(medicamento, -delta);
                }
                existente.setTotalComprimidos(novaReserva);
            } else {
                // Medicamento recem-vinculado a este acolhido: remove eventuais
                // marcacoes de administracao remanescentes de um vinculo anterior
                // (medicamento que ja foi relacionado, marcado e depois removido),
                // para que os checkboxes comecem vazios em todos os dias. As
                // marcacoes dos medicamentos que permanecem vinculados nao sao
                // tocadas (o ramo "existente != null" acima as preserva).
                if (acolhido.getId() != null) {
                    administracaoRepository.deleteByAcolhidoMedicamento(
                            acolhido.getId(), usuarioContext.id(), dto.getMedicamentoId());
                }
                // Reserva o estoque solicitado do estoque livre do medicamento.
                medicamentoService.reservarEstoque(medicamento, novaReserva);
                Prescricao nova = Prescricao.builder()
                        .usuario(usuarioContext.referencia())
                        .acolhido(acolhido)
                        .medicamento(medicamento)
                        .doseManha(valorDose(dto.getDoseManha()))
                        .doseTarde(valorDose(dto.getDoseTarde()))
                        .doseNoite(valorDose(dto.getDoseNoite()))
                        .totalComprimidos(novaReserva)
                        .build();
                atuais.add(nova);
            }
        }
    }

    private int valorEstoque(Integer valor) {
        return valor == null || valor < 0 ? 0 : valor;
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
