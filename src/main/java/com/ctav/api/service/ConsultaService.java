package com.ctav.api.service;

import com.ctav.api.dto.ConsultaRequestDTO;
import com.ctav.api.dto.ConsultaResponseDTO;
import com.ctav.api.entity.Acolhido;
import com.ctav.api.entity.Consulta;
import com.ctav.api.enums.StatusConsulta;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AcolhidoRepository;
import com.ctav.api.repository.ConsultaRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class ConsultaService {

    @Inject
    ConsultaRepository consultaRepository;

    @Inject
    AcolhidoRepository acolhidoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public ConsultaResponseDTO criar(ConsultaRequestDTO dto) {
        Acolhido acolhido = buscarAcolhido(dto.getAcolhidoId());

        Consulta consulta = Consulta.builder()
                .usuario(usuarioContext.referencia())
                .acolhido(acolhido)
                .dataHora(dto.getDataHora())
                .descricao(dto.getDescricao())
                .profissional(normalizar(dto.getProfissional()))
                .local(normalizar(dto.getLocal()))
                .status(dto.getStatus() != null ? dto.getStatus() : StatusConsulta.AGENDADA)
                .resumo(normalizar(dto.getResumo()))
                .build();

        consultaRepository.persist(consulta);
        return ConsultaResponseDTO.fromEntity(consulta);
    }

    public List<ConsultaResponseDTO> listar() {
        return consultaRepository.listarPorUsuarioMaisRecentes(usuarioContext.id())
                .stream()
                .map(ConsultaResponseDTO::fromEntity)
                .toList();
    }

    public ConsultaResponseDTO buscarPorId(Long id) {
        return ConsultaResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public ConsultaResponseDTO atualizar(Long id, ConsultaRequestDTO dto) {
        Consulta consulta = buscarEntidadePorId(id);

        // Consultas já realizadas podem ter todos os campos editados, EXCETO a
        // situação (permanecem realizadas). Demais status podem mudar livremente.
        boolean jaRealizada = consulta.getStatus() == StatusConsulta.REALIZADA;

        Acolhido acolhido = buscarAcolhido(dto.getAcolhidoId());

        consulta.setAcolhido(acolhido);
        consulta.setDataHora(dto.getDataHora());
        consulta.setDescricao(dto.getDescricao());
        consulta.setProfissional(normalizar(dto.getProfissional()));
        consulta.setLocal(normalizar(dto.getLocal()));
        if (!jaRealizada) {
            consulta.setStatus(dto.getStatus() != null ? dto.getStatus() : consulta.getStatus());
        }
        consulta.setResumo(normalizar(dto.getResumo()));
        consultaRepository.persist(consulta);
        return ConsultaResponseDTO.fromEntity(consulta);
    }

    @Transactional
    public ConsultaResponseDTO concluir(Long id, String resumo) {
        Consulta consulta = buscarEntidadePorId(id);
        consulta.setStatus(StatusConsulta.REALIZADA);
        consulta.setResumo(normalizar(resumo));
        consultaRepository.persist(consulta);
        return ConsultaResponseDTO.fromEntity(consulta);
    }

    @Transactional
    public void deletar(Long id) {
        Consulta consulta = buscarEntidadePorId(id);
        consultaRepository.delete(consulta);
    }

    private Consulta buscarEntidadePorId(Long id) {
        return consultaRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Consulta não encontrada com o id: " + id));
    }

    private Acolhido buscarAcolhido(Long acolhidoId) {
        return acolhidoRepository.findByIdAndUsuario(acolhidoId, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Acolhido não encontrado com o id: " + acolhidoId));
    }

    private String normalizar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpo = valor.trim();
        return limpo.isEmpty() ? null : limpo;
    }
}
