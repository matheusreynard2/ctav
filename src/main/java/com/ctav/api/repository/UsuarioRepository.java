package com.ctav.api.repository;

import com.ctav.api.entity.Usuario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class UsuarioRepository implements PanacheRepositoryBase<Usuario, Long> {

    public Optional<Usuario> findByUsername(String username) {
        return find("username", username).firstResultOptional();
    }

    /** Usuários pertencentes à mesma conta de dados (tenant). */
    public List<Usuario> listByConta(Long contaId) {
        return find(
                "contaId = ?1 or (contaId is null and id = ?1)",
                Sort.by("username"),
                contaId).list();
    }
}
