package com.ctav.api.dto;

import com.ctav.api.entity.Acolhido;
import com.ctav.api.enums.TipoAlta;
import java.time.LocalDate;
import java.time.LocalDateTime;
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
public class AcolhidoResponseDTO {

    private Long id;
    private String nome;
    private String cpf;
    private LocalDate dataNascimento;
    private LocalDate dataAcolhimentoCtav;
    private String email;
    private String telefone;
    private String sexo;
    private String endereco;
    private String quarto;
    private Boolean alta;
    private LocalDate dataAlta;
    private TipoAlta tipoAlta;
    // Rotulo amigavel do tipo de alta (ex.: "Alta por conclusão").
    private String tipoAltaRotulo;
    private String descricaoAlta;
    // Motivos de adesao e desistencia (id + nome para exibicao/relatorios).
    private Long motivoAdesaoId;
    private String motivoAdesaoNome;
    private Long motivoDesistenciaId;
    private String motivoDesistenciaNome;
    // Indica se o acolhido esta no arquivo morto/historico e quando foi enviado.
    private Boolean arquivado;
    private LocalDateTime arquivadoEm;
    // URL pre-assinada (temporaria) para exibir a foto; null quando nao ha foto.
    private String fotoUrl;
    private List<PrescricaoResponseDTO> prescricoes;
    private LocalDateTime criadoEm;
    private LocalDateTime atualizadoEm;

    public static AcolhidoResponseDTO fromEntity(Acolhido acolhido) {
        List<PrescricaoResponseDTO> prescricoes = acolhido.getPrescricoes() == null
                ? List.of()
                : acolhido.getPrescricoes().stream()
                        .map(PrescricaoResponseDTO::fromEntity)
                        .toList();

        return AcolhidoResponseDTO.builder()
                .id(acolhido.getId())
                .nome(acolhido.getNome())
                .cpf(acolhido.getCpf())
                .dataNascimento(acolhido.getDataNascimento())
                .dataAcolhimentoCtav(acolhido.getDataAcolhimentoCtav())
                .email(acolhido.getEmail())
                .telefone(acolhido.getTelefone())
                .sexo(acolhido.getSexo())
                .endereco(acolhido.getEndereco())
                .quarto(acolhido.getQuarto())
                .alta(acolhido.getAlta())
                .dataAlta(acolhido.getDataAlta())
                .tipoAlta(acolhido.getTipoAlta())
                .tipoAltaRotulo(acolhido.getTipoAlta() != null
                        ? acolhido.getTipoAlta().getRotulo()
                        : null)
                .descricaoAlta(acolhido.getDescricaoAlta())
                .motivoAdesaoId(acolhido.getMotivoAdesao() != null
                        ? acolhido.getMotivoAdesao().getId()
                        : null)
                .motivoAdesaoNome(acolhido.getMotivoAdesao() != null
                        ? acolhido.getMotivoAdesao().getNome()
                        : null)
                .motivoDesistenciaId(acolhido.getMotivoDesistencia() != null
                        ? acolhido.getMotivoDesistencia().getId()
                        : null)
                .motivoDesistenciaNome(acolhido.getMotivoDesistencia() != null
                        ? acolhido.getMotivoDesistencia().getNome()
                        : null)
                .arquivado(acolhido.getArquivado())
                .arquivadoEm(acolhido.getArquivadoEm())
                .prescricoes(prescricoes)
                .criadoEm(acolhido.getCriadoEm())
                .atualizadoEm(acolhido.getAtualizadoEm())
                .build();
    }
}
