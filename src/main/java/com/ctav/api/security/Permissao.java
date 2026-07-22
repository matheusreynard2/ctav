package com.ctav.api.security;

/**
 * Tipos de permissão do sistema (espelham a tabela permissoes_usuarios).
 * 1 = administrador (acesso total); 2 = psicólogo, 3 = advogado e
 * 4 = financeiro (acesso somente às páginas de início e de relatórios).
 */
public final class Permissao {

    public static final int ADMINISTRADOR = 1;
    public static final int PSICOLOGO = 2;
    public static final int ADVOGADO = 3;
    public static final int FINANCEIRO = 4;

    private Permissao() {
    }

    public static boolean isAdministrador(Integer permissaoId) {
        // Tokens antigos (anteriores ao sistema de permissões) não possuem o
        // identificador; nesse caso tratamos como administrador para não travar
        // a sessão vigente — o próximo login já traz a permissão correta.
        return permissaoId == null || permissaoId == ADMINISTRADOR;
    }

    public static String nome(Integer permissaoId) {
        if (permissaoId == null) {
            return null;
        }
        switch (permissaoId) {
            case ADMINISTRADOR:
                return "administrador";
            case PSICOLOGO:
                return "psicologo";
            case ADVOGADO:
                return "advogado";
            case FINANCEIRO:
                return "financeiro";
            default:
                return null;
        }
    }
}
