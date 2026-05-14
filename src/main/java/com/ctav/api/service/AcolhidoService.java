package com.ctav.api.service;

import com.ctav.api.dto.AcolhidoRequestDTO;
import com.ctav.api.dto.AcolhidoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Remedio;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.RemedioRepository;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AcolhidoService {

    private final AcolhidoRepository acolhidoRepository;
    private final RemedioRepository remedioRepository;

    @Transactional
    public AcolhidoResponseDTO criar(AcolhidoRequestDTO dto) {
        validarUnicidade(dto.getCpf(), dto.getEmail(), null);

        Acolhido acolhido = Acolhido.builder()
                .nome(dto.getNome())
                .cpf(dto.getCpf())
                .dataNascimento(dto.getDataNascimento())
                .dataAcolhimentoCtav(dto.getDataAcolhimentoCtav())
                .dataSaidaCtav(dto.getDataSaidaCtav())
                .email(dto.getEmail())
                .telefone(dto.getTelefone())
                .sexo(dto.getSexo())
                .endereco(dto.getEndereco())
                .remedios_prescritos(buscarRemediosPorIds(dto.getRemedios_prescritos_ids()))
                .build();

        Acolhido salvo = acolhidoRepository.save(acolhido);
        return AcolhidoResponseDTO.fromEntity(salvo);
    }

    @Transactional(readOnly = true)
    public List<AcolhidoResponseDTO> listar() {
        return acolhidoRepository.findAll()
                .stream()
                .map(AcolhidoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional(readOnly = true)
    public AcolhidoResponseDTO buscarPorId(Long id) {
        return AcolhidoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public AcolhidoResponseDTO atualizar(Long id, AcolhidoRequestDTO dto) {
        Acolhido acolhido = buscarEntidadePorId(id);
        validarUnicidade(dto.getCpf(), dto.getEmail(), id);

        acolhido.setNome(dto.getNome());
        acolhido.setCpf(dto.getCpf());
        acolhido.setDataNascimento(dto.getDataNascimento());
        acolhido.setDataAcolhimentoCtav(dto.getDataAcolhimentoCtav());
        acolhido.setDataSaidaCtav(dto.getDataSaidaCtav());
        acolhido.setEmail(dto.getEmail());
        acolhido.setTelefone(dto.getTelefone());
        acolhido.setSexo(dto.getSexo());
        acolhido.setEndereco(dto.getEndereco());
        acolhido.setRemedios_prescritos(buscarRemediosPorIds(dto.getRemedios_prescritos_ids()));
        return AcolhidoResponseDTO.fromEntity(acolhidoRepository.save(acolhido));
    }

    @Transactional
    public void deletar(Long id) {
        Acolhido acolhido = buscarEntidadePorId(id);
        acolhidoRepository.delete(acolhido);
    }

    private Acolhido buscarEntidadePorId(Long id) {
        return acolhidoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + id));
    }

    private List<Remedio> buscarRemediosPorIds(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }

        List<Long> idsUnicos = ids.stream().distinct().toList();
        List<Remedio> encontrados = remedioRepository.findAllById(idsUnicos);

        if (encontrados.size() != idsUnicos.size()) {
            Set<Long> idsEncontrados = encontrados.stream()
                    .map(Remedio::getId)
                    .collect(Collectors.toCollection(HashSet::new));
            List<Long> idsFaltando = idsUnicos.stream()
                    .filter(oid -> !idsEncontrados.contains(oid))
                    .toList();
            throw new ResourceNotFoundException(
                    "Remédio(s) não encontrado(s) com os ids: " + idsFaltando);
        }

        return new ArrayList<>(encontrados);
    }

    private void validarUnicidade(String cpf, String email, Long idAtual) {
        acolhidoRepository.findByCpf(cpf).ifPresent(p -> {
            if (idAtual == null || !p.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um acolhido cadastrado com este CPF");
            }
        });

        if (email != null && !email.isBlank()) {
            acolhidoRepository.findByEmail(email).ifPresent(p -> {
                if (idAtual == null || !p.getId().equals(idAtual)) {
                    throw new BusinessException("Já existe um acolhido cadastrado com este email");
                }
            });
        }
    }
}
