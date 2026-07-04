package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "usuarios", indexes = {
        @Index(name = "idx_usuarios_username", columnList = "username")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 60)
    private String username;

    // Hash BCrypt da senha (formato $2a$...). Nunca armazenar a senha em texto puro.
    @Column(name = "senha_hash", nullable = false, length = 100)
    private String senhaHash;

    @Column(length = 120)
    private String nome;

    // Nullable para permitir insercao manual via SQL sem informar a data.
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    @PrePersist
    void onCreate() {
        if (this.criadoEm == null) {
            this.criadoEm = LocalDateTime.now();
        }
    }
}
