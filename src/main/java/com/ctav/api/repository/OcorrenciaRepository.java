package com.ctav.api.repository;

import com.ctav.api.entity.Ocorrencia;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class OcorrenciaRepository implements PanacheRepositoryBase<Ocorrencia, Long> {

    public List<Ocorrencia> listarPorUsuarioMaisRecentes(Long usuarioId) {
        return list("usuario.id = ?1 order by criadoEm desc", usuarioId);
    }

    public Optional<Ocorrencia> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    // Remove os vinculos de um acolhido com quaisquer ocorrencias (apaga as
    // linhas da tabela de juncao), mantendo as ocorrencias. Deve ser chamado
    // antes de excluir o acolhido para nao violar a chave estrangeira.
    // Retorna quantos vinculos foram removidos.
    public int desvincularAcolhido(Long acolhidoId) {
        return getEntityManager()
                .createNativeQuery(
                        "DELETE FROM ocorrencia_acolhidos WHERE acolhido_id = ?1")
                .setParameter(1, acolhidoId)
                .executeUpdate();
    }
}
