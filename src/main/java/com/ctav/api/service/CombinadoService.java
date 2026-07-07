package com.ctav.api.service;

import com.ctav.api.dto.CombinadoRequestDTO;
import com.ctav.api.dto.CombinadoResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Combinado;
import com.ctav.api.enums.TipoCombinado;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.CombinadoRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class CombinadoService {

    @Inject
    CombinadoRepository combinadoRepository;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public CombinadoResponseDTO criar(CombinadoRequestDTO dto) {
        Acolhido acolhido = buscarAcolhido(dto.getAcolhidoId());
        validarDatas(dto);

        boolean ressocializacao = dto.getTipo() == TipoCombinado.RESSOCIALIZACAO;
        Combinado combinado = Combinado.builder()
                .usuario(usuarioContext.referencia())
                .acolhido(acolhido)
                .tipo(dto.getTipo())
                .descricao(dto.getDescricao())
                .dataIda(ressocializacao ? dto.getDataIda() : null)
                .dataVolta(ressocializacao ? dto.getDataVolta() : null)
                .dataCombinado(ressocializacao ? null : dto.getDataCombinado())
                .build();

        combinadoRepository.persist(combinado);
        return CombinadoResponseDTO.fromEntity(combinado);
    }

    public List<CombinadoResponseDTO> listar() {
        return combinadoRepository.listarPorUsuarioMaisRecentes(usuarioContext.id())
                .stream()
                .map(CombinadoResponseDTO::fromEntity)
                .toList();
    }

    public CombinadoResponseDTO buscarPorId(Long id) {
        return CombinadoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public CombinadoResponseDTO atualizar(Long id, CombinadoRequestDTO dto) {
        Combinado combinado = buscarEntidadePorId(id);
        Acolhido acolhido = buscarAcolhido(dto.getAcolhidoId());
        validarDatas(dto);

        boolean ressocializacao = dto.getTipo() == TipoCombinado.RESSOCIALIZACAO;
        combinado.setAcolhido(acolhido);
        combinado.setTipo(dto.getTipo());
        combinado.setDescricao(dto.getDescricao());
        combinado.setDataIda(ressocializacao ? dto.getDataIda() : null);
        combinado.setDataVolta(ressocializacao ? dto.getDataVolta() : null);
        combinado.setDataCombinado(ressocializacao ? null : dto.getDataCombinado());
        combinadoRepository.persist(combinado);
        return CombinadoResponseDTO.fromEntity(combinado);
    }

    @Transactional
    public void deletar(Long id) {
        Combinado combinado = buscarEntidadePorId(id);
        combinadoRepository.delete(combinado);
    }

    private Combinado buscarEntidadePorId(Long id) {
        return combinadoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Combinado não encontrado com o id: " + id));
    }

    private Acolhido buscarAcolhido(Long acolhidoId) {
        return acolhidoRepository.findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));
    }

    private void validarDatas(CombinadoRequestDTO dto) {
        if (dto.getTipo() == TipoCombinado.RESSOCIALIZACAO) {
            if (dto.getDataIda() == null || dto.getDataVolta() == null) {
                throw new BusinessException(
                        "Para ressocialização, informe a data de ida e a data de volta.");
            }
            if (dto.getDataVolta().isBefore(dto.getDataIda())) {
                throw new BusinessException(
                        "A data de volta não pode ser anterior à data de ida.");
            }
        } else if (dto.getDataCombinado() == null) {
            throw new BusinessException("Informe a data do combinado.");
        }
    }
}
