package com.ctav.api.service;

import com.ctav.api.dto.PrescricaoRequestDTO;
import com.ctav.api.dto.PrescricaoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Prescricao;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ApplicationScoped
public class PrescricaoService {

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    UsuarioContext usuarioContext;

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
            prescricao.setDoseManha(valorDose(dto.getDoseManha()));
            prescricao.setDoseTarde(valorDose(dto.getDoseTarde()));
            prescricao.setDoseNoite(valorDose(dto.getDoseNoite()));
        }

        return acolhido.getPrescricoes().stream()
                .map(PrescricaoResponseDTO::fromEntity)
                .toList();
    }

    private int valorDose(Integer valor) {
        return valor == null || valor < 0 ? 0 : valor;
    }
}
