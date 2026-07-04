package com.ctav.api.repository;

import com.ctav.api.entity.AdministracaoMedicamento;
import com.ctav.api.enums.PeriodoDia;
import io.quarkus.hibernate.orm.panache.PanacheRepositoryBase;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class AdministracaoRepository
        implements PanacheRepositoryBase<AdministracaoMedicamento, Long> {

    public List<AdministracaoMedicamento> listarPorAcolhidoEData(
            Long acolhidoId, Long usuarioId, LocalDate data) {
        return list("acolhido.id = ?1 and usuario.id = ?2 and data = ?3",
                acolhidoId, usuarioId, data);
    }

    public List<AdministracaoMedicamento> listarPorAcolhidoEMes(
            Long acolhidoId, Long usuarioId, LocalDate inicio, LocalDate fim) {
        return list("acolhido.id = ?1 and usuario.id = ?2 and data >= ?3 and data <= ?4",
                acolhidoId, usuarioId, inicio, fim);
    }

    public Optional<AdministracaoMedicamento> buscar(
            Long acolhidoId, Long usuarioId, Long medicamentoId,
            LocalDate data, PeriodoDia periodo) {
        return find("acolhido.id = ?1 and usuario.id = ?2 and medicamento.id = ?3 "
                        + "and data = ?4 and periodo = ?5",
                acolhidoId, usuarioId, medicamentoId, data, periodo)
                .firstResultOptional();
    }

    public long deleteByAcolhidoId(Long acolhidoId) {
        return delete("acolhido.id", acolhidoId);
    }
}
