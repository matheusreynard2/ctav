package com.ctav.api.repository;

import com.ctav.api.entity.Consulta;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class ConsultaRepository implements PanacheRepositoryBase<Consulta, Long> {

    public List<Consulta> listarPorUsuarioMaisRecentes(Long usuarioId) {
        return list("usuario.id = ?1 order by dataHora desc", usuarioId);
    }

    public Optional<Consulta> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    public long deleteByAcolhidoIdAndUsuario(Long acolhidoId, Long usuarioId) {
        return delete("acolhido.id = ?1 and usuario.id = ?2", acolhidoId, usuarioId);
    }
}
