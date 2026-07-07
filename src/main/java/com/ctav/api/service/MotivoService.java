package com.ctav.api.service;

import com.ctav.api.dto.MotivoRequestDTO;
import com.ctav.api.dto.MotivoResponseDTO;
import com.ctav.api.entity.Motivo;
import com.ctav.api.enums.CategoriaMotivo;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.MotivoRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class MotivoService {

    // Padroes criados automaticamente na primeira vez que o usuario abre a lista,
    // para que os cadastros de acolhido (que exigem motivo) nunca fiquem sem opcoes.
    private static final List<String> PADROES_ADESAO = List.of(
            "Vontade própria",
            "Família / parentes",
            "Ordem judicial",
            "Indicação de terceiros",
            "Igreja / religião");

    private static final List<String> PADROES_DESISTENCIA = List.of(
            "Vontade própria",
            "Problemas familiares",
            "Dificuldade de adaptação",
            "Questões de saúde",
            "Outro");

    @Inject
    MotivoRepository motivoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public List<MotivoResponseDTO> listar(CategoriaMotivo categoria) {
        Long usuarioId = usuarioContext.id();
        if (motivoRepository.contarPorUsuarioECategoria(usuarioId, categoria) == 0) {
            semearPadroes(categoria);
        }
        return motivoRepository.listarPorUsuarioECategoria(usuarioId, categoria)
                .stream()
                .map(MotivoResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public MotivoResponseDTO criar(MotivoRequestDTO dto) {
        validarUnicidade(dto.getCategoria(), dto.getNome(), null);
        Motivo motivo = Motivo.builder()
                .usuario(usuarioContext.referencia())
                .categoria(dto.getCategoria())
                .nome(dto.getNome().trim())
                .descricao(normalizarDescricao(dto.getDescricao()))
                .build();
        motivoRepository.persist(motivo);
        return MotivoResponseDTO.fromEntity(motivo);
    }

    public MotivoResponseDTO buscarPorId(Long id) {
        return MotivoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public MotivoResponseDTO atualizar(Long id, MotivoRequestDTO dto) {
        Motivo motivo = buscarEntidadePorId(id);
        validarUnicidade(dto.getCategoria(), dto.getNome(), id);
        motivo.setCategoria(dto.getCategoria());
        motivo.setNome(dto.getNome().trim());
        motivo.setDescricao(normalizarDescricao(dto.getDescricao()));
        motivoRepository.persist(motivo);
        return MotivoResponseDTO.fromEntity(motivo);
    }

    @Transactional
    public void deletar(Long id) {
        Motivo motivo = buscarEntidadePorId(id);
        if (motivoRepository.existsAcolhidoComMotivo(id)) {
            throw new BusinessException(
                    "Não é possível excluir o motivo \"" + motivo.getNome()
                            + "\" porque ele está vinculado a um ou mais acolhidos.");
        }
        motivoRepository.delete(motivo);
    }

    // Usado pelo AcolhidoService para validar/associar o motivo informado.
    public Motivo obterDoUsuario(Long id, CategoriaMotivo categoriaEsperada) {
        Motivo motivo = buscarEntidadePorId(id);
        if (motivo.getCategoria() != categoriaEsperada) {
            throw new BusinessException("O motivo informado não é da categoria esperada.");
        }
        return motivo;
    }

    private void semearPadroes(CategoriaMotivo categoria) {
        List<String> nomes = categoria == CategoriaMotivo.ADESAO
                ? PADROES_ADESAO
                : PADROES_DESISTENCIA;
        for (String nome : nomes) {
            motivoRepository.persist(Motivo.builder()
                    .usuario(usuarioContext.referencia())
                    .categoria(categoria)
                    .nome(nome)
                    .build());
        }
    }

    private Motivo buscarEntidadePorId(Long id) {
        return motivoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Motivo não encontrado com o id: " + id));
    }

    private void validarUnicidade(CategoriaMotivo categoria, String nome, Long idAtual) {
        motivoRepository.findByNome(usuarioContext.id(), categoria, nome.trim()).ifPresent(m -> {
            if (idAtual == null || !m.getId().equals(idAtual)) {
                throw new BusinessException(
                        "Já existe um motivo com este nome nesta categoria.");
            }
        });
    }

    private String normalizarDescricao(String descricao) {
        if (descricao == null) {
            return null;
        }
        String limpa = descricao.trim();
        return limpa.isEmpty() ? null : limpa;
    }
}
