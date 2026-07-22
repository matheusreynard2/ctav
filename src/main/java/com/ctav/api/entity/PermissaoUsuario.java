package com.ctav.api.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Tipo de permissão de acesso ao sistema. O id é fixo e definido pela
 * aplicação (1 = administrador, 2 = psicólogo, 3 = advogado), por isso não é
 * gerado automaticamente.
 */
@Entity
@Table(name = "permissoes_usuarios")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PermissaoUsuario {

    @Id
    private Integer id;

    @Column(nullable = false, length = 40)
    private String nome;
}
