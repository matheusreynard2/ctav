package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "ocorrencias", indexes = {
        @Index(name = "idx_ocorrencias_usuario", columnList = "usuario_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Ocorrencia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    // Relacao opcional N:N: uma ocorrencia pode envolver um ou mais acolhidos.
    // Ao excluir um acolhido, os vinculos dele sao removidos (join table) e a
    // ocorrencia permanece na lista para consulta/edicao; os nomes ficam
    // preservados no snapshot acolhidosNomes.
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "ocorrencia_acolhidos",
            joinColumns = @JoinColumn(name = "ocorrencia_id"),
            inverseJoinColumns = @JoinColumn(name = "acolhido_id"),
            indexes = {
                    @Index(name = "idx_ocorrencia_acolhidos_ocorrencia", columnList = "ocorrencia_id"),
                    @Index(name = "idx_ocorrencia_acolhidos_acolhido", columnList = "acolhido_id")
            })
    @Builder.Default
    private List<Acolhido> acolhidos = new ArrayList<>();

    // Nomes dos acolhidos no momento do registro (separados por vírgula).
    // Mantidos mesmo apos a exclusao de um acolhido, para que a ocorrencia
    // continue identificavel na lista.
    @Column(name = "acolhidos_nomes", length = 500)
    private String acolhidosNomes;

    // "Qual foi a ocorrencia" — resumo/titulo da ocorrencia.
    @Column(nullable = false, length = 200)
    private String titulo;

    @Column(nullable = false, length = 1000)
    private String descricao;

    @Column(name = "data_ocorrencia")
    private LocalDate dataOcorrencia;

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
