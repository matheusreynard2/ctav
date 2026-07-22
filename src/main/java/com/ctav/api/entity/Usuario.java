package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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

    // Permissão de acesso do usuário (1 = administrador, 2 = psicólogo,
    // 3 = advogado). Nullable para não travar a atualização de schema em bases
    // já existentes; nesse caso é tratado como administrador (ver Permissao).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "permissao_id")
    private PermissaoUsuario permissao;

    // Conta de dados a que o usuário pertence (multi-tenant): id do usuário
    // "dono" dos dados. Usuários vinculados à mesma conta enxergam e alteram os
    // mesmos registros. Nulo => o próprio usuário é a conta.
    @Column(name = "conta_id")
    private Long contaId;

    // Nullable para permitir insercao manual via SQL sem informar a data.
    @Column(name = "criado_em")
    private LocalDateTime criadoEm;

    /** Identificador da permissão (ou null quando ainda não definida). */
    public Integer getPermissaoId() {
        return permissao == null ? null : permissao.getId();
    }

    /** Conta de dados efetiva: a conta vinculada ou o próprio id. */
    public Long getContaIdEfetiva() {
        return contaId != null ? contaId : id;
    }

    @PrePersist
    void onCreate() {
        if (this.criadoEm == null) {
            this.criadoEm = LocalDateTime.now();
        }
    }
}
