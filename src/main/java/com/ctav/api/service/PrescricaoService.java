package com.ctav.api.service;

import com.ctav.api.dto.PrescricaoRequestDTO;
import com.ctav.api.dto.PrescricaoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.AdministracaoMedicamento;
import com.ctav.api.entity.Medicamento;
import com.ctav.api.entity.Prescricao;
import com.ctav.api.enums.PeriodoDia;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.AdministracaoRepository;
import com.ctav.api.repository.MedicamentoRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class PrescricaoService {

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    AdministracaoRepository administracaoRepository;

    @Inject
    MedicamentoService medicamentoService;

    @Inject
    MedicamentoRepository medicamentoRepository;

    @Inject
    UsuarioContext usuarioContext;

    /**
     * Reconcilia toda a lista de prescrições de um acolhido (usada pela página de
     * controle total de medicação): vincula novos medicamentos, atualiza doses e
     * a reserva de estoque, e remove os que saíram — movendo comprimidos entre o
     * estoque livre do medicamento e o estoque reservado do acolhido.
     */
    @Transactional
    public List<PrescricaoResponseDTO> sincronizarPrescricoes(
            Long acolhidoId, List<PrescricaoRequestDTO> dtos) {
        Acolhido acolhido = acolhidoRepository
                .findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));

        List<PrescricaoRequestDTO> entradas = dtos == null ? List.of() : dtos;
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

        // Prescrições removidas: devolvem ao estoque livre o que estava reservado.
        atuais.stream()
                .filter(p -> !porMedicamento.containsKey(p.getMedicamento().getId()))
                .forEach(p -> medicamentoService.liberarEstoque(
                        p.getMedicamento(), valorDose(p.getTotalComprimidos())));
        atuais.removeIf(p -> !porMedicamento.containsKey(p.getMedicamento().getId()));

        Map<Long, Prescricao> atuaisPorMedicamento = atuais.stream()
                .collect(Collectors.toMap(p -> p.getMedicamento().getId(), p -> p));

        for (PrescricaoRequestDTO dto : porMedicamento.values()) {
            Prescricao existente = atuaisPorMedicamento.get(dto.getMedicamentoId());
            Medicamento medicamento = medicamentos.get(dto.getMedicamentoId());
            int novaReserva = valorDose(dto.getTotalComprimidos());
            if (existente != null) {
                existente.setDoseManha(valorDose(dto.getDoseManha()));
                existente.setDoseTarde(valorDose(dto.getDoseTarde()));
                existente.setDoseNoite(valorDose(dto.getDoseNoite()));
                int reservaAtual = valorDose(existente.getTotalComprimidos());
                int delta = novaReserva - reservaAtual;
                if (delta > 0) {
                    medicamentoService.reservarEstoque(medicamento, delta);
                } else if (delta < 0) {
                    medicamentoService.liberarEstoque(medicamento, -delta);
                }
                existente.setTotalComprimidos(novaReserva);
            } else {
                administracaoRepository.deleteByAcolhidoMedicamento(
                        acolhidoId, usuarioContext.id(), dto.getMedicamentoId());
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

        return acolhido.getPrescricoes().stream()
                .map(PrescricaoResponseDTO::fromEntity)
                .toList();
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
            List<Long> faltando = idsUnicos.stream()
                    .filter(oid -> !idsEncontrados.contains(oid))
                    .toList();
            throw new ResourceNotFoundException(
                    "Medicamento(s) não encontrado(s) com os ids: " + faltando);
        }
        return encontrados.stream()
                .collect(Collectors.toMap(Medicamento::getId, m -> m));
    }

    @Transactional
    public List<PrescricaoResponseDTO> atualizarDoses(
            Long acolhidoId,
            List<PrescricaoRequestDTO> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            throw new BusinessException("Informe ao menos uma prescrição com doses.");
        }

        Acolhido acolhido = acolhidoRepository
                .findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));

        Map<Long, Prescricao> porMedicamento = acolhido.getPrescricoes().stream()
                .collect(Collectors.toMap(p -> p.getMedicamento().getId(), p -> p));

        Map<Long, PrescricaoRequestDTO> entradas = new LinkedHashMap<>();
        for (PrescricaoRequestDTO dto : dtos) {
            if (dto != null && dto.getMedicamentoId() != null) {
                entradas.put(dto.getMedicamentoId(), dto);
            }
        }

        for (PrescricaoRequestDTO dto : entradas.values()) {
            Prescricao prescricao = porMedicamento.get(dto.getMedicamentoId());
            if (prescricao == null) {
                throw new BusinessException(
                        "O medicamento id " + dto.getMedicamentoId()
                                + " não está vinculado a este acolhido.");
            }

            int novaManha = valorDose(dto.getDoseManha());
            int novaTarde = valorDose(dto.getDoseTarde());
            int novaNoite = valorDose(dto.getDoseNoite());
            int velhaManha = valorDose(prescricao.getDoseManha());
            int velhaTarde = valorDose(prescricao.getDoseTarde());
            int velhaNoite = valorDose(prescricao.getDoseNoite());

            // Quando a dose de um período muda, as marcações de administração
            // feitas com a dose antiga deixam de valer: são limpas (o checkbox
            // volta a aparecer vazio) e o estoque debitado é devolvido. Períodos
            // sem alteração mantêm suas marcações.
            if (novaManha != velhaManha) {
                limparMarcacoesDoPeriodo(acolhidoId, prescricao, PeriodoDia.MANHA, velhaManha);
            }
            if (novaTarde != velhaTarde) {
                limparMarcacoesDoPeriodo(acolhidoId, prescricao, PeriodoDia.TARDE, velhaTarde);
            }
            if (novaNoite != velhaNoite) {
                limparMarcacoesDoPeriodo(acolhidoId, prescricao, PeriodoDia.NOITE, velhaNoite);
            }

            prescricao.setDoseManha(novaManha);
            prescricao.setDoseTarde(novaTarde);
            prescricao.setDoseNoite(novaNoite);
        }

        return acolhido.getPrescricoes().stream()
                .map(PrescricaoResponseDTO::fromEntity)
                .toList();
    }

    /**
     * Ajusta o estoque reservado de um medicamento para um acolhido (edição
     * direta na listagem de medicamentos). Move comprimidos entre o estoque
     * livre do medicamento e o estoque exclusivo do acolhido conforme a variação.
     */
    @Transactional
    public PrescricaoResponseDTO atualizarEstoqueReservado(
            Long acolhidoId, Long medicamentoId, Integer totalComprimidos) {
        Acolhido acolhido = acolhidoRepository
                .findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));

        if (acolhido.getPrescricoes() == null) {
            acolhido.setPrescricoes(new ArrayList<>());
        }

        Prescricao prescricao = acolhido.getPrescricoes().stream()
                .filter(p -> p.getMedicamento() != null
                        && medicamentoId.equals(p.getMedicamento().getId()))
                .findFirst()
                .orElse(null);

        int novo = valorDose(totalComprimidos);

        // Sem vínculo prévio: cria a prescrição (reserva a partir da página de
        // medicamentos). Reservar zero sem vínculo não faz sentido.
        if (prescricao == null) {
            if (novo <= 0) {
                throw new BusinessException(
                        "Informe uma quantidade maior que zero para reservar o "
                                + "medicamento a este acolhido.");
            }
            Medicamento medicamento = medicamentoRepository
                    .findByIdAndUsuario(medicamentoId, usuarioContext.id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Medicamento não encontrado com o id: " + medicamentoId));
            medicamentoService.reservarEstoque(medicamento, novo);
            Prescricao nova = Prescricao.builder()
                    .usuario(usuarioContext.referencia())
                    .acolhido(acolhido)
                    .medicamento(medicamento)
                    .doseManha(0)
                    .doseTarde(0)
                    .doseNoite(0)
                    .totalComprimidos(novo)
                    .build();
            acolhido.getPrescricoes().add(nova);
            // Persiste em cascata e gera o id da nova prescricao antes de montar
            // a resposta; sem o flush, o DTO voltaria com id nulo e o frontend
            // rejeitaria a resposta como "formato inesperado".
            acolhidoRepository.flush();
            return PrescricaoResponseDTO.fromEntity(nova);
        }

        int atual = valorDose(prescricao.getTotalComprimidos());
        int delta = novo - atual;
        Medicamento medicamento = prescricao.getMedicamento();
        if (delta > 0) {
            medicamentoService.reservarEstoque(medicamento, delta);
        } else if (delta < 0) {
            medicamentoService.liberarEstoque(medicamento, -delta);
        }
        prescricao.setTotalComprimidos(novo);
        return PrescricaoResponseDTO.fromEntity(prescricao);
    }

    /**
     * Remove as marcações de administração de um medicamento em um período,
     * apenas de HOJE em diante (os dias que já passaram são preservados), e
     * devolve ao estoque as doses que estavam marcadas como tomadas nesses dias
     * (calculadas pela dose anterior, vigente quando foram registradas). Assim, a
     * nova dose vale a partir de hoje sem alterar o histórico passado.
     */
    private void limparMarcacoesDoPeriodo(
            Long acolhidoId, Prescricao prescricao, PeriodoDia periodo, int doseAntiga) {
        Medicamento medicamento = prescricao.getMedicamento();
        LocalDate hoje = LocalDate.now();
        List<AdministracaoMedicamento> marcas = administracaoRepository
                .listarPorMedicamentoPeriodoDesde(
                        acolhidoId, usuarioContext.id(), medicamento.getId(), periodo, hoje);
        if (marcas.isEmpty()) {
            return;
        }

        if (doseAntiga > 0) {
            long tomadas = marcas.stream()
                    .filter(m -> Boolean.TRUE.equals(m.getTomado()))
                    .count();
            int credito = (int) (tomadas * doseAntiga);
            if (credito > 0) {
                // Devolve ao estoque reservado do acolhido (a prescricao), e nao
                // ao estoque livre do medicamento.
                prescricao.setTotalComprimidos(
                        valorDose(prescricao.getTotalComprimidos()) + credito);
            }
        }

        administracaoRepository.deleteByMedicamentoPeriodoDesde(
                acolhidoId, usuarioContext.id(), medicamento.getId(), periodo, hoje);
    }

    private int valorDose(Integer valor) {
        return valor == null || valor < 0 ? 0 : valor;
    }
}
