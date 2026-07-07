package com.ctav.api.enums;

// Diferencia os motivos de adesao (por que o acolhido entrou) dos motivos de
// desistencia (por que o acolhido interrompeu o tratamento).
public enum CategoriaMotivo {

    ADESAO("Motivo de adesão"),
    DESISTENCIA("Motivo de desistência");

    private final String rotulo;

    CategoriaMotivo(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() {
        return rotulo;
    }
}
