package com.ctav.api.entity;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Pertence em posse do acolhido (item do "Registro de Pertences em posse do
 * Acolhido"). Cada pertence tem uma quantidade, uma descricao do item e pode ter
 * fotos anexadas (PNG/JPG).
 */
@Entity
@Table(name = "pertences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pertence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Integer quantidade;

    @Column(nullable = false, length = 200)
    private String item;

    @ManyToOne(optional = false)
    @JoinColumn(name = "acolhido_id")
    private Acolhido acolhido;

    @OneToMany(mappedBy = "pertence", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("enviadoEm ASC")
    @Builder.Default
    private List<FotoPertence> fotos = new ArrayList<>();

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
