package com.ctav.api.repository;

import com.ctav.api.entity.Acolhido;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AcolhidoRepository extends JpaRepository<Acolhido, Long> {

    Optional<Acolhido> findByCpf(String cpf);

    Optional<Acolhido> findByEmail(String email);
}
