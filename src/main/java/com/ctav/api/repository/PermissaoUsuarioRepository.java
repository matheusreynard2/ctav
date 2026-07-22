package com.ctav.api.repository;

import com.ctav.api.entity.PermissaoUsuario;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;

@ApplicationScoped
public class PermissaoUsuarioRepository
        implements PanacheRepositoryBase<PermissaoUsuario, Integer> {
}
