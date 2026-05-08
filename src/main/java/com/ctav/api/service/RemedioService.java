package com.ctav.api.service;

import com.ctav.api.dto.PacienteRequestDTO;
import com.ctav.api.dto.PacienteResponseDTO;
import com.ctav.api.dto.RemedioRequestDTO;
import com.ctav.api.dto.RemedioResponseDTO;
import com.ctav.api.entity.Paciente;
import com.ctav.api.entity.Remedio;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.PacienteRepository;
import com.ctav.api.repository.RemedioRepository;

import java.util.List;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class RemedioService {

    private final RemedioRepository remedioRepository;

    @Transactional
    public RemedioResponseDTO criar(RemedioRequestDTO dto) {
        validarUnicidade(dto.getNome(), null);

        Remedio remedio = Remedio.builder()
                .nome(dto.getNome())
                .quantidade_caixas(dto.getQuantidade_caixas()).build();

        Remedio salvo = remedioRepository.save(remedio);
        return RemedioResponseDTO.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public List<RemedioResponseDTO> listar() {
        return remedioRepository.findAll()
                .stream()
                .map(RemedioResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public RemedioResponseDTO buscarPorId(Long id) {
        return RemedioResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public RemedioResponseDTO atualizar(Long id, RemedioRequestDTO dto) {
        Remedio remedio = buscarEntidadePorId(id);
        validarUnicidade(dto.getNome(), id);
        remedio.setNome(dto.getNome());
        remedio.setQuantidade_caixas(dto.getQuantidade_caixas());
        return RemedioResponseDTO.fromEntity(remedioRepository.save(remedio));   
    }

    @Transactional
    public void deletar(Long id) {
        Remedio remedio = buscarEntidadePorId(id);
        remedioRepository.delete(remedio);
    }

    private Remedio buscarEntidadePorId(Long id) {
        return remedioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Remedio não encontrado com o id: " + id));
    }

    private void validarUnicidade(String nomeRemedio,Long idAtual) {
        remedioRepository.findByNome(nomeRemedio).ifPresent(p -> {
            if (idAtual == null || !p.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um remédio cadastrado com este nome.");
            }
        });
    }
}
