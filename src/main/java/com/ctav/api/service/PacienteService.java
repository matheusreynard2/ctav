package com.ctav.api.service;

import com.ctav.api.dto.PacienteRequestDTO;
import com.ctav.api.dto.PacienteResponseDTO;
import com.ctav.api.entity.Paciente;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.PacienteRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PacienteService {

    private final PacienteRepository pacienteRepository;

    @Transactional
    public PacienteResponseDTO criar(PacienteRequestDTO dto) {
        validarUnicidade(dto.getCpf(), dto.getEmail(), null);

        Paciente paciente = Paciente.builder()
                .nome(dto.getNome())
                .cpf(dto.getCpf())
                .dataNascimento(dto.getDataNascimento())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .sexo(dto.getSexo())
                .endereco(dto.getEndereco())
                .remedios_prescritos(dto.getRemedios_prescritos())
                .build();

        Paciente salvo = pacienteRepository.save(paciente);
        return PacienteResponseDTO.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public List<PacienteResponseDTO> listar() {
        return pacienteRepository.findAll()
                .stream()
                .map(PacienteResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public PacienteResponseDTO buscarPorId(Long id) {
        return PacienteResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public PacienteResponseDTO atualizar(Long id, PacienteRequestDTO dto) {
        Paciente paciente = buscarEntidadePorId(id);
        validarUnicidade(dto.getCpf(), dto.getEmail(), id);

        paciente.setNome(dto.getNome());
        paciente.setCpf(dto.getCpf());
        paciente.setDataNascimento(dto.getDataNascimento());
        paciente.setEmail(dto.getEmail());
        paciente.setTelefone(dto.getTelefone());
        paciente.setSexo(dto.getSexo());
        paciente.setEndereco(dto.getEndereco());    
        paciente.setRemedios_prescritos(dto.getRemedios_prescritos());
        return PacienteResponseDTO.fromEntity(pacienteRepository.save(paciente));
    }

    @Transactional
    public void deletar(Long id) {
        Paciente paciente = buscarEntidadePorId(id);
        pacienteRepository.delete(paciente);
    }

    private Paciente buscarEntidadePorId(Long id) {
        return pacienteRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Paciente não encontrado com o id: " + id));
    }

    private void validarUnicidade(String cpf, String email, Long idAtual) {
        pacienteRepository.findByCpf(cpf).ifPresent(p -> {
            if (idAtual == null || !p.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um paciente cadastrado com este CPF");
            }
        });

        if (email != null && !email.isBlank()) {
            pacienteRepository.findByEmail(email).ifPresent(p -> {
                if (idAtual == null || !p.getId().equals(idAtual)) {
                    throw new BusinessException("Já existe um paciente cadastrado com este email");
                }
            });
        }
    }
}
