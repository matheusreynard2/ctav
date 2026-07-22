package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "medicamentos", indexes = {
        @Index(name = "idx_medicamentos_usuario_nome", columnList = "usuario_id, nome"),
        @Index(name = "idx_medicamentos_usuario_descricao", columnList = "usuario_id, descricao")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Medicamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 255)
    private String descricao;

    // Quantidade de caixas CHEIAS em estoque. Derivada de total_comprimidos /
    // quantidade_por_caixa; mantida para exibicao e compatibilidade.
    @Column(nullable = false)
    private Integer quantidade_caixas;

    // Comprimidos por caixa (tamanho da embalagem).
    @Column(nullable = false)
    private Integer quantidade_por_caixa;

    // Total real de comprimidos em estoque. Fonte de verdade do estoque:
    // usado nos alertas e ajustado a cada administracao registrada.
    @Column(name = "total_comprimidos")
    private Integer total_comprimidos;

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
