package com.ctav.api.repository;

import com.ctav.api.entity.Medicamento;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class MedicamentoRepository implements PanacheRepositoryBase<Medicamento, Long> {

    public List<Medicamento> listarPorUsuario(Long usuarioId) {
        return list("usuario.id", usuarioId);
    }

    public Optional<Medicamento> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    public Optional<Medicamento> findByNomeAndUsuario(String nome, Long usuarioId) {
        return find("nome = ?1 and usuario.id = ?2", nome, usuarioId).firstResultOptional();
    }

    public List<Medicamento> listByIdsAndUsuario(List<Long> ids, Long usuarioId) {
        return list("id in ?1 and usuario.id = ?2", ids, usuarioId);
    }

    public boolean existsPrescricaoDoMedicamento(Long medicamentoId) {
        Long total = getEntityManager()
                .createQuery(
                        "SELECT COUNT(p) FROM Prescricao p WHERE p.medicamento.id = :id",
                        Long.class)
                .setParameter("id", medicamentoId)
                .getSingleResult();
        return total > 0;
    }
}
