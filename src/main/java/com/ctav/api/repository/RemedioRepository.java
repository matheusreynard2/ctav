package com.ctav.api.repository;

import com.ctav.api.entity.Remedio;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RemedioRepository extends JpaRepository<Remedio, Long> {

    Optional<Remedio> findByNome(String nome);

    boolean existsByNome(String nome);

}
