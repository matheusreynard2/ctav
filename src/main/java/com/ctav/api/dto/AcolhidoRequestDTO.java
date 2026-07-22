package com.ctav.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import com.ctav.api.enums.TipoAlta;
import java.time.LocalDate;
import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AcolhidoRequestDTO {

    @NotBlank(message = "O nome é obrigatório")
    @Size(min = 2, max = 120, message = "O nome deve ter entre 2 e 120 caracteres")
    private String nome;

    @NotBlank(message = "O CPF é obrigatório")
    @Pattern(
        regexp = "\\d{3}\\.?\\d{3}\\.?\\d{3}-?\\d{2}",
        message = "CPF inválido. Use o formato 000.000.000-00 ou apenas números"
    )
    private String cpf;

    @NotNull(message = "A data de nascimento é obrigatória")
    @Past(message = "A data de nascimento deve estar no passado")
    private LocalDate dataNascimento;

    @NotNull(message = "A data de acolhimento na CTAV é obrigatória")
    private LocalDate dataAcolhimentoCtav;

    @Email(message = "Email inválido")
    @Size(max = 120)
    private String email;

    @Size(max = 20)
    private String telefone;

    private String sexo;

    @Size(max = 200)
    private String endereco;

    @Size(max = 20, message = "O quarto deve ter no máximo 20 caracteres")
    private String quarto;

    private Boolean alta;

    private LocalDate dataAlta;

    private TipoAlta tipoAlta;

    // Motivo de adesao (obrigatorio) e de desistencia (obrigatorio quando a alta
    // for por desistencia). Referenciam o id de um Motivo cadastrado pelo usuario.
    private Long motivoAdesaoId;

    private Long motivoDesistenciaId;

    // Responsavel legal do acolhido (obrigatorio: todo acolhido tem um
    // responsavel). Referencia o id de um Responsavel cadastrado pelo usuario.
    private Long responsavelId;

    // Quando true no cadastro, o acolhido ja e criado direto no arquivo
    // morto/historico (ex.: pessoas que passaram pela comunidade antes do sistema).
    // Na atualizacao, quando null, mantem o estado atual de arquivamento.
    private Boolean arquivado;

    // Assinaturas do termo de concordancia (imagem PNG em data URL base64).
    // No cadastro sao gravadas quando o termo e assinado; na atualizacao normal
    // do formulario vem null e o valor atual e preservado. A do acolhido fica na
    // propria entidade Acolhido; a do responsavel e roteada para a entidade
    // Responsavel vinculada (fonte unica).
    private String assinaturaAcolhido;

    private String assinaturaResponsavel;

    // Opcoes escolhidas nos termos assinados (Acordo e Termo de Celular).
    // Gravadas no cadastro; na atualizacao normal vem null e o valor atual e
    // preservado.
    private Boolean autorizaUsoImagem;

    private Boolean entregaCelular;

    private Boolean concordaPertences;

    @Valid
    private List<PrescricaoRequestDTO> prescricoes;
}
