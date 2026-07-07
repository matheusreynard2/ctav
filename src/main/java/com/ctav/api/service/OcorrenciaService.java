package com.ctav.api.service;

import com.ctav.api.dto.OcorrenciaRequestDTO;
import com.ctav.api.dto.OcorrenciaResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Ocorrencia;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.OcorrenciaRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.stream.Collectors;

@ApplicationScoped
public class OcorrenciaService {

    @Inject
    OcorrenciaRepository ocorrenciaRepository;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public OcorrenciaResponseDTO criar(OcorrenciaRequestDTO dto) {
        List<Acolhido> acolhidos = resolverAcolhidos(dto.getAcolhidoIds());

        Ocorrencia ocorrencia = Ocorrencia.builder()
                .usuario(usuarioContext.referencia())
                .acolhidos(acolhidos)
                .acolhidosNomes(nomesDe(acolhidos))
                .titulo(dto.getTitulo())
                .descricao(dto.getDescricao())
                .dataOcorrencia(dto.getDataOcorrencia())
                .build();

        ocorrenciaRepository.persist(ocorrencia);
        return OcorrenciaResponseDTO.fromEntity(ocorrencia);
    }

    public List<OcorrenciaResponseDTO> listar() {
        return ocorrenciaRepository.listarPorUsuarioMaisRecentes(usuarioContext.id())
                .stream()
                .map(OcorrenciaResponseDTO::fromEntity)
                .toList();
    }

    public OcorrenciaResponseDTO buscarPorId(Long id) {
        return OcorrenciaResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public OcorrenciaResponseDTO atualizar(Long id, OcorrenciaRequestDTO dto) {
        Ocorrencia ocorrencia = buscarEntidadePorId(id);
        List<Acolhido> acolhidos = resolverAcolhidos(dto.getAcolhidoIds());

        ocorrencia.getAcolhidos().clear();
        ocorrencia.getAcolhidos().addAll(acolhidos);
        // Atualiza o snapshot com os nomes vinculados; se ficar sem vinculos,
        // preserva o snapshot anterior para nao perder o historico.
        String nomes = nomesDe(acolhidos);
        if (nomes != null && !nomes.isBlank()) {
            ocorrencia.setAcolhidosNomes(nomes);
        }
        ocorrencia.setTitulo(dto.getTitulo());
        ocorrencia.setDescricao(dto.getDescricao());
        ocorrencia.setDataOcorrencia(dto.getDataOcorrencia());
        ocorrenciaRepository.persist(ocorrencia);
        return OcorrenciaResponseDTO.fromEntity(ocorrencia);
    }

    @Transactional
    public void deletar(Long id) {
        Ocorrencia ocorrencia = buscarEntidadePorId(id);
        ocorrenciaRepository.delete(ocorrencia);
    }

    private Ocorrencia buscarEntidadePorId(Long id) {
        return ocorrenciaRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ocorrência não encontrada com o id: " + id));
    }

    // Resolve os ids informados em acolhidos do usuario, ignorando duplicatas e
    // nulos. Um id inexistente/de outro usuario resulta em erro.
    private List<Acolhido> resolverAcolhidos(List<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return new ArrayList<>();
        }
        LinkedHashSet<Long> unicos = ids.stream()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Acolhido> resultado = new ArrayList<>();
        for (Long id : unicos) {
            Acolhido acolhido = acolhidoRepository
                    .findByIdAndUsuario(id, usuarioContext.id())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Acolhido não encontrado com o id: " + id));
            resultado.add(acolhido);
        }
        return resultado;
    }

    private String nomesDe(List<Acolhido> acolhidos) {
        if (acolhidos == null || acolhidos.isEmpty()) {
            return null;
        }
        return acolhidos.stream()
                .map(Acolhido::getNome)
                .collect(Collectors.joining(", "));
    }
}
