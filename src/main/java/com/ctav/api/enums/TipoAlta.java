package com.ctav.api.enums;

public enum TipoAlta {

    CONCLUSAO(
            "Alta por conclusão",
            "Consideramos alta conclusiva quando o acolhido passa por todas as etapas do programa terapêutico e é encaminhado para a sociedade."),
    ADMINISTRATIVA(
            "Alta administrativa",
            "Consideramos alta administrativa quando o acolhido infringe uma das normas do regimento interno, bem como agressões físicas e furto, e por esse motivo é impedido de permanecer na comunidade."),
    DESISTENCIA(
            "Alta por desistência",
            "Consideramos desistência quando o acolhido, por vontade própria, decide interromper o tratamento em qualquer momento."),
    RECAIDA(
            "Alta por recaída",
            "Consideramos recaída quando o desligamento ocorre em razão do uso de substâncias psicoativas durante o período de acolhimento.");

    private final String rotulo;
    private final String descricao;

    TipoAlta(String rotulo, String descricao) {
        this.rotulo = rotulo;
        this.descricao = descricao;
    }

    public String getRotulo() {
        return rotulo;
    }

    public String getDescricao() {
        return descricao;
    }
}
