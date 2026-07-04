import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  PERIODOS_CONTROLE,
  chaveRegistroAdministracao,
  formatarDiaControle,
  rotuloMesAno,
} from './controleMedicamentos';

const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

const formatarData = (iso) => {
  if (!iso || typeof iso !== 'string' || iso.length < 10) return '-';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const textoMeses = (perm) => {
  if (!perm) return '-';
  const { meses, diasRestantes } = perm;
  const parteMes = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  if (diasRestantes <= 0) return parteMes;
  const parteDia = `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
  return `${parteMes} e ${parteDia}`;
};

const rodapeGeracao = (doc) => {
  const y = doc.internal.pageSize.height - 8;
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, y);
  doc.setTextColor(0);
};

const tituloDocumento = (doc, titulo, subtitulo = '') => {
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  doc.text('CTAV — Relatórios', 14, 16);
  doc.setFontSize(11);
  doc.setFont(undefined, 'normal');
  doc.text(titulo, 14, 24);
  if (subtitulo) {
    doc.setFontSize(9);
    doc.setTextColor(80);
    doc.text(subtitulo, 14, 30);
    doc.setTextColor(0);
    return 36;
  }
  return 30;
};

const estiloTabela = {
  styles: { fontSize: 8, cellPadding: 2 },
  headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
  alternateRowStyles: { fillColor: [248, 250, 252] },
  margin: { left: 14, right: 14 },
};

const salvarPdf = (doc, nome) => doc.save(nome);

export function exportQuadroMensalPdf(relatorio) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const startY = tituloDocumento(doc, `Quadro mensal — ${relatorio.ano}`);

  const head = [['Indicador', ...MESES_CURTOS, 'Total']];
  const body = [
    ['Acolhidos registrados', ...relatorio.registrados, relatorio.registradosTotal],
    ...relatorio.linhasAlta.map((linha) => [
      linha.rotulo,
      ...linha.vetor,
      linha.total,
    ]),
    ['Total de altas', ...relatorio.totalAltas, relatorio.totalAltasAno],
  ];

  autoTable(doc, {
    ...estiloTabela,
    startY,
    head,
    body,
    columnStyles: {
      0: { halign: 'left', cellWidth: 52 },
      13: { fontStyle: 'bold', fillColor: [236, 253, 245] },
    },
  });

  rodapeGeracao(doc);
  salvarPdf(doc, `ctav-quadro-mensal-${relatorio.ano}.pdf`);
}

export function exportAltasPdf(acolhidosComAlta, ano) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const startY = tituloDocumento(
    doc,
    `Acolhidos com alta — ${ano}`,
    `Total: ${acolhidosComAlta.length}`
  );

  autoTable(doc, {
    ...estiloTabela,
    startY,
    head: [
      ['Acolhido', 'Entrada', 'Saída', 'Permanência (dias)', 'Permanência (meses)', 'Tipo de alta'],
    ],
    body: acolhidosComAlta.map((a) => [
      a.nome,
      formatarData(a.entrada),
      formatarData(a.saida),
      a.permanencia && a.permanencia.dias >= 0 ? String(a.permanencia.dias) : '-',
      textoMeses(a.permanencia),
      a.tipoAltaRotulo,
    ]),
    columnStyles: {
      0: { cellWidth: 42 },
      5: { cellWidth: 38 },
    },
  });

  rodapeGeracao(doc);
  salvarPdf(doc, `ctav-acolhidos-alta-${ano}.pdf`);
}

export function exportControleAdministracaoPdf({
  ano,
  mes,
  acolhidoNome,
  dias,
  prescricoesComDose,
  registros,
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const rotulo = rotuloMesAno(ano, mes);
  const startY = tituloDocumento(
    doc,
    `Controle de administração — ${rotulo}`,
    `Acolhido: ${acolhidoNome}`
  );

  const head = [
    ['Dia', 'Medicamento', ...PERIODOS_CONTROLE.map((p) => p.rotulo)],
  ];

  const body = [];
  dias.forEach((dataIso) => {
    prescricoesComDose.forEach((presc, idx) => {
      const linha = [
        idx === 0 ? formatarDiaControle(dataIso) : '',
        presc.medicamentoNome,
      ];
      PERIODOS_CONTROLE.forEach((p) => {
        const dose = presc[p.campoDose] || 0;
        if (dose <= 0) {
          linha.push('—');
          return;
        }
        const chave = chaveRegistroAdministracao(
          dataIso,
          presc.medicamentoId,
          p.chave
        );
        const tomado = Boolean(registros[chave]);
        linha.push(tomado ? 'Sim' : 'Não');
      });
      body.push(linha);
    });
  });

  autoTable(doc, {
    ...estiloTabela,
    startY,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 1.5 },
    columnStyles: {
      0: { cellWidth: 28 },
      1: { cellWidth: 42 },
    },
  });

  rodapeGeracao(doc);
  const mesStr = String(mes).padStart(2, '0');
  const slugNome = acolhidoNome
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);
  salvarPdf(doc, `ctav-controle-admin-${ano}-${mesStr}-${slugNome || 'acolhido'}.pdf`);
}

export function exportTodosRelatoriosPdf({
  relatorio,
  acolhidosComAlta,
  controle,
}) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let y = tituloDocumento(
    doc,
    `Relatórios consolidados — ${relatorio.ano}`,
    controle
      ? `Inclui controle de administração (${controle.acolhidoNome}, ${rotuloMesAno(controle.ano, controle.mes)})`
      : 'Quadro mensal e acolhidos com alta'
  );

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('1. Quadro mensal', 14, y);
  y += 4;

  autoTable(doc, {
    ...estiloTabela,
    startY: y,
    head: [['Indicador', ...MESES_CURTOS, 'Total']],
    body: [
      ['Acolhidos registrados', ...relatorio.registrados, relatorio.registradosTotal],
      ...relatorio.linhasAlta.map((linha) => [
        linha.rotulo,
        ...linha.vetor,
        linha.total,
      ]),
      ['Total de altas', ...relatorio.totalAltas, relatorio.totalAltasAno],
    ],
    columnStyles: {
      0: { halign: 'left', cellWidth: 52 },
      13: { fontStyle: 'bold', fillColor: [236, 253, 245] },
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  if (y > doc.internal.pageSize.height - 40) {
    doc.addPage();
    y = 20;
  }

  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.text('2. Acolhidos com alta', 14, y);
  y += 4;

  autoTable(doc, {
    ...estiloTabela,
    startY: y,
    head: [
      ['Acolhido', 'Entrada', 'Saída', 'Dias', 'Meses', 'Tipo de alta'],
    ],
    body:
      acolhidosComAlta.length === 0
        ? [['Nenhum acolhido com alta neste ano', '', '', '', '', '']]
        : acolhidosComAlta.map((a) => [
            a.nome,
            formatarData(a.entrada),
            formatarData(a.saida),
            a.permanencia && a.permanencia.dias >= 0
              ? String(a.permanencia.dias)
              : '-',
            textoMeses(a.permanencia),
            a.tipoAltaRotulo,
          ]),
  });

  if (controle) {
    y = doc.lastAutoTable.finalY + 10;
    if (y > doc.internal.pageSize.height - 40) {
      doc.addPage('landscape');
      y = 20;
    }

    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(
      `3. Controle de administração — ${rotuloMesAno(controle.ano, controle.mes)}`,
      14,
      y
    );
    y += 4;
    doc.setFontSize(9);
    doc.setFont(undefined, 'normal');
    doc.text(`Acolhido: ${controle.acolhidoNome}`, 14, y);
    y += 4;

    const head = [
      ['Dia', 'Medicamento', ...PERIODOS_CONTROLE.map((p) => p.rotulo)],
    ];
    const body = [];
    controle.dias.forEach((dataIso) => {
      controle.prescricoesComDose.forEach((presc, idx) => {
        const linha = [
          idx === 0 ? formatarDiaControle(dataIso) : '',
          presc.medicamentoNome,
        ];
        PERIODOS_CONTROLE.forEach((p) => {
          const dose = presc[p.campoDose] || 0;
          if (dose <= 0) {
            linha.push('—');
            return;
          }
          const chave = chaveRegistroAdministracao(
          dataIso,
          presc.medicamentoId,
          p.chave
        );
          linha.push(Boolean(controle.registros[chave]) ? 'Sim' : 'Não');
        });
        body.push(linha);
      });
    });

    autoTable(doc, {
      ...estiloTabela,
      startY: y,
      head,
      body,
      styles: { fontSize: 7, cellPadding: 1.5 },
    });
  }

  rodapeGeracao(doc);
  salvarPdf(doc, `ctav-relatorios-${relatorio.ano}.pdf`);
}
