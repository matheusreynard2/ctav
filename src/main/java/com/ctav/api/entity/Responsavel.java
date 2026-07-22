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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

// Responsavel legal de um ou mais acolhidos. Gerenciado por CRUD (multi-tenant)
// e associado ao acolhido (todo acolhido sempre tem um responsavel).
@Entity
@Table(name = "responsaveis",
        // Unicidade de CPF por usuario (multi-tenant), quando informado.
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_responsaveis_usuario_cpf", columnNames = {"usuario_id", "cpf"})
        },
        indexes = {
                @Index(name = "idx_responsaveis_usuario_nome", columnList = "usuario_id, nome")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Responsavel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 20)
    private String rg;

    @Column(length = 14)
    private String cpf;

    @Column(length = 200)
    private String endereco;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;

    @Column(length = 9)
    private String cep;

    @Column(length = 20)
    private String celular;

    // Indica se o responsavel e conveniado (true) ou nao (false).
    @Column(name = "conveniado", nullable = false)
    @Builder.Default
    private Boolean conveniado = false;

    // Assinatura do responsavel (imagem PNG em data URL base64). Cadastrada e
    // editada na tela do responsavel e reutilizada no termo dos acolhidos
    // vinculados. Null quando ainda nao ha assinatura.
    @Column(name = "assinatura", columnDefinition = "text")
    private String assinatura;

    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    void onCreate() {
        LocalDateTime agora = LocalDateTime.now();
        this.criadoEm = agora;
        this.atualizadoEm = agora;
    }

    @PreUpdate
    void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}
