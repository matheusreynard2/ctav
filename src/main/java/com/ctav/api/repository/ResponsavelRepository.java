package com.ctav.api.repository;

import com.ctav.api.entity.Responsavel;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ResponsavelRepository implements PanacheRepositoryBase<Responsavel, Long> {

    public List<Responsavel> listarPorUsuario(Long usuarioId) {
        return list("usuario.id = ?1 order by nome asc", usuarioId);
    }

    public Optional<Responsavel> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    public Optional<Responsavel> findByCpfAndUsuario(String cpf, Long usuarioId) {
        return find("cpf = ?1 and usuario.id = ?2", cpf, usuarioId).firstResultOptional();
    }

    // Quantos acolhidos referenciam este responsavel (para exibicao e para
    // impedir a exclusao de um responsavel em uso).
    public long contarAcolhidos(Long responsavelId) {
        Number total = (Number) getEntityManager()
                .createNativeQuery(
                        "SELECT COUNT(*) FROM acolhidos WHERE responsavel_id = :id")
                .setParameter("id", responsavelId)
                .getSingleResult();
        return total.longValue();
    }
}
