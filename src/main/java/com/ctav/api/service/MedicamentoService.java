package com.ctav.api.service;

import com.ctav.api.dto.MedicamentoRequestDTO;
import com.ctav.api.dto.MedicamentoResponseDTO;
import com.ctav.api.entity.Medicamento;
import com.ctav.api.exception.BusinessException;
import com.ctav.api.exception.ResourceNotFoundException;
import com.ctav.api.repository.AdministracaoRepository;
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
    AdministracaoRepository administracaoRepository;

    @Inject
    UsuarioContext usuarioContext;

    @Transactional
    public MedicamentoResponseDTO criar(MedicamentoRequestDTO dto) {
        validarUnicidade(dto.getNome(), null);

        Medicamento medicamento = Medicamento.builder()
                .usuario(usuarioContext.referencia())
                .nome(dto.getNome())
                .descricao(dto.getDescricao())
                .build();
        aplicarEstoque(medicamento, dto.getQuantidade_por_caixa(), dto.getTotal_comprimidos());

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
        aplicarEstoque(medicamento, dto.getQuantidade_por_caixa(), dto.getTotal_comprimidos());
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
        // Historico de administracao diaria permanece mesmo apos desvincular o
        // medicamento do acolhido; remove antes de excluir o medicamento.
        administracaoRepository.deleteByMedicamentoId(id, usuarioContext.id());
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

    /**
     * Ajusta o estoque total de comprimidos do medicamento (delta negativo
     * desconta; positivo repõe). Usado ao marcar/desmarcar administração.
     * Recalcula a quantidade de caixas cheias a partir do novo total.
     */
    public void ajustarEstoque(Medicamento medicamento, int deltaComprimidos) {
        if (deltaComprimidos == 0) {
            return;
        }

        int totalAtual = totalComprimidos(medicamento);
        int novoTotal = totalAtual + deltaComprimidos;
        if (novoTotal < 0) {
            throw new BusinessException(
                    "Estoque insuficiente para registrar esta administração. "
                            + "Disponível: " + totalAtual + " comprimido(s).");
        }

        aplicarEstoque(medicamento, medicamento.getQuantidade_por_caixa(), novoTotal);
        medicamentoRepository.persist(medicamento);
    }

    /**
     * Reserva comprimidos do estoque LIVRE do medicamento para alocar a um
     * acolhido. Falha quando o estoque livre e insuficiente.
     */
    public void reservarEstoque(Medicamento medicamento, int comprimidos) {
        if (comprimidos <= 0) {
            return;
        }
        int livre = totalComprimidos(medicamento);
        if (comprimidos > livre) {
            throw new BusinessException(
                    "Estoque livre insuficiente do medicamento \"" + medicamento.getNome()
                            + "\" para reservar ao acolhido. Livre: " + livre
                            + " comprimido(s); solicitado: " + comprimidos + ".");
        }
        aplicarEstoque(medicamento, medicamento.getQuantidade_por_caixa(), livre - comprimidos);
        medicamentoRepository.persist(medicamento);
    }

    /**
     * Devolve comprimidos ao estoque LIVRE do medicamento (ao reduzir a reserva
     * de um acolhido ou remover o vinculo).
     */
    public void liberarEstoque(Medicamento medicamento, int comprimidos) {
        if (comprimidos <= 0) {
            return;
        }
        int livre = totalComprimidos(medicamento);
        aplicarEstoque(medicamento, medicamento.getQuantidade_por_caixa(), livre + comprimidos);
        medicamentoRepository.persist(medicamento);
    }

    /**
     * Define o estoque de forma consistente: guarda o total real de comprimidos
     * e deriva a quantidade de caixas cheias (total / comprimidos por caixa).
     */
    private void aplicarEstoque(Medicamento medicamento, Integer porCaixa, Integer total) {
        int pc = (porCaixa == null || porCaixa <= 0) ? 1 : porCaixa;
        int t = (total == null || total < 0) ? 0 : total;
        medicamento.setQuantidade_por_caixa(pc);
        medicamento.setTotal_comprimidos(t);
        medicamento.setQuantidade_caixas(t / pc);
    }

    /**
     * Total de comprimidos em estoque. Usa total_comprimidos quando disponível;
     * caso contrário (registros antigos, ainda sem o campo), deriva de
     * caixas × comprimidos por caixa.
     */
    private int totalComprimidos(Medicamento medicamento) {
        if (medicamento.getTotal_comprimidos() != null) {
            return medicamento.getTotal_comprimidos();
        }
        int pc = medicamento.getQuantidade_por_caixa() == null
                ? 1
                : Math.max(medicamento.getQuantidade_por_caixa(), 1);
        int cx = medicamento.getQuantidade_caixas() == null
                ? 0
                : medicamento.getQuantidade_caixas();
        return cx * pc;
    }
}
