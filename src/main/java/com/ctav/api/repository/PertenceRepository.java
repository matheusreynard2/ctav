package com.ctav.api.repository;

import com.ctav.api.entity.Pertence;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class PertenceRepository implements PanacheRepository<Pertence> {

    public List<Pertence> listarPorAcolhido(Long acolhidoId) {
        return list("acolhido.id = ?1", Sort.by("criadoEm"), acolhidoId);
    }

    public List<Pertence> listarPorUsuario(Long usuarioId) {
        return list("acolhido.usuario.id = ?1", Sort.by("acolhido.nome").and("criadoEm"), usuarioId);
    }

    public long contarPorAcolhido(Long acolhidoId) {
        return count("acolhido.id", acolhidoId);
    }
}
