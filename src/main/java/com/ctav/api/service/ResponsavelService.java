package com.ctav.api.service;

import com.ctav.api.dto.ResponsavelRequestDTO;
import com.ctav.api.dto.ResponsavelResponseDTO;
import com.ctav.api.entity.Responsavel;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.ResponsavelRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ResponsavelService {

    @Inject
    ResponsavelRepository responsavelRepository;

    @Inject
    UsuarioContext usuarioContext;

    public List<ResponsavelResponseDTO> listar() {
        return responsavelRepository.listarPorUsuario(usuarioContext.id())
                .stream()
                .map(this::montarResposta)
                .toList();
    }

    public ResponsavelResponseDTO buscarPorId(Long id) {
        return montarResposta(buscarEntidadePorId(id));
    }

    // Monta a resposta incluindo a quantidade e os nomes dos acolhidos vinculados.
    private ResponsavelResponseDTO montarResposta(Responsavel responsavel) {
        List<String> nomes = responsavelRepository.listarNomesAcolhidos(responsavel.getId());
        return ResponsavelResponseDTO.fromEntity(
                responsavel, (long) nomes.size(), nomes);
    }

    @Transactional
    public ResponsavelResponseDTO criar(ResponsavelRequestDTO dto) {
        validarUnicidade(dto.getCpf(), null);
        Responsavel responsavel = Responsavel.builder()
                .usuario(usuarioContext.referencia())
                .nome(dto.getNome().trim())
                .rg(normalizar(dto.getRg()))
                .cpf(normalizar(dto.getCpf()))
                .endereco(normalizar(dto.getEndereco()))
                .bairro(normalizar(dto.getBairro()))
                .cidade(normalizar(dto.getCidade()))
                .estado(normalizarEstado(dto.getEstado()))
                .cep(normalizar(dto.getCep()))
                .celular(normalizar(dto.getCelular()))
                .conveniado(Boolean.TRUE.equals(dto.getConveniado()))
                .assinatura(normalizarAssinatura(dto.getAssinatura()))
                .build();
        responsavelRepository.persist(responsavel);
        return ResponsavelResponseDTO.fromEntity(responsavel, 0L);
    }

    @Transactional
    public ResponsavelResponseDTO atualizar(Long id, ResponsavelRequestDTO dto) {
        Responsavel responsavel = buscarEntidadePorId(id);
        validarUnicidade(dto.getCpf(), id);
        responsavel.setNome(dto.getNome().trim());
        responsavel.setRg(normalizar(dto.getRg()));
        responsavel.setCpf(normalizar(dto.getCpf()));
        responsavel.setEndereco(normalizar(dto.getEndereco()));
        responsavel.setBairro(normalizar(dto.getBairro()));
        responsavel.setCidade(normalizar(dto.getCidade()));
        responsavel.setEstado(normalizarEstado(dto.getEstado()));
        responsavel.setCep(normalizar(dto.getCep()));
        responsavel.setCelular(normalizar(dto.getCelular()));
        responsavel.setConveniado(Boolean.TRUE.equals(dto.getConveniado()));
        // A assinatura so e alterada quando enviada explicitamente: null preserva
        // o valor atual e "" (vazia) remove a assinatura existente.
        if (dto.getAssinatura() != null) {
            responsavel.setAssinatura(normalizarAssinatura(dto.getAssinatura()));
        }
        responsavelRepository.persist(responsavel);
        return montarResposta(responsavel);
    }

    @Transactional
    public void deletar(Long id) {
        Responsavel responsavel = buscarEntidadePorId(id);
        if (responsavelRepository.contarAcolhidos(id) > 0) {
            throw new BusinessException(
                    "Não é possível excluir o responsável \"" + responsavel.getNome()
                            + "\" porque ele está vinculado a um ou mais acolhidos.");
        }
        responsavelRepository.delete(responsavel);
    }

    // Usado pelo AcolhidoService para validar/associar o responsavel informado.
    public Responsavel obterDoUsuario(Long id) {
        return buscarEntidadePorId(id);
    }

    private Responsavel buscarEntidadePorId(Long id) {
        return responsavelRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Responsável não encontrado com o id: " + id));
    }

    private void validarUnicidade(String cpf, Long idAtual) {
        if (cpf == null || cpf.isBlank()) {
            return;
        }
        responsavelRepository.findByCpfAndUsuario(cpf.trim(), usuarioContext.id()).ifPresent(r -> {
            if (idAtual == null || !r.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um responsável cadastrado com este CPF.");
            }
        });
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }

    private String normalizarEstado(String estado) {
        String limpo = normalizar(estado);
        return limpo == null ? null : limpo.toUpperCase();
    }

    // A assinatura e uma data URL base64; so trata vazio/branco como ausencia,
    // sem alterar o conteudo em si.
    private String normalizarAssinatura(String valor) {
        return valor != null && !valor.isBlank() ? valor : null;
    }
}
