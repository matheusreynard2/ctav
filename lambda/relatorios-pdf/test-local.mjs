import { writeFileSync } from 'node:fs';
import { handler } from './index.mjs';

// Dados de exemplo cobrindo os quatro tipos de relatorio.
const relatorio = {
  ano: 2025,
  registrados: [2, 1, 0, 3, 0, 0, 1, 0, 0, 0, 0, 0],
  registradosTotal: 7,
  linhasAlta: [
    { rotulo: 'Conclusão', vetor: [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0], total: 2 },
    { rotulo: 'Desistência', vetor: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], total: 1 },
  ],
  totalAltas: [1, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0],
  totalAltasAno: 3,
  motivosAdesao: [
    { rotulo: 'Vontade própria', valor: 4 },
    { rotulo: 'Família / parentes', valor: 2 },
    { rotulo: 'Ordem judicial', valor: 1 },
  ],
  motivosDesistencia: [
    { rotulo: 'Problemas familiares', valor: 1 },
  ],
};

const acolhidosComAlta = [
  {
    id: 1,
    nome: 'Fulano de Tal',
    cpf: '000.000.000-00',
    entrada: '2025-01-10',
    saida: '2025-04-20',
    permanencia: { dias: 100, meses: 3, diasRestantes: 10 },
    tipoAltaRotulo: 'Conclusão',
    motivoDesistencia: '-',
  },
  {
    id: 2,
    nome: 'Beltrano Silva',
    cpf: '111.111.111-11',
    entrada: '2025-01-05',
    saida: '2025-02-15',
    permanencia: { dias: 41, meses: 1, diasRestantes: 10 },
    tipoAltaRotulo: 'Alta por desistência',
    motivoDesistencia: 'Problemas familiares',
  },
];

const controle = {
  ano: 2025,
  mes: 4,
  acolhidoNome: 'Fulano de Tal',
  dias: ['2025-04-01', '2025-04-02'],
  prescricoesComDose: [
    { medicamentoId: 10, medicamentoNome: 'Medicamento A', doseManha: 1, doseTarde: 0, doseNoite: 1 },
  ],
  registros: {
    '2025-04-01-10-MANHA': true,
    '2025-04-01-10-NOITE': false,
    '2025-04-02-10-MANHA': true,
    '2025-04-02-10-NOITE': true,
  },
};

const casos = [
  { tipo: 'quadro-mensal', dados: relatorio },
  { tipo: 'altas', dados: { acolhidosComAlta, ano: 2025 } },
  { tipo: 'controle', dados: controle },
  { tipo: 'todos', dados: { relatorio, acolhidosComAlta, controle } },
  { tipo: 'tutorial' },
];

for (const caso of casos) {
  const { pdfBase64 } = await handler(caso);
  const buf = Buffer.from(pdfBase64, 'base64');
  const arquivo = `saida-${caso.tipo}.pdf`;
  writeFileSync(arquivo, buf);
  console.log(`OK ${caso.tipo}: ${buf.length} bytes -> ${arquivo}`);
}
