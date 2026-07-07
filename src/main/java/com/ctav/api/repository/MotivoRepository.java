package com.ctav.api.repository;

import com.ctav.api.entity.Motivo;
import com.ctav.api.enums.CategoriaMotivo;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class MotivoRepository implements PanacheRepositoryBase<Motivo, Long> {

    public List<Motivo> listarPorUsuarioECategoria(Long usuarioId, CategoriaMotivo categoria) {
        return list("usuario.id = ?1 and categoria = ?2 order by nome asc", usuarioId, categoria);
    }

    public long contarPorUsuarioECategoria(Long usuarioId, CategoriaMotivo categoria) {
        return count("usuario.id = ?1 and categoria = ?2", usuarioId, categoria);
    }

    public Optional<Motivo> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    public Optional<Motivo> findByNome(Long usuarioId, CategoriaMotivo categoria, String nome) {
        return find("usuario.id = ?1 and categoria = ?2 and lower(nome) = lower(?3)",
                usuarioId, categoria, nome).firstResultOptional();
    }

    // Verifica se algum acolhido referencia este motivo (adesao ou desistencia),
    // impedindo a exclusao de um motivo em uso.
    public boolean existsAcolhidoComMotivo(Long motivoId) {
        Number total = (Number) getEntityManager()
                .createNativeQuery(
                        "SELECT COUNT(*) FROM acolhidos "
                                + "WHERE motivo_adesao_id = :id OR motivo_desistencia_id = :id")
                .setParameter("id", motivoId)
                .getSingleResult();
        return total.longValue() > 0;
    }
}
