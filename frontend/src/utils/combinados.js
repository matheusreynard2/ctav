export const TIPO_RESSOCIALIZACAO = 'RESSOCIALIZACAO';

export const TIPOS_COMBINADO = [
  { valor: 'MEDICO', rotulo: 'Médico' },
  { valor: 'DENTISTA', rotulo: 'Dentista' },
  { valor: 'GOVERNO', rotulo: 'Governo' },
  { valor: 'BANCO', rotulo: 'Banco' },
  { valor: 'DETRAN', rotulo: 'Detran' },
  { valor: TIPO_RESSOCIALIZACAO, rotulo: 'Ressocialização com a família' },
  { valor: 'OUTRO', rotulo: 'Outro tipo de saída' },
];

export const rotuloTipoCombinado = (tipo) =>
  TIPOS_COMBINADO.find((t) => t.valor === tipo)?.rotulo ?? tipo ?? '-';
