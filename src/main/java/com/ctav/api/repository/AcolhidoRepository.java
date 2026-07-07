package com.ctav.api.repository;

import com.ctav.api.entity.Acolhido;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class AcolhidoRepository implements PanacheRepositoryBase<Acolhido, Long> {

    public List<Acolhido> listarPorUsuario(Long usuarioId) {
        return list("usuario.id", usuarioId);
    }

    // Acolhidos ativos (nao arquivados) — usados na lista principal.
    public List<Acolhido> listarAtivosPorUsuario(Long usuarioId) {
        return list("usuario.id = ?1 and arquivado = false", usuarioId);
    }

    // Acolhidos no arquivo morto/historico, do mais recente ao mais antigo.
    public List<Acolhido> listarArquivadosPorUsuario(Long usuarioId) {
        return list("usuario.id = ?1 and arquivado = true "
                + "order by arquivadoEm desc, nome asc", usuarioId);
    }

    public Optional<Acolhido> findByIdAndUsuario(Long id, Long usuarioId) {
        return find("id = ?1 and usuario.id = ?2", id, usuarioId).firstResultOptional();
    }

    public Optional<Acolhido> findByCpfAndUsuario(String cpf, Long usuarioId) {
        return find("cpf = ?1 and usuario.id = ?2", cpf, usuarioId).firstResultOptional();
    }

    public Optional<Acolhido> findByEmailAndUsuario(String email, Long usuarioId) {
        return find("email = ?1 and usuario.id = ?2", email, usuarioId).firstResultOptional();
    }
}
