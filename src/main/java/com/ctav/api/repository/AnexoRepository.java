package com.ctav.api.repository;

import com.ctav.api.entity.Anexo;
import io.quarkus.hibernate.orm.panache.PanacheRepository;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;

@ApplicationScoped
public class AnexoRepository implements PanacheRepository<Anexo> {

    public long contarPorAcolhido(Long acolhidoId) {
        return count("acolhido.id", acolhidoId);
    }

    public List<Anexo> listarPorAcolhido(Long acolhidoId) {
        return list("acolhido.id", acolhidoId);
    }
}