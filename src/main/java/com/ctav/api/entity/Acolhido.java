package com.ctav.api.entity;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import com.ctav.api.enums.TipoAlta;
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
@Table(name = "acolhidos",
        // Unicidade de CPF/e-mail agora e por usuario (multi-tenant).
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_acolhidos_usuario_cpf", columnNames = {"usuario_id", "cpf"}),
                @UniqueConstraint(name = "uk_acolhidos_usuario_email", columnNames = {"usuario_id", "email"})
        },
        indexes = {
                @Index(name = "idx_acolhidos_usuario_nome", columnList = "usuario_id, nome")
        })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Acolhido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 14)
    private String cpf;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    @Column(name = "data_acolhimento_ctav", nullable = false)
    private LocalDate dataAcolhimentoCtav;

    @Column(length = 120)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String sexo;

    @Column(length = 200)
    private String endereco;

    @Column(name = "quarto", length = 20)
    private String quarto;

    @Column(name = "alta", nullable = false)
    @Builder.Default
    private Boolean alta = false;

    @Column(name = "data_alta")
    private LocalDate dataAlta;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_alta", length = 30)
    private TipoAlta tipoAlta;

    @Column(name = "descricao_alta", length = 500)
    private String descricaoAlta;

    // Motivo de adesao: por que o acolhido entrou na comunidade (obrigatorio no
    // cadastro). Motivo de desistencia: por que interrompeu o tratamento
    // (obrigatorio quando a alta e por desistencia).
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "motivo_adesao_id")
    private Motivo motivoAdesao;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "motivo_desistencia_id")
    private Motivo motivoDesistencia;

    // Indica que o acolhido foi enviado ao arquivo morto/historico.
    // Quando true, o acolhido some da lista principal mas mantem todos os
    // dados relacionados (prescricoes, administracoes, anexos, combinados).
    @Column(name = "arquivado", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean arquivado = false;

    @Column(name = "arquivado_em")
    private LocalDateTime arquivadoEm;

    // Chave do objeto no bucket S3 com a foto do acolhido (null = sem foto).
    @Column(name = "foto_chave_s3")
    private String fotoChaveS3;

    @OneToMany(mappedBy = "acolhido", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @Builder.Default
    private List<Prescricao> prescricoes = new ArrayList<>();

    @OneToMany(mappedBy = "acolhido", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Anexo> anexos = new ArrayList<>();

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
