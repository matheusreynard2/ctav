package com.ctav.api.entity;

import com.ctav.api.enums.StatusConsulta;

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
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "consultas", indexes = {
        @Index(name = "idx_consultas_usuario_acolhido", columnList = "usuario_id, acolhido_id"),
        @Index(name = "idx_consultas_usuario_data", columnList = "usuario_id, data_hora")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Consulta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "acolhido_id", nullable = false)
    private Acolhido acolhido;

    @Column(name = "data_hora", nullable = false)
    private LocalDateTime dataHora;

    @Column(nullable = false, length = 1000)
    private String descricao;

    // Profissional responsável pela consulta (ex.: nome do psicólogo/médico).
    @Column(length = 150)
    private String profissional;

    // Local onde a consulta ocorrerá. ("local" é palavra reservada em alguns
    // bancos, por isso a coluna usa um nome explícito.)
    @Column(name = "local_consulta", length = 150)
    private String local;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusConsulta status;

    // Resumo do que ocorreu na consulta. Preenchido ao concluí-la (status
    // REALIZADA); é o único campo editável em consultas realizadas.
    @Column(name = "resumo", columnDefinition = "text")
    private String resumo;

    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;

    @PrePersist
    void onCreate() {
        LocalDateTime agora = LocalDateTime.now();
        this.criadoEm = agora;
        this.atualizadoEm = agora;
        if (this.status == null) {
            this.status = StatusConsulta.AGENDADA;
        }
    }

    @PreUpdate
    void onUpdate() {
        this.atualizadoEm = LocalDateTime.now();
    }
}
