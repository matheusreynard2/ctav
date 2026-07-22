package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
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

/**
 * Foto (PNG/JPG) anexada a um pertence do acolhido. O binario fica no bucket S3
 * dedicado a fotos de pertences; aqui guardamos apenas os metadados e a chave.
 */
@Entity
@Table(name = "fotos_pertences")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FotoPertence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String nomeArquivo;

    @Column(nullable = false)
    private String contentType;

    @Column(nullable = false)
    private long tamanhoBytes;

    @Column(nullable = false)
    private String chaveS3;

    @Column(nullable = false)
    private LocalDateTime enviadoEm;

    @ManyToOne(optional = false)
    @JoinColumn(name = "pertence_id")
    private Pertence pertence;

    @PrePersist
    void onCreate() {
        this.enviadoEm = LocalDateTime.now();
    }
}
