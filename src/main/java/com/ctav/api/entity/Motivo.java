package com.ctav.api.entity;

import com.ctav.api.enums.CategoriaMotivo;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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

// Fator de adesao ou desistencia, gerenciado por CRUD pelo usuario e usado nos
// cadastros de acolhidos e nos relatorios.
@Entity
@Table(name = "motivos",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_motivos_usuario_categoria_nome",
                        columnNames = {"usuario_id", "categoria", "nome"})
        },
        indexes = {
                @Index(name = "idx_motivos_usuario_categoria", columnList = "usuario_id, categoria")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Motivo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Enumerated(EnumType.STRING)
    @Column(name = "categoria", nullable = false, length = 20)
    private CategoriaMotivo categoria;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 255)
    private String descricao;

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
