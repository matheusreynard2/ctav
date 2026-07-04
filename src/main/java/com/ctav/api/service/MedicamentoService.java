package com.ctav.api.service;

import com.ctav.api.dto.MedicamentoRequestDTO;
import com.ctav.api.dto.MedicamentoResponseDTO;
import com.ctav.api.entity.Medicamento;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.MedicamentoRepository;
import com.ctav.api.security.UsuarioContext;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class MedicamentoService {

    @Inject
    MedicamentoRepository medicamentoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public MedicamentoResponseDTO criar(MedicamentoRequestDTO dto) {
        validarUnicidade(dto.getNome(), null);

        Medicamento medicamento = Medicamento.builder()
                .usuario(usuarioContext.referencia())
                .nome(dto.getNome())
                .descricao(dto.getDescricao())
                .quantidade_caixas(dto.getQuantidade_caixas())
                .quantidade_por_caixa(dto.getQuantidade_por_caixa())
                .build();

        medicamentoRepository.persist(medicamento);
        return MedicamentoResponseDTO.fromEntity(medicamento);
    }

    public List<MedicamentoResponseDTO> listar() {
        return medicamentoRepository.listarPorUsuario(usuarioContext.id())
                .stream()
                .map(MedicamentoResponseDTO::fromEntity)
                .toList();
    }

    public MedicamentoResponseDTO buscarPorId(Long id) {
        return MedicamentoResponseDTO.fromEntity(buscarEntidadePorId(id));
    }

    @Transactional
    public MedicamentoResponseDTO atualizar(Long id, MedicamentoRequestDTO dto) {
        Medicamento medicamento = buscarEntidadePorId(id);
        validarUnicidade(dto.getNome(), id);
        medicamento.setNome(dto.getNome());
        medicamento.setDescricao(dto.getDescricao());
        medicamento.setQuantidade_caixas(dto.getQuantidade_caixas());
        medicamento.setQuantidade_por_caixa(dto.getQuantidade_por_caixa());
        medicamentoRepository.persist(medicamento);
        return MedicamentoResponseDTO.fromEntity(medicamento);
    }

    @Transactional
    public void deletar(Long id) {
        Medicamento medicamento = buscarEntidadePorId(id);
        if (medicamentoRepository.existsPrescricaoDoMedicamento(id)) {
            throw new BusinessException(
                    "Não é possível excluir o medicamento \"" + medicamento.getNome()
                            + "\" porque ele está prescrito para um ou mais acolhidos. "
                            + "Remova o medicamento das prescrições dos acolhidos antes de excluí-lo.");
        }
        medicamentoRepository.delete(medicamento);
    }

    private Medicamento buscarEntidadePorId(Long id) {
        return medicamentoRepository.findByIdAndUsuario(id, usuarioContext.id())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Medicamento não encontrado com o id: " + id));
    }

    private void validarUnicidade(String nomeMedicamento, Long idAtual) {
        medicamentoRepository.findByNomeAndUsuario(nomeMedicamento, usuarioContext.id()).ifPresent(p -> {
            if (idAtual == null || !p.getId().equals(idAtual)) {
                throw new BusinessException("Já existe um medicamento cadastrado com este nome.");
            }
        });
    }
}
