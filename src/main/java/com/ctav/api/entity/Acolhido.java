package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
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
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

@Entity
@Table(name = "acolhidos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(AuditingEntityListener.class)
public class Acolhido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 14)
    private String cpf;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate dataNascimento;

    @Column(name = "data_acolhimento_ctav", nullable = false)
    private LocalDate dataAcolhimentoCtav;

    @Column(name = "data_saida_ctav", nullable = true)
    private LocalDate dataSaidaCtav;

    @Column(unique = true, length = 120)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(length = 20)
    private String sexo;

    @Column(length = 200)
    private String endereco;

    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "acolhido_remedio",
            joinColumns = @JoinColumn(name = "acolhido_id"),
            inverseJoinColumns = @JoinColumn(name = "remedio_id")
    )
    @Builder.Default
    private List<Remedio> remedios_prescritos = new ArrayList<>();

    @CreatedDate
    @Column(name = "criado_em", updatable = false)
    private LocalDateTime criadoEm;

    @LastModifiedDate
    @Column(name = "atualizado_em")
    private LocalDateTime atualizadoEm;
}
