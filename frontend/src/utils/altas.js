// Tipos de alta compartilhados entre o formulario de acolhido e os relatorios.
// Os valores (valor) espelham o enum TipoAlta do backend.
export const TIPOS_ALTA = [
  {
    valor: 'CONCLUSAO',
    rotulo: 'Alta por conclusão',
    descricao:
      'Consideramos alta conclusiva quando o acolhido passa por todas as etapas do programa terapêutico e é encaminhado para a sociedade.',
  },
  {
    valor: 'ADMINISTRATIVA',
    rotulo: 'Alta administrativa',
    descricao:
      'Consideramos alta administrativa quando o acolhido infringe uma das normas do regimento interno, bem como agressões físicas e furto, e por esse motivo é impedido de permanecer na comunidade.',
  },
  {
    valor: 'ABANDONO',
    rotulo: 'Alta por abandono',
    descricao:
      'Consideramos abandono quando o acolhido, por vontade própria, decide interromper o tratamento em qualquer momento.',
  },
  {
    valor: 'RECAIDA',
    rotulo: 'Alta por recaída',
    descricao:
      'Consideramos recaída quando o desligamento ocorre em razão do uso de substâncias psicoativas durante o período de acolhimento.',
  },
];

export const rotuloTipoAlta = (valor) =>
  TIPOS_ALTA.find((t) => t.valor === valor)?.rotulo ?? valor ?? '-';
