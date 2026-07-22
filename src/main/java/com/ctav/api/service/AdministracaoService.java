package com.ctav.api.service;

import com.ctav.api.dto.AdministracaoRequestDTO;
import com.ctav.api.dto.AdministracaoResponseDTO;
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
import java.time.YearMonth;
import java.util.List;

@ApplicationScoped
public class AdministracaoService {

    @Inject
    AdministracaoRepository administracaoRepository;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    MedicamentoRepository medicamentoRepository;

    @Inject
    UsuarioContext usuarioContext;

    public List<AdministracaoResponseDTO> listar(Long acolhidoId, LocalDate data) {
        garantirAcolhido(acolhidoId);
        return administracaoRepository
                .listarPorAcolhidoEData(acolhidoId, usuarioContext.id(), data)
                .stream()
                .map(AdministracaoResponseDTO::fromEntity)
                .toList();
    }

    public List<AdministracaoResponseDTO> listarMes(Long acolhidoId, int ano, int mes) {
        garantirAcolhido(acolhidoId);
        YearMonth ym = YearMonth.of(ano, mes);
        LocalDate inicio = ym.atDay(1);
        LocalDate fim = ym.atEndOfMonth();
        return administracaoRepository
                .listarPorAcolhidoEMes(acolhidoId, usuarioContext.id(), inicio, fim)
                .stream()
                .map(AdministracaoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public AdministracaoResponseDTO registrar(Long acolhidoId, AdministracaoRequestDTO dto) {
        Acolhido acolhido = garantirAcolhido(acolhidoId);
        Medicamento medicamento = garantirMedicamento(dto.getMedicamentoId());

        // Só é permitido administrar (marcar/desmarcar) em dias de hoje em diante.
        // Os dias que já passaram ficam bloqueados para preservar o histórico.
        if (dto.getData() != null && dto.getData().isBefore(LocalDate.now())) {
            throw new BusinessException(
                    "Só é possível registrar administração para hoje ou datas futuras. "
                            + "Os dias anteriores ficam bloqueados.");
        }

        AdministracaoMedicamento registro = administracaoRepository
                .buscar(acolhidoId, usuarioContext.id(), dto.getMedicamentoId(),
                        dto.getData(), dto.getPeriodo())
                .orElse(null);

        boolean tomadoAnterior = registro != null && Boolean.TRUE.equals(registro.getTomado());
        boolean tomadoNovo = Boolean.TRUE.equals(dto.getTomado());

        if (tomadoAnterior != tomadoNovo) {
            Prescricao prescricao = obterPrescricao(acolhido, dto.getMedicamentoId());
            int dose = prescricao != null ? doseDoPeriodo(prescricao, dto.getPeriodo()) : 0;
            if (prescricao != null && dose > 0) {
                // O estoque debitado/creditado e o da PRESCRICAO (reservado para
                // este acolhido), e nao mais o estoque livre do medicamento.
                int reserva = valorDose(prescricao.getTotalComprimidos());
                if (tomadoNovo) {
                    if (dose > reserva) {
                        throw new BusinessException(
                                "Estoque insuficiente reservado para o acolhido \""
                                        + acolhido.getNome() + "\" do medicamento \""
                                        + medicamento.getNome() + "\". Reservado: " + reserva
                                        + " comprimido(s); necessário: " + dose
                                        + ". Ajuste a reserva na edição do acolhido.");
                    }
                    prescricao.setTotalComprimidos(reserva - dose);
                } else {
                    prescricao.setTotalComprimidos(reserva + dose);
                }
            }
        }

        if (registro == null) {
            registro = AdministracaoMedicamento.builder()
                    .usuario(usuarioContext.referencia())
                    .acolhido(acolhido)
                    .medicamento(medicamento)
                    .data(dto.getData())
                    .periodo(dto.getPeriodo())
                    .tomado(tomadoNovo)
                    .build();
        } else {
            registro.setTomado(tomadoNovo);
        }

        administracaoRepository.persist(registro);
        return AdministracaoResponseDTO.fromEntity(registro);
    }

    private Prescricao obterPrescricao(Acolhido acolhido, Long medicamentoId) {
        return acolhido.getPrescricoes().stream()
                .filter(p -> p.getMedicamento() != null
                        && medicamentoId.equals(p.getMedicamento().getId()))
                .findFirst()
                .orElse(null);
    }

    private int doseDoPeriodo(Prescricao prescricao, PeriodoDia periodo) {
        return switch (periodo) {
            case MANHA -> valorDose(prescricao.getDoseManha());
            case TARDE -> valorDose(prescricao.getDoseTarde());
            case NOITE -> valorDose(prescricao.getDoseNoite());
        };
    }

    private int valorDose(Integer valor) {
        return valor == null || valor < 0 ? 0 : valor;
    }

    private Acolhido garantirAcolhido(Long acolhidoId) {
        return acolhidoRepository.findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));
    }

    private Medicamento garantirMedicamento(Long medicamentoId) {
        return medicamentoRepository.findByIdAndUsuario(medicamentoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Medicamento não encontrado com o id: " + medicamentoId));
    }
}
