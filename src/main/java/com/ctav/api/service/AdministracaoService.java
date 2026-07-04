package com.ctav.api.service;

import com.ctav.api.dto.AdministracaoRequestDTO;
import com.ctav.api.dto.AdministracaoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.AdministracaoMedicamento;
import com.ctav.api.entity.Medicamento;
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

        AdministracaoMedicamento registro = administracaoRepository
                .buscar(acolhidoId, usuarioContext.id(), dto.getMedicamentoId(),
                        dto.getData(), dto.getPeriodo())
                .orElse(null);

        if (registro == null) {
            registro = AdministracaoMedicamento.builder()
                    .usuario(usuarioContext.referencia())
                    .acolhido(acolhido)
                    .medicamento(medicamento)
                    .data(dto.getData())
                    .periodo(dto.getPeriodo())
                    .tomado(Boolean.TRUE.equals(dto.getTomado()))
                    .build();
        } else {
            registro.setTomado(Boolean.TRUE.equals(dto.getTomado()));
        }

        administracaoRepository.persist(registro);
        return AdministracaoResponseDTO.fromEntity(registro);
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
