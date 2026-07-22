import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

// ---------------------------------------------------------------------------
// Geracao de PDF dos relatorios do CTAV.
//
// Esta Lambda recebe o payload ja calculado pelo frontend e devolve o PDF em
// base64. O layout e IDENTICO ao antigo (que rodava no navegador): o codigo de
// desenho foi portado 1:1 de frontend/src/utils/exportarRelatoriosPdf.js.
//
// Contrato de entrada (event):
//   { "tipo": "quadro-mensal" | "altas" | "controle" | "todos", "dados": { ... } }
// Contrato de saida:
//   { "pdfBase64": "<base64 do PDF>" }
// ---------------------------------------------------------------------------

const MESES_CURTOS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez',
];

const MESES_CONTROLE = [
  { valor: 1, rotulo: 'Janeiro' },
  { valor: 2, rotulo: 'Fevereiro' },
  { valor: 3, rotulo: 'Março' },
  { valor: 4, rotulo: 'Abril' },
  { valor: 5, rotulo: 'Maio' },
  { valor: 6, rotulo: 'Junho' },
  { valor: 7, rotulo: 'Julho' },
  { valor: 8, rotulo: 'Agosto' },
  { valor: 9, rotulo: 'Setembro' },
  { valor: 10, rotulo: 'Outubro' },
  { valor: 11, rotulo: 'Novembro' },
  { valor: 12, rotulo: 'Dezembro' },
];

const PERIODOS_CONTROLE = [
  { chave: 'MANHA', rotulo: 'Manhã', campoDose: 'doseManha' },
  { chave: 'TARDE', rotulo: 'Tarde', campoDose: 'doseTarde' },
  { chave: 'NOITE', rotulo: 'Noite', campoDose: 'doseNoite' },
];

const chaveRegistroAdministracao = (data, medicamentoId, periodo) =>
  `${data}-${medicamentoId}-${periodo}`;

const rotuloMesAno = (ano, mes) => {
  const m = MESES_CONTROLE.find((x) => x.valor === Number(mes));
  return m ? `${m.rotulo} de ${ano}` : '';
};

const formatarDiaControle = (iso) => {
  const [ano, mes, dia] = iso.split('-');
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const semana = data.toLocaleDateString('pt-BR', { weekday: 'short' });
  return `${dia}/${mes} (${semana})`;
};

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

const PALETA_PDF = [
  [37, 99, 235], [245, 158, 11], [16, 185, 129], [239, 68, 68], [139, 92, 246],
  [14, 165, 233], [236, 72, 153], [20, 184, 166], [249, 115, 22], [100, 116, 139],
];

// Grafico de barras verticais desenhado com retangulos. dados = [{rotulo, valor}].
function desenharBarras(doc, x, y, largura, altura, titulo, dados, cor = [37, 99, 235]) {
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(titulo, x, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0);

  const topo = y + 4;
  const base = topo + altura;
  const max = Math.max(1, ...dados.map((d) => Number(d.valor) || 0));
  const n = dados.length || 1;
  const gap = 1.5;
  const larguraBarra = (largura - gap * (n - 1)) / n;

  doc.setDrawColor(203, 213, 225);
  doc.line(x, base, x + largura, base);

  dados.forEach((d, i) => {
    const valor = Number(d.valor) || 0;
    const h = max ? (valor / max) * altura : 0;
    const bx = x + i * (larguraBarra + gap);
    const by = base - h;
    if (h > 0) {
      doc.setFillColor(cor[0], cor[1], cor[2]);
      doc.rect(bx, by, larguraBarra, h, 'F');
    }
    doc.setFontSize(6);
    doc.setTextColor(120);
    doc.text(String(d.rotulo), bx + larguraBarra / 2, base + 3, { align: 'center' });
    if (valor > 0) {
      doc.setTextColor(30, 41, 59);
      doc.text(String(valor), bx + larguraBarra / 2, by - 1, { align: 'center' });
    }
  });
  doc.setTextColor(0);
}

// Grafico de distribuicao (barras horizontais). itens = [{rotulo, valor}].
function desenharDistribuicao(doc, x, y, largura, titulo, itens, vazioTexto) {
  doc.setFontSize(9);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(titulo, x, y);
  doc.setFont(undefined, 'normal');
  doc.setTextColor(0);

  let cy = y + 5;
  const lista = Array.isArray(itens) ? itens : [];
  const total = lista.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  if (!lista.length || total === 0) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(vazioTexto || 'Sem dados no período.', x, cy);
    doc.setTextColor(0);
    return cy + 4;
  }

  const max = Math.max(1, ...lista.map((it) => Number(it.valor) || 0));
  const rotuloW = 42;
  const valorW = 24;
  const trilhaX = x + rotuloW;
  const trilhaW = Math.max(20, largura - rotuloW - valorW);

  lista.forEach((it, i) => {
    const valor = Number(it.valor) || 0;
    const pct = total ? Math.round((valor / total) * 100) : 0;
    const cor = PALETA_PDF[i % PALETA_PDF.length];
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    const rot = doc.splitTextToSize(String(it.rotulo), rotuloW - 2)[0];
    doc.text(rot, x, cy + 3);
    doc.setFillColor(226, 232, 240);
    doc.rect(trilhaX, cy, trilhaW, 4, 'F');
    const w = max ? (valor / max) * trilhaW : 0;
    if (w > 0) {
      doc.setFillColor(cor[0], cor[1], cor[2]);
      doc.rect(trilhaX, cy, w, 4, 'F');
    }
    doc.setTextColor(30, 41, 59);
    doc.text(`${valor} (${pct}%)`, trilhaX + trilhaW + 2, cy + 3);
    cy += 6.5;
  });
  doc.setTextColor(0);
  return cy + 2;
}

// Desenha o bloco de graficos (barras + distribuicoes de altas e motivos).
// Retorna o novo y. Adiciona paginas conforme necessario (landscape).
function desenharGraficos(doc, relatorio, yInicial) {
  const pageH = doc.internal.pageSize.height;
  const margem = 14;
  const larguraUtil = doc.internal.pageSize.width - margem * 2;
  const meia = (larguraUtil - 10) / 2;
  let y = yInicial;

  const garantir = (h) => {
    if (y + h > pageH - 16) {
      doc.addPage(undefined, 'landscape');
      y = 20;
    }
  };

  garantir(12);
  doc.setFontSize(10);
  doc.setFont(undefined, 'bold');
  doc.setTextColor(0);
  doc.text('Gráficos', margem, y);
  y += 6;

  garantir(50);
  const dadosReg = relatorio.registrados.map((v, i) => ({ rotulo: MESES_CURTOS[i], valor: v }));
  const dadosAlt = relatorio.totalAltas.map((v, i) => ({ rotulo: MESES_CURTOS[i], valor: v }));
  desenharBarras(doc, margem, y, meia, 36, `Acolhidos registrados por mês (${relatorio.ano})`, dadosReg, [37, 99, 235]);
  desenharBarras(doc, margem + meia + 10, y, meia, 36, `Altas por mês (${relatorio.ano})`, dadosAlt, [245, 158, 11]);
  y += 50;

  garantir(45);
  const itensAltas = relatorio.linhasAlta.map((l) => ({ rotulo: l.rotulo, valor: l.total }));
  const yA = desenharDistribuicao(doc, margem, y, meia, 'Altas por tipo', itensAltas, 'Sem altas no período.');
  const yB = desenharDistribuicao(doc, margem + meia + 10, y, meia, 'Motivos de adesão', relatorio.motivosAdesao ?? [], 'Sem acolhidos no período.');
  y = Math.max(yA, yB) + 4;

  garantir(45);
  y = desenharDistribuicao(doc, margem, y, meia, 'Motivos de desistência', relatorio.motivosDesistencia ?? [], 'Sem desistências no período.');
  return y;
}

function quadroMensal(relatorio) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const startY = tituloDocumento(doc, `Quadro mensal — ${relatorio.ano}`);

  const head = [['Indicador', ...MESES_CURTOS, 'Total']];
  const body = [
    ['Acolhidos registrados', ...relatorio.registrados, relatorio.registradosTotal],
    ...relatorio.linhasAlta.map((linha) => [linha.rotulo, ...linha.vetor, linha.total]),
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

  const y = doc.lastAutoTable.finalY + 10;
  desenharGraficos(doc, relatorio, y);

  rodapeGeracao(doc);
  return doc;
}

function altas(acolhidosComAlta, ano) {
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
      ['Acolhido', 'Entrada', 'Saída', 'Perm. (dias)', 'Perm. (meses)', 'Tipo de alta', 'Motivo desist.'],
    ],
    body: acolhidosComAlta.map((a) => [
      a.nome,
      formatarData(a.entrada),
      formatarData(a.saida),
      a.permanencia && a.permanencia.dias >= 0 ? String(a.permanencia.dias) : '-',
      textoMeses(a.permanencia),
      a.tipoAltaRotulo,
      a.motivoDesistencia ?? '-',
    ]),
    columnStyles: {
      0: { cellWidth: 36 },
      5: { cellWidth: 32 },
      6: { cellWidth: 32 },
    },
  });

  rodapeGeracao(doc);
  return doc;
}

function controleAdministracao({ ano, mes, acolhidoNome, dias, prescricoesComDose, registros }) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const rotulo = rotuloMesAno(ano, mes);
  const startY = tituloDocumento(
    doc,
    `Controle de administração — ${rotulo}`,
    `Acolhido: ${acolhidoNome}`
  );

  const head = [['Dia', 'Medicamento', ...PERIODOS_CONTROLE.map((p) => p.rotulo)]];

  const body = [];
  dias.forEach((dataIso) => {
    prescricoesComDose.forEach((presc, idx) => {
      const linha = [idx === 0 ? formatarDiaControle(dataIso) : '', presc.medicamentoNome];
      PERIODOS_CONTROLE.forEach((p) => {
        const dose = presc[p.campoDose] || 0;
        if (dose <= 0) {
          linha.push('—');
          return;
        }
        const chave = chaveRegistroAdministracao(dataIso, presc.medicamentoId, p.chave);
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
  return doc;
}

function todos({ relatorio, acolhidosComAlta, controle }) {
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
      ...relatorio.linhasAlta.map((linha) => [linha.rotulo, ...linha.vetor, linha.total]),
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
    head: [['Acolhido', 'Entrada', 'Saída', 'Dias', 'Meses', 'Tipo de alta', 'Motivo desist.']],
    body:
      acolhidosComAlta.length === 0
        ? [['Nenhum acolhido com alta neste ano', '', '', '', '', '', '']]
        : acolhidosComAlta.map((a) => [
            a.nome,
            formatarData(a.entrada),
            formatarData(a.saida),
            a.permanencia && a.permanencia.dias >= 0 ? String(a.permanencia.dias) : '-',
            textoMeses(a.permanencia),
            a.tipoAltaRotulo,
            a.motivoDesistencia ?? '-',
          ]),
  });

  // Bloco de graficos (barras por mes + distribuicoes de altas e motivos).
  y = doc.lastAutoTable.finalY + 10;
  if (y > doc.internal.pageSize.height - 60) {
    doc.addPage(undefined, 'landscape');
    y = 20;
  }
  y = desenharGraficos(doc, relatorio, y);

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

    const head = [['Dia', 'Medicamento', ...PERIODOS_CONTROLE.map((p) => p.rotulo)]];
    const body = [];
    controle.dias.forEach((dataIso) => {
      controle.prescricoesComDose.forEach((presc, idx) => {
        const linha = [idx === 0 ? formatarDiaControle(dataIso) : '', presc.medicamentoNome];
        PERIODOS_CONTROLE.forEach((p) => {
          const dose = presc[p.campoDose] || 0;
          if (dose <= 0) {
            linha.push('—');
            return;
          }
          const chave = chaveRegistroAdministracao(dataIso, presc.medicamentoId, p.chave);
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
  return doc;
}

// ---------------------------------------------------------------------------
// Tutorial do sistema: documento estatico (nao depende de dados) que explica
// TODAS as funcionalidades para o usuario. Usa um pequeno motor de layout de
// texto com quebra automatica de pagina.
// ---------------------------------------------------------------------------
function tutorial() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.width;
  const pageH = doc.internal.pageSize.height;
  const margemX = 16;
  const larguraUtil = pageW - margemX * 2;
  const topo = 20;
  const base = pageH - 16;
  let y = topo;
  let pagina = 1;
  let figuraN = 0;

  const rodape = () => {
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('CTAV — Tutorial do sistema', margemX, pageH - 8);
    doc.text(String(pagina), pageW - margemX, pageH - 8, { align: 'right' });
    doc.setTextColor(0);
  };

  const novaPagina = () => {
    rodape();
    doc.addPage();
    pagina += 1;
    y = topo;
  };

  const garantirEspaco = (h) => {
    if (y + h > base) novaPagina();
  };

  const secao = (titulo) => {
    garantirEspaco(16);
    y += 3;
    doc.setFillColor(37, 99, 235);
    doc.rect(margemX, y - 4.5, larguraUtil, 8, 'F');
    doc.setTextColor(255);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(11);
    doc.text(titulo, margemX + 2.5, y + 1);
    doc.setTextColor(0);
    y += 9;
  };

  const subtitulo = (txt) => {
    garantirEspaco(9);
    doc.setFont(undefined, 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 64, 175);
    doc.text(txt, margemX, y);
    doc.setTextColor(0);
    y += 5.2;
  };

  const paragrafo = (txt) => {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9.5);
    const linhas = doc.splitTextToSize(txt, larguraUtil);
    linhas.forEach((linha) => {
      garantirEspaco(5);
      doc.text(linha, margemX, y);
      y += 4.8;
    });
    y += 1.6;
  };

  const bullets = (itens) => {
    doc.setFont(undefined, 'normal');
    doc.setFontSize(9.5);
    itens.forEach((item) => {
      const linhas = doc.splitTextToSize(item, larguraUtil - 6);
      linhas.forEach((linha, idx) => {
        garantirEspaco(5);
        if (idx === 0) doc.text('•', margemX + 1.5, y);
        doc.text(linha, margemX + 6, y);
        y += 4.8;
      });
    });
    y += 1.6;
  };

  // Desenha um fluxo vertical de passos numerados ligados por setas, para
  // mostrar a ordem recomendada de uso do sistema.
  const fluxoPassos = (passos) => {
    const boxH = 13;
    const gap = 6;
    const numR = 4;
    passos.forEach((p, i) => {
      const ehUltimo = i === passos.length - 1;
      garantirEspaco(boxH + (ehUltimo ? 0 : gap) + 2);
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.3);
      doc.setFillColor(239, 246, 255);
      doc.roundedRect(margemX, y, larguraUtil, boxH, 2, 2, 'FD');

      doc.setFillColor(37, 99, 235);
      doc.circle(margemX + 8, y + boxH / 2, numR, 'F');
      doc.setTextColor(255);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9);
      doc.text(String(i + 1), margemX + 8, y + boxH / 2 + 1.3, { align: 'center' });

      doc.setTextColor(30, 64, 175);
      doc.setFont(undefined, 'bold');
      doc.setFontSize(9.5);
      doc.text(p.titulo, margemX + 16, y + 5.2);
      doc.setTextColor(60);
      doc.setFont(undefined, 'normal');
      doc.setFontSize(8);
      const descLinhas = doc.splitTextToSize(p.descricao, larguraUtil - 20);
      doc.text(descLinhas[0] ?? '', margemX + 16, y + 10);
      doc.setTextColor(0);
      y += boxH;

      if (!ehUltimo) {
        doc.setDrawColor(37, 99, 235);
        doc.setLineWidth(0.5);
        doc.line(margemX + 8, y, margemX + 8, y + gap);
        doc.line(margemX + 8, y + gap, margemX + 6.4, y + gap - 1.8);
        doc.line(margemX + 8, y + gap, margemX + 9.6, y + gap - 1.8);
        doc.setLineWidth(0.2);
        y += gap;
      }
    });
    y += 3;
  };

  // ---------------------------------------------------------------------------
  // Utilitarios de "mockup": desenham representacoes fieis das telas do sistema
  // (mesmas cores, textos de botoes e rotulos reais) para ilustrar onde clicar.
  // ---------------------------------------------------------------------------
  const uiTexto = (px, py, texto, opts = {}) => {
    const {
      fs = 8,
      cor = [30, 41, 59],
      bold = false,
      italic = false,
      align = 'left',
      baseline = 'alphabetic',
    } = opts;
    doc.setFont(undefined, italic ? 'italic' : bold ? 'bold' : 'normal');
    doc.setFontSize(fs);
    doc.setTextColor(cor[0], cor[1], cor[2]);
    doc.text(texto, px, py, { align, baseline });
    doc.setTextColor(0);
    doc.setFont(undefined, 'normal');
  };

  const uiCaixa = (px, py, pw, ph, opts = {}) => {
    const {
      fill = [255, 255, 255],
      borda = [203, 213, 225],
      radius = 1.5,
      largBorda = 0.3,
    } = opts;
    doc.setFillColor(fill[0], fill[1], fill[2]);
    doc.setDrawColor(borda[0], borda[1], borda[2]);
    doc.setLineWidth(largBorda);
    doc.roundedRect(px, py, pw, ph, radius, radius, 'FD');
    doc.setLineWidth(0.2);
  };

  const uiBotao = (px, py, pw, ph, texto, opts = {}) => {
    const { cor = [37, 99, 235], corTexto = [255, 255, 255], fs = 8, radius = 1.5 } = opts;
    doc.setFillColor(cor[0], cor[1], cor[2]);
    doc.roundedRect(px, py, pw, ph, radius, radius, 'F');
    uiTexto(px + pw / 2, py + ph / 2, texto, {
      fs,
      cor: corTexto,
      bold: true,
      align: 'center',
      baseline: 'middle',
    });
  };

  const uiSeta = (x1, y1, x2, y2) => {
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.6);
    doc.line(x1, y1, x2, y2);
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const len = 2.4;
    doc.line(x2, y2, x2 - len * Math.cos(ang - 0.45), y2 - len * Math.sin(ang - 0.45));
    doc.line(x2, y2, x2 - len * Math.cos(ang + 0.45), y2 - len * Math.sin(ang + 0.45));
    doc.setLineWidth(0.2);
    doc.setDrawColor(0);
  };

  const uiRotuloVermelho = (px, py, texto, opts = {}) =>
    uiTexto(px, py, texto, { fs: 7, cor: [220, 38, 38], bold: true, ...opts });

  // Moldura de figura com legenda "Figura N — ...". O callback desenha o
  // conteudo recebendo (x, y, largura, altura) da area interna.
  const figura = (legenda, altura, render) => {
    const capH = 5;
    garantirEspaco(altura + capH + 6);
    const fx = margemX;
    const fw = larguraUtil;
    uiCaixa(fx, y, fw, altura, { fill: [248, 250, 252], borda: [203, 213, 225], radius: 2 });
    render(fx, y, fw, altura);
    y += altura;
    figuraN += 1;
    const legLinhas = doc.splitTextToSize(`Figura ${figuraN} — ${legenda}`, fw);
    legLinhas.forEach((l) => {
      y += 4;
      uiTexto(fx, y, l, { fs: 8, italic: true, cor: [100, 116, 139] });
    });
    y += 5;
  };

  // ----- Capa / cabecalho -----
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, pageW, 42, 'F');
  doc.setTextColor(255);
  doc.setFont(undefined, 'bold');
  doc.setFontSize(22);
  doc.text('Tutorial do Sistema', margemX, 22);
  doc.setFontSize(12);
  doc.setFont(undefined, 'normal');
  doc.text('Comunidade Terapêutica Águas Vivas (CTAV)', margemX, 32);
  doc.setTextColor(0);
  y = 52;

  paragrafo(
    'Este guia explica, passo a passo, todas as funcionalidades do sistema da CTAV. ' +
      'Ele foi feito para que qualquer funcionário consiga configurar os cadastros iniciais, ' +
      'registrar acolhidos e seus responsáveis, coletar as assinaturas dos termos, controlar o ' +
      'estoque e a administração de medicamentos, gerar documentos e relatórios sem dificuldade. ' +
      'Guarde este documento como material de consulta.'
  );

  // 1. Por onde comecar (fluxo)
  secao('1. Por onde começar (fluxo recomendado)');
  paragrafo(
    'Alguns cadastros dependem de outros. Para evitar retrabalho, siga a ordem abaixo na primeira ' +
      'vez que usar o sistema. Depois, cadastre novos itens a qualquer momento.'
  );
  fluxoPassos([
    {
      titulo: 'Configure seu usuário (opcional)',
      descricao: 'Pela engrenagem ao lado do seu nome, ajuste nome, usuário e senha.',
    },
    {
      titulo: 'Cadastre os Motivos',
      descricao: 'Motivos de adesão e de desistência usados no cadastro de acolhidos.',
    },
    {
      titulo: 'Cadastre os Medicamentos',
      descricao: 'Defina nome, comprimidos por caixa e o estoque (total de comprimidos).',
    },
    {
      titulo: 'Cadastre o Responsável',
      descricao: 'Direto no menu ou pelo botão "Cadastrar novo responsável" no acolhido.',
    },
    {
      titulo: 'Cadastre o Acolhido',
      descricao: 'Dados, prescrição, responsável e as assinaturas dos três termos.',
    },
    {
      titulo: 'Controle a administração',
      descricao: 'Defina as doses e marque o que foi tomado — o estoque baixa sozinho.',
    },
    {
      titulo: 'Combinados, Documentos e Relatórios',
      descricao: 'Registre saídas, gere os termos preenchidos e acompanhe indicadores.',
    },
  ]);
  paragrafo(
    'Resumo: os Motivos e os Medicamentos são pré-requisitos do cadastro de acolhido; o Responsável ' +
      'pode ser criado antes ou durante esse cadastro; o Controle de administração depende das doses ' +
      'prescritas; e Relatórios e Documentos usam tudo o que foi cadastrado.'
  );

  // 2. Acesso e conta do usuario
  secao('2. Acesso e conta do usuário');
  subtitulo('2.1. Login e logout');
  paragrafo(
    'Para usar o sistema é necessário estar autenticado. Na tela de login, informe seu usuário e ' +
      'senha e confirme para entrar. Enquanto estiver logado, seu nome aparece no topo direito da tela.'
  );
  bullets([
    'Sair: clique no botão "Sair", no canto superior direito, para encerrar a sessão com segurança.',
    'Sessão expirada: por segurança, após um período o sistema pede login novamente. Se isso acontecer no meio de uma ação, basta entrar de novo e repetir.',
    'Cada usuário enxerga apenas os seus próprios dados (acolhidos, medicamentos, combinados etc.). As informações não são compartilhadas entre usuários diferentes.',
  ]);

  figura(
    'Tela de login. Preencha usuário e senha e clique em "Entrar".',
    52,
    (fx, fy, fw) => {
      const cw = 74;
      const ch = 46;
      const cx = fx + (fw - cw) / 2 - 16;
      const cy = fy + 3;
      uiCaixa(cx, cy, cw, ch, { fill: [255, 255, 255], borda: [203, 213, 225], radius: 2 });
      uiTexto(cx + cw / 2, cy + 8, 'CTAV', {
        fs: 13,
        bold: true,
        cor: [37, 99, 235],
        align: 'center',
        baseline: 'middle',
      });
      uiTexto(cx + 7, cy + 16, 'Usuário', { fs: 7, cor: [100, 116, 139] });
      uiCaixa(cx + 7, cy + 17.5, cw - 14, 6.5, { fill: [248, 250, 252] });
      uiTexto(cx + 7, cy + 28, 'Senha', { fs: 7, cor: [100, 116, 139] });
      uiCaixa(cx + 7, cy + 29.5, cw - 14, 6.5, { fill: [248, 250, 252] });
      uiBotao(cx + 7, cy + 38, cw - 14, 7, 'Entrar');
      uiSeta(cx + cw + 40, cy + 48, cx + cw - 12, cy + 41.5);
      uiRotuloVermelho(cx + cw + 20, cy + 51, 'Clique para acessar');
    }
  );

  subtitulo('2.2. Configurações do usuário (engrenagem)');
  paragrafo(
    'Ao lado do seu nome, no topo da tela, há um ícone de engrenagem que abre a página de ' +
      'Configurações do usuário. Nela você mantém seus dados de acesso atualizados.'
  );
  bullets([
    'Dados do usuário: altere o nome de usuário (login) e o nome exibido. O nome atualizado aparece imediatamente no topo da tela.',
    'Alterar senha: informe a senha atual e a nova senha (com confirmação). Por segurança, a senha atual é sempre exigida.',
    'O identificador (ID) do usuário é apenas leitura e nunca pode ser alterado — é ele que liga a sua conta a todos os dados do sistema.',
  ]);

  subtitulo('2.3. Contas de usuário e permissões (administrador)');
  paragrafo(
    'O administrador pode criar e gerenciar outras contas na página de Configurações, na seção ' +
      '"Contas de usuário". Todas as contas compartilham os mesmos dados; a permissão é que define ' +
      'o que cada uma pode fazer e quais páginas enxerga no menu.'
  );
  bullets([
    'Administrador: acesso total a todas as funcionalidades e à gestão de usuários.',
    'Psicólogo: acesso às páginas de Início, Consultas e Relatórios.',
    'Advogado e Financeiro: acesso apenas às páginas de Início e Relatórios.',
    'Criar/editar conta: informe usuário, nome, senha e a permissão; é possível redefinir a senha e a permissão das demais contas.',
    'Por segurança, você não pode alterar a sua própria permissão nem excluir a sua própria conta.',
  ]);

  // 3. Navegacao
  secao('3. Navegação (menu principal)');
  paragrafo(
    'A navegação fica no topo da tela: uma barra horizontal no computador e o ícone de três barras ' +
      '(canto direito) no celular. O menu é organizado por tipo de ação, e cada item de topo tem um ' +
      'pequeno ícone. Os grupos abrem um submenu com as opções.'
  );
  bullets([
    'Início: volta para a página de boas-vindas, com atalhos e o botão do tutorial.',
    'Listas: reúne todas as listagens — acolhidos, adesões, desistências, medicamentos, combinados, consultas, ocorrências e responsáveis.',
    'Cadastros: reúne todos os cadastros — acolhido, motivo de adesão, motivo de desistência, medicamento, combinado, agendar consulta, ocorrência e responsável.',
    'Medicamentos: "Controle total (por acolhido)" e "Controle de administração".',
    'Histórico: "Arquivo morto" e "Cadastrar" (registro direto no arquivo morto).',
    'Relatórios: quadros, gráficos, consultas e exportação de PDF.',
    'Documentos: gera os termos preenchidos (Concordância, Acordo de acolhimento e Entrega de celular) em ODF ou PDF.',
    'Engrenagem (ao lado do nome): Configurações do usuário e contas de usuário.',
  ]);
  paragrafo(
    'Conforme a permissão do usuário, o menu mostra apenas as áreas liberadas — por exemplo, perfis ' +
      'não administradores veem somente Início, Consultas (quando psicólogo) e Relatórios.'
  );

  figura(
    'Barra superior: nome do usuário, engrenagem (Configurações), botão "Sair" e o ícone de menu (três barras) que abre a navegação.',
    42,
    (fx, fy, fw) => {
      const barY = fy + 6;
      const barH = 13;
      const bx0 = fx + 5;
      const bx1 = fx + fw - 5;
      uiCaixa(bx0, barY, bx1 - bx0, barH, { fill: [255, 255, 255], borda: [226, 232, 240] });
      uiTexto(bx0 + 4, barY + barH / 2, 'CTAV', {
        fs: 11,
        bold: true,
        cor: [37, 99, 235],
        baseline: 'middle',
      });
      const cy = barY + barH / 2;
      const hbW = 9;
      const hbX = bx1 - 5 - hbW;
      uiCaixa(hbX, cy - 4.5, hbW, 9, { fill: [241, 245, 249], borda: [203, 213, 225] });
      doc.setDrawColor(51, 65, 85);
      doc.setLineWidth(0.6);
      [-2, 0, 2].forEach((o) => doc.line(hbX + 2.2, cy + o, hbX + hbW - 2.2, cy + o));
      doc.setLineWidth(0.2);
      const saW = 15;
      const saX = hbX - 4 - saW;
      uiBotao(saX, cy - 3.5, saW, 7, 'Sair', { cor: [220, 38, 38], fs: 7 });
      const gX = saX - 6;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(148, 163, 184);
      doc.circle(gX, cy, 3.4, 'FD');
      doc.setFillColor(100, 116, 139);
      doc.circle(gX, cy, 1.3, 'F');
      uiTexto(gX - 6, cy, 'Maria', {
        fs: 8,
        cor: [30, 41, 59],
        align: 'right',
        baseline: 'middle',
      });
      const ly = barY + barH + 12;
      uiSeta(hbX + hbW / 2, ly, hbX + hbW / 2, barY + barH + 1);
      uiRotuloVermelho(hbX + hbW / 2, ly + 3.5, 'Menu', { align: 'center' });
      uiSeta(saX + saW / 2, ly, saX + saW / 2, cy + 4);
      uiRotuloVermelho(saX + saW / 2, ly + 3.5, 'Sair', { align: 'center' });
      uiSeta(gX, ly, gX, cy + 4);
      uiRotuloVermelho(gX, ly + 3.5, 'Config.', { align: 'center' });
    }
  );

  // 4. Cadastros iniciais
  secao('4. Cadastros iniciais (pré-requisitos)');
  subtitulo('4.1. Motivos de adesão e de desistência');
  paragrafo(
    'Os motivos explicam por que o acolhido entrou na comunidade (adesão) e por que interrompeu o ' +
      'tratamento (desistência). Gerencie-os no menu "Motivos" ou pelos atalhos em "Acolhidos".'
  );
  bullets([
    'Motivos de adesão: alimentam o campo obrigatório "Motivo de adesão" do cadastro de acolhido.',
    'Motivos de desistência: exigidos quando a alta é do tipo desistência.',
    'Ao abrir cada lista pela primeira vez, o sistema sugere alguns motivos padrão que você pode ajustar.',
    'Um motivo em uso por algum acolhido não pode ser excluído — troque o motivo do acolhido antes.',
  ]);
  subtitulo('4.2. Medicamentos');
  paragrafo(
    'Cadastre os medicamentos antes de prescrevê-los. Em Medicamentos > Cadastrar medicamento informe ' +
      'nome, descrição, comprimidos por caixa e o total de comprimidos em estoque (ver seção 9).'
  );
  subtitulo('4.3. Responsáveis');
  paragrafo(
    'Todo acolhido precisa de um responsável. Cadastre em Responsáveis > Cadastrar responsável, ou crie ' +
      'na hora, pelo botão "Cadastrar novo responsável" dentro do cadastro do acolhido.'
  );
  bullets([
    'Dados do responsável: nome, RG, CPF, contato e demais informações, além da assinatura.',
    'Atalho no acolhido: ao clicar em "Cadastrar novo responsável", o sistema leva ao cadastro de responsável e, após salvar, retorna ao formulário do acolhido preservando o que já havia sido preenchido e já selecionando o responsável recém-criado.',
    'Na lista de responsáveis é possível ver detalhes, editar e excluir.',
  ]);

  // 5. Acolhidos
  secao('5. Acolhidos');
  subtitulo('5.1. Cadastrar um acolhido');
  paragrafo(
    'Acesse Acolhidos > Cadastrar acolhido e preencha os dados da pessoa, navegando pelas abas do ' +
      'formulário. Ao final, aceite e assine os termos para registrar o acolhido (ver seção 6).'
  );
  bullets([
    'Dados principais: nome, CPF, data de nascimento, data de acolhimento na CTAV, e-mail, telefone, sexo, endereço e quarto.',
    'Motivo de adesão (obrigatório): por que o acolhido entrou na comunidade.',
    'Responsável (obrigatório): selecione um responsável cadastrado ou crie um novo pelo botão ao lado.',
    'O CPF e o e-mail não podem se repetir entre os seus acolhidos — o sistema avisa se já existir cadastro igual.',
    'Foto: é possível anexar uma foto do acolhido (JPG, PNG ou WEBP, até 10 MB).',
    'Prescrição de medicamentos: informe os medicamentos e as doses por período (manhã, tarde e noite).',
    'Alta: se o acolhido já teve alta, marque a alta, a data e o tipo (ver seção 5.4).',
  ]);
  subtitulo('5.2. Abas do formulário');
  bullets([
    'Informações gerais: dados pessoais, foto, endereço, quarto e (quando aplicável) alta.',
    'Medicações: vincule medicamentos, reserve para o acolhido os comprimidos do estoque e defina as doses de manhã, tarde e noite. Também é possível cadastrar um medicamento novo sem sair do formulário.',
    'Combinados (cadastro novo): inclua saídas que serão criadas junto com o acolhido.',
    'Anexos (cadastro novo): adicione documentos que serão enviados após o salvamento.',
    'Na edição de um acolhido já existente, as doses e a reserva de estoque são ajustadas pelo Controle total (seção 9.5) e o dia a dia pelo Controle de administração (seção 10).',
  ]);

  figura(
    'Cadastro de acolhido: abas do formulário e, ao lado do responsável, o botão "Cadastrar novo responsável".',
    58,
    (fx, fy, fw) => {
      const px = fx + 5;
      const pw = fw - 10;
      let cy = fy + 6;
      const abas = ['Informações gerais', 'Medicações', 'Combinados', 'Anexos'];
      let ax = px;
      abas.forEach((rot, i) => {
        const aw = doc.getTextWidth(rot) * (7 / doc.internal.getFontSize() || 1);
        const larg = 3.5 + rot.length * 1.55;
        if (i === 0) {
          uiBotao(ax, cy, larg, 7, rot, { cor: [37, 99, 235], fs: 6.5 });
        } else {
          uiCaixa(ax, cy, larg, 7, { fill: [241, 245, 249], borda: [203, 213, 225] });
          uiTexto(ax + larg / 2, cy + 3.5, rot, {
            fs: 6.5,
            cor: [71, 85, 105],
            align: 'center',
            baseline: 'middle',
          });
        }
        ax += larg + 2;
      });
      cy += 11;
      uiTexto(px, cy, 'Nome', { fs: 7, cor: [100, 116, 139] });
      uiCaixa(px, cy + 1.5, pw / 2 - 3, 6, { fill: [255, 255, 255] });
      uiTexto(px + pw / 2 + 1, cy, 'CPF', { fs: 7, cor: [100, 116, 139] });
      uiCaixa(px + pw / 2 + 1, cy + 1.5, pw / 2 - 3, 6, { fill: [255, 255, 255] });
      cy += 12;
      uiTexto(px, cy, 'Responsável', { fs: 7, cor: [100, 116, 139] });
      const selW = pw - 62;
      uiCaixa(px, cy + 1.5, selW, 7, { fill: [255, 255, 255] });
      uiTexto(px + 3, cy + 5, 'Selecione...', { fs: 7, cor: [148, 163, 184] });
      const btW = 56;
      const btX = px + selW + 4;
      uiBotao(btX, cy + 1.5, btW, 7, 'Cadastrar novo responsável', {
        cor: [226, 232, 240],
        corTexto: [30, 64, 175],
        fs: 6.5,
      });
      uiSeta(btX + btW / 2, cy + 16, btX + btW / 2, cy + 9);
      uiRotuloVermelho(btX + btW / 2, cy + 19, 'Cria sem perder os dados', { align: 'center' });
    }
  );
  subtitulo('5.3. Lista, detalhes e foto');
  bullets([
    'Lista de acolhidos: mostra os ativos (fora do arquivo morto), com busca por nome, CPF ou e-mail.',
    'Ações por linha: Ver detalhes, Editar (dados, foto, prescrição e assinaturas), Enviar ao histórico (só com alta) e Excluir.',
    'Seleção múltipla: envie vários ao histórico ou exclua vários de uma vez.',
    'Detalhes: consulta completa do acolhido, incluindo foto, prescrição, responsável e situação de alta.',
  ]);
  subtitulo('5.4. Alta e tipos de alta');
  bullets([
    'Alta por conclusão: cumpriu todas as etapas do programa e foi encaminhado para a sociedade.',
    'Alta administrativa: desligamento por infração ao regimento interno (ex.: agressões ou furto).',
    'Alta por desistência: interrompeu por vontade própria. Exige informar o motivo da desistência.',
    'Alta por recaída: desligamento por uso de substâncias psicoativas durante o acolhimento.',
  ]);
  subtitulo('5.5. Anexos do acolhido');
  bullets([
    'Formatos aceitos: PDF, JPG, PNG e Excel (.xlsx). Até 10 MB por arquivo e 50 anexos por acolhido.',
    'Tipos de anexo: Atestado, Receita, Documento ou Outro — classifique cada arquivo ao enviar.',
    'É possível enviar, renomear, baixar (link seguro e temporário) e excluir arquivos.',
  ]);

  // 6. Termos e assinaturas
  secao('6. Termos e assinaturas');
  paragrafo(
    'Ao cadastrar um acolhido, antes de concluir, é preciso apresentar e assinar três termos. Eles ' +
      'aparecem em abas dentro de uma janela, e o cadastro só é finalizado quando os três forem aceitos.'
  );
  bullets([
    'Termo de concordância e colaboração: compromissos do acolhido com as regras da comunidade.',
    'Acordo de acolhimento: além de aceitar o termo, o acolhido decide se autoriza o uso de imagem.',
    'Termo de entrega de celular: o acolhido informa se faz (ou não) a entrega do aparelho celular.',
  ]);
  paragrafo(
    'Cada termo é assinado no próprio sistema: assine com o dedo/mouse no quadro de assinatura do ' +
      'acolhido e, quando aplicável, do responsável. As opções escolhidas (uso de imagem e entrega de ' +
      'celular) ficam gravadas no cadastro e podem ser conferidas depois na página Documentos.'
  );
  bullets([
    'É obrigatório escolher as opções (uso de imagem e entrega de celular) e assinar para concluir o cadastro.',
    'As assinaturas podem ser refeitas depois pela edição do acolhido.',
    'Os campos que serão preenchidos com dados do cadastro aparecem destacados em azul na visualização dos termos.',
  ]);

  figura(
    'Janela dos termos: abas dos três termos, opção a marcar, quadro de assinatura e o botão para aceitar e assinar.',
    72,
    (fx, fy, fw) => {
      const px = fx + 5;
      const pw = fw - 10;
      let cy = fy + 6;
      const abas = ['Concordância', 'Acordo de acolhimento', 'Entrega de celular'];
      let ax = px;
      abas.forEach((rot, i) => {
        const larg = 4 + rot.length * 1.6;
        if (i === 1) {
          uiBotao(ax, cy, larg, 7, rot, { cor: [37, 99, 235], fs: 6.5 });
        } else {
          uiCaixa(ax, cy, larg, 7, { fill: [241, 245, 249], borda: [203, 213, 225] });
          uiTexto(ax + larg / 2, cy + 3.5, rot, {
            fs: 6.5,
            cor: [71, 85, 105],
            align: 'center',
            baseline: 'middle',
          });
        }
        ax += larg + 2;
      });
      cy += 11;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      [0, 4.5, 9].forEach((o) => doc.line(px, cy + o, px + pw - 40, cy + o));
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(0.6);
      doc.line(px + 20, cy, px + 45, cy);
      doc.line(px + 30, cy + 9, px + 55, cy + 9);
      doc.setLineWidth(0.2);
      doc.setDrawColor(0);
      uiTexto(px + pw - 36, cy - 1, 'campos em azul', {
        fs: 6,
        cor: [37, 99, 235],
        bold: true,
      });
      cy += 15;
      doc.setFillColor(37, 99, 235);
      doc.rect(px, cy, 3.8, 3.8, 'F');
      doc.setDrawColor(255, 255, 255);
      doc.setLineWidth(0.6);
      doc.lines([[0.8, 0.8], [1.6, -1.9]], px + 0.8, cy + 2.1);
      doc.setLineWidth(0.2);
      doc.setDrawColor(0);
      uiTexto(px + 5.5, cy + 3, 'Autorizo o uso de imagem', { fs: 7, cor: [30, 41, 59] });
      cy += 8;
      const assW = pw - 62;
      uiCaixa(px, cy, assW, 16, { fill: [255, 255, 255], borda: [148, 163, 184] });
      uiTexto(px + 3, cy + 3.5, 'Assine aqui', { fs: 6.5, cor: [148, 163, 184] });
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.7);
      doc.lines(
        [
          [4, -3],
          [4, 4],
          [4, -5],
          [5, 3],
          [4, -2],
        ],
        px + 8,
        cy + 11
      );
      doc.setLineWidth(0.2);
      doc.setDrawColor(0);
      uiBotao(px + assW + 4, cy + 4.5, 56, 8, 'Aceitar e assinar', { fs: 7 });
      uiSeta(px + assW - 8, cy + 23, px + assW / 2, cy + 16.5);
      uiRotuloVermelho(px + assW - 30, cy + 26, 'Assine com o dedo ou mouse');
    }
  );

  // 7. Documentos
  secao('7. Documentos (termos preenchidos e exportação)');
  paragrafo(
    'A página Documentos reúne os três termos já preenchidos com os dados do acolhido e do responsável ' +
      'selecionados, e permite exportá-los para arquivo.'
  );
  bullets([
    'Selecione o acolhido e o responsável (comboboxes lado a lado) para montar os termos preenchidos.',
    'Os campos preenchidos automaticamente (nome, CPF etc.) aparecem destacados em azul.',
    'Resumo das opções e assinaturas: mostra se autorizou uso de imagem, se entregou o celular e as assinaturas registradas.',
    'Exportar: gere cada termo em ODF (.odt, editável em Word/LibreOffice) ou em PDF, já com as assinaturas embutidas.',
  ]);

  // 8. Historico
  secao('8. Histórico (arquivo morto)');
  paragrafo(
    'O arquivo morto guarda os acolhidos que já encerraram o acolhimento, sem apagar nenhum dado. ' +
      'Assim a lista principal fica limpa, mas o histórico permanece disponível para consulta.'
  );
  bullets([
    'Arquivo morto: acolhidos arquivados, com busca por nome, CPF ou e-mail e a data de arquivamento.',
    'Enviar ao histórico: feito na Lista de acolhidos, só para quem já teve alta. Todos os dados são preservados.',
    'Restaurar: devolve o acolhido para a lista de ativos.',
    'Cadastrar no histórico: registra diretamente no arquivo morto quem passou pela comunidade antes do sistema (alta obrigatória).',
    'Seleção múltipla: restaure ou exclua vários registros de uma vez. A exclusão é irreversível.',
  ]);

  // 9. Medicamentos e estoque
  secao('9. Medicamentos e controle de estoque');
  paragrafo(
    'Em Medicamentos > Lista de medicamentos você vê todos os itens; em Cadastrar medicamento inclui um ' +
      'novo. O estoque é medido em comprimidos e relacionado às caixas.'
  );
  subtitulo('9.1. Estoque: caixas, comprimidos, livre e reservado');
  bullets([
    'Comprimidos por caixa: quantos comprimidos vêm em cada caixa (tamanho da embalagem).',
    'Total de comprimidos (livre): o estoque ainda NÃO reservado a nenhum acolhido — o que está disponível para reservar ou usar livremente.',
    'Reservado: comprimidos separados exclusivamente para um acolhido; saem do estoque livre e não contam nele.',
    'Qtd. de caixas: reflete o estoque FÍSICO total (livre + reservado). Ex.: 2 caixas de 30 = 60 comprimidos, mesmo que 30 estejam reservados a um acolhido.',
    'Ao informar caixas e comprimidos por caixa no cadastro, o total é calculado automaticamente, mas pode ser ajustado manualmente (ex.: caixa parcial).',
  ]);
  subtitulo('9.2. Edição rápida na lista');
  paragrafo(
    'Na lista de medicamentos, clique sobre o valor de "Qtd. de caixas", "Comprimidos por caixa" ou ' +
      '"Total de comprimidos" para abrir um campo editável. Confirme no ícone de confirmação ao lado. ' +
      'O sistema recalcula automaticamente a relação entre caixas e comprimidos.'
  );
  subtitulo('9.3. Alertas de estoque baixo');
  bullets([
    'Vermelho (crítico): menos de 8 comprimidos em estoque.',
    'Amarelo (baixo): uma caixa ou menos em estoque.',
    'A lista destaca as linhas nessas cores e traz uma legenda explicando cada uma.',
    'Ao entrar no sistema (login), um aviso lista, por acolhido, os medicamentos em uso cujo estoque reservado está acabando.',
  ]);

  figura(
    'Lista de medicamentos: linhas destacadas em amarelo (baixo) e vermelho (crítico), legenda e edição do estoque ao clicar no valor.',
    56,
    (fx, fy, fw) => {
      const px = fx + 5;
      const pw = fw - 10;
      const colNome = px;
      const colCaixa = px + pw * 0.42;
      const colPor = px + pw * 0.62;
      const colTotal = px + pw * 0.82;
      let cy = fy + 5;
      uiCaixa(px, cy, pw, 7, { fill: [37, 99, 235], borda: [37, 99, 235] });
      uiTexto(colNome + 2, cy + 3.5, 'Nome', { fs: 6.5, cor: [255, 255, 255], bold: true, baseline: 'middle' });
      uiTexto(colCaixa, cy + 3.5, 'Caixas', { fs: 6.5, cor: [255, 255, 255], bold: true, baseline: 'middle' });
      uiTexto(colPor, cy + 3.5, 'Comp./caixa', { fs: 6.5, cor: [255, 255, 255], bold: true, baseline: 'middle' });
      uiTexto(colTotal, cy + 3.5, 'Total', { fs: 6.5, cor: [255, 255, 255], bold: true, baseline: 'middle' });
      cy += 7;
      const linhas = [
        { nome: 'Sertralina', caixa: '3', por: '30', total: '90', fundo: [255, 255, 255] },
        { nome: 'Clonazepam', caixa: '1', por: '30', total: '24', fundo: [254, 249, 195] },
        { nome: 'Fluoxetina', caixa: '0', por: '20', total: '6', fundo: [254, 226, 226] },
      ];
      linhas.forEach((l) => {
        uiCaixa(px, cy, pw, 7, { fill: l.fundo, borda: [226, 232, 240], radius: 0 });
        uiTexto(colNome + 2, cy + 3.5, l.nome, { fs: 6.5, cor: [30, 41, 59], baseline: 'middle' });
        uiTexto(colCaixa, cy + 3.5, l.caixa, { fs: 6.5, cor: [30, 41, 59], baseline: 'middle' });
        uiTexto(colPor, cy + 3.5, l.por, { fs: 6.5, cor: [30, 41, 59], baseline: 'middle' });
        uiTexto(colTotal, cy + 3.5, l.total, { fs: 6.5, cor: [30, 41, 59], bold: true, baseline: 'middle' });
        cy += 7;
      });
      const totalEditY = fy + 5 + 7 + 7 + 3.5;
      uiSeta(colTotal + 30, totalEditY - 6, colTotal + 4, totalEditY);
      uiRotuloVermelho(colTotal + 12, totalEditY - 8, 'Clique no valor para editar');
      cy += 2;
      doc.setFillColor(254, 226, 226);
      doc.setDrawColor(220, 38, 38);
      doc.rect(px, cy, 3.5, 3.5, 'FD');
      uiTexto(px + 5, cy + 3, 'Crítico: menos de 8 comprimidos', { fs: 6.5, cor: [71, 85, 105] });
      doc.setFillColor(254, 249, 195);
      doc.setDrawColor(202, 138, 4);
      doc.rect(px + pw / 2, cy, 3.5, 3.5, 'FD');
      uiTexto(px + pw / 2 + 5, cy + 3, 'Baixo: uma caixa ou menos', { fs: 6.5, cor: [71, 85, 105] });
      doc.setDrawColor(0);
    }
  );

  subtitulo('9.4. Reserva de estoque por acolhido');
  paragrafo(
    'Parte do estoque de um medicamento pode ser reservada para um acolhido específico. O que é ' +
      'reservado sai do estoque livre e passa a pertencer àquele acolhido. A reserva pode ser feita ' +
      'no cadastro/edição do medicamento, na coluna "Reservado" da lista (clique para ver e editar ' +
      'por acolhido) ou na página "Controle total (por acolhido)" (ver 9.5).'
  );
  bullets([
    'Reduzir a reserva ou desvincular o medicamento devolve os comprimidos ao estoque livre.',
    'A coluna "Reservado" da lista mostra o total reservado e permite abrir o detalhe por acolhido.',
    'O estoque livre nunca fica negativo: não é possível reservar mais do que há disponível.',
  ]);

  subtitulo('9.5. Controle total de medicação (por acolhido)');
  paragrafo(
    'Em Medicamentos > "Controle total (por acolhido)" você gerencia, em uma única tela, quais ' +
      'medicamentos cada acolhido usa, quanto está reservado a ele e as doses de cada período.'
  );
  bullets([
    'Selecione o acolhido para ver e editar toda a medicação dele.',
    'Vincular medicamento: escolha um item no campo "Vincular medicamento" — ele mostra o estoque livre disponível.',
    'Reservar (comp.): quantos comprimidos ficam separados para o acolhido; a equivalência em caixas aparece ao lado.',
    'Doses (manhã, tarde e noite): quantos comprimidos ele toma em cada período.',
    'Cadastrar novo medicamento: crie um medicamento sem sair da página, pelo botão no topo.',
    'Salvar medicação: aplica tudo de uma vez — o reservado sai do estoque livre; reduzir ou desvincular devolve ao estoque livre.',
  ]);

  // 10. Controle de administracao (ligado ao estoque)
  secao('10. Controle de administração de medicamentos');
  paragrafo(
    'É onde a equipe registra, dia a dia, se o acolhido tomou (ou não) cada medicamento prescrito, em ' +
      'cada período. Acesse por Medicamentos > Controle de administração.'
  );
  bullets([
    'Selecione o acolhido, o mês e o ano para abrir a grade do período.',
    'Doses: acima da grade, ajuste quantos comprimidos o acolhido toma em cada período (manhã, tarde, noite) e clique em "Salvar doses". A grade só mostra os períodos com dose salva.',
    'Marque a caixa quando o acolhido tomar o medicamento no dia/período; desmarque para corrigir um engano.',
  ]);

  figura(
    'Grade de administração: marque a caixa quando o acolhido tomar o medicamento no dia e período. "Salvar doses" fica no topo.',
    54,
    (fx, fy, fw) => {
      const px = fx + 5;
      const pw = fw - 10;
      let cy = fy + 5;
      uiBotao(px, cy, 30, 7, 'Salvar doses', { fs: 7 });
      uiTexto(px + 34, cy + 3.5, 'Manhã: 1   Tarde: 0   Noite: 1', {
        fs: 7,
        cor: [71, 85, 105],
        baseline: 'middle',
      });
      cy += 11;
      const dias = ['Dia 1', 'Dia 2', 'Dia 3', 'Dia 4'];
      const rotuloW = 32;
      const cellW = (pw - rotuloW) / dias.length;
      uiCaixa(px, cy, pw, 6, { fill: [241, 245, 249], borda: [226, 232, 240], radius: 0 });
      uiTexto(px + 2, cy + 3, 'Medicamento', { fs: 6, cor: [71, 85, 105], bold: true, baseline: 'middle' });
      dias.forEach((d, i) => {
        uiTexto(px + rotuloW + cellW * i + cellW / 2, cy + 3, d, {
          fs: 6,
          cor: [71, 85, 105],
          bold: true,
          align: 'center',
          baseline: 'middle',
        });
      });
      cy += 6;
      const periodos = [
        { rot: 'Sertralina — Manhã', marc: [true, true, false, true] },
        { rot: 'Sertralina — Noite', marc: [true, false, false, true] },
      ];
      periodos.forEach((p) => {
        uiCaixa(px, cy, pw, 8, { fill: [255, 255, 255], borda: [226, 232, 240], radius: 0 });
        uiTexto(px + 2, cy + 4, p.rot, { fs: 6, cor: [30, 41, 59], baseline: 'middle' });
        p.marc.forEach((m, i) => {
          const bxc = px + rotuloW + cellW * i + cellW / 2;
          const bcx = bxc - 2;
          const bcy = cy + 2.5;
          if (m) {
            doc.setFillColor(34, 197, 94);
            doc.setDrawColor(34, 197, 94);
            doc.roundedRect(bcx, bcy, 4, 4, 0.5, 0.5, 'FD');
            doc.setDrawColor(255, 255, 255);
            doc.setLineWidth(0.6);
            doc.lines([[0.9, 0.9], [1.7, -2]], bcx + 0.9, bcy + 2.2);
            doc.setLineWidth(0.2);
            doc.setDrawColor(0);
          } else {
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(148, 163, 184);
            doc.roundedRect(bcx, bcy, 4, 4, 0.5, 0.5, 'FD');
          }
        });
        cy += 8;
      });
      doc.setDrawColor(0);
      const alvoX = px + rotuloW + cellW * 0 + cellW / 2 - 2 + 2;
      uiSeta(px + rotuloW + cellW * 1.6, cy + 6, alvoX, cy - 2.5);
      uiRotuloVermelho(px + rotuloW + cellW * 1.6 + 2, cy + 8, 'Marque o que foi tomado (baixa o estoque)');
    }
  );

  subtitulo('10.1. Ligação com o estoque reservado');
  bullets([
    'Ao marcar que tomou, a dose daquele período é descontada automaticamente do estoque RESERVADO daquele acolhido (não do estoque livre geral).',
    'Ao desmarcar, a mesma dose é devolvida ao estoque reservado do acolhido.',
    'Se o estoque reservado do acolhido for insuficiente para a dose, o sistema impede a marcação e avisa por falta de estoque — reforce a reserva na seção 9.5.',
    'Só é possível marcar/desmarcar de hoje em diante; os dias anteriores ficam bloqueados (somente leitura).',
    'Alterar a dose de um período limpa as marcações daquele período (de hoje em diante) e devolve ao estoque o que havia sido descontado.',
  ]);

  // 11. Combinados
  secao('11. Combinados (saídas)');
  paragrafo(
    'Os combinados registram as saídas e compromissos agendados dos acolhidos. Em Combinados > Lista de ' +
      'combinados você acompanha os registros; em Cadastrar combinado você cria um novo.'
  );
  bullets([
    'Informe o acolhido, o tipo da saída e uma descrição.',
    'Tipos: Médico, Dentista, Governo, Banco, Detran, Ressocialização com a família e Outro tipo de saída.',
    'Datas: para Ressocialização com a família, informe ida e volta. Nos demais, apenas a data do combinado.',
    'Na lista: busque por nome, CPF ou tipo; use Ver, Editar, Excluir ou exclua vários selecionados.',
  ]);

  // 12. Consultas
  secao('12. Consultas');
  paragrafo(
    'As consultas registram os atendimentos e compromissos de saúde dos acolhidos (médicos, exames, ' +
      'terapias etc.). Agende em Cadastros > Agendar consulta e acompanhe em Listas > Lista de consultas. ' +
      'Esta área fica disponível para administrador e psicólogo.'
  );
  bullets([
    'Campos: acolhido, data e hora, profissional/especialidade, local, descrição e a situação.',
    'Situações: Agendada, Realizada ou Cancelada.',
    'Concluir consulta: ao marcar como Realizada, informe um resumo do que foi tratado; esse resumo fica guardado no histórico da consulta.',
    'Na lista: busque, veja detalhes, edite, conclua ou exclua; consultas já realizadas não voltam a ser editadas na situação.',
  ]);
  bullets([
    'Aviso de consultas próximas: ao entrar no sistema, quem tem acesso é avisado das consultas agendadas para as próximas 24 horas, destacando as mais urgentes (3h, 2h, 1h e 15 minutos antes).',
  ]);

  // 13. Ocorrencias
  secao('13. Ocorrências');
  paragrafo(
    'As ocorrências registram fatos relevantes do dia a dia da comunidade (intercorrências, conflitos, ' +
      'eventos etc.). Cadastre em Cadastros > Cadastrar ocorrência e acompanhe em Listas > Lista de ocorrências.'
  );
  bullets([
    'Campos: título (o que foi a ocorrência), descrição detalhada, data da ocorrência e os acolhidos envolvidos.',
    'Uma ocorrência pode envolver um, vários ou nenhum acolhido.',
    'Na lista: busque por acolhido ou título, veja detalhes, edite, exclua ou exclua vários selecionados.',
  ]);

  // 14. Relatorios
  secao('14. Relatórios');
  paragrafo(
    'Em Relatórios você acompanha indicadores e pode exportar tudo em PDF. Primeiro selecione o ano; ' +
      'depois escolha a visão desejada nas abas.'
  );
  bullets([
    'Quadro mensal: acolhidos registrados e altas por mês (por tipo), com totais e gráficos.',
    'Acolhidos com alta: entrada, saída, tempo de permanência, tipo de alta e motivo (nas desistências).',
    'Motivos: gráficos de distribuição dos motivos de adesão e de desistência do ano.',
    'Controle de administração (somente leitura): consulta a grade de um acolhido em um mês.',
    'Consultas: relação das consultas do período por acolhido e situação (agendada, realizada, cancelada).',
    '"Exportar visão (PDF)" gera a aba aberta; "Exportar todos (PDF)" gera um PDF consolidado.',
    'Os PDFs são gerados na nuvem e baixados pelo navegador; enquanto isso, o botão mostra "Gerando PDF...".',
  ]);

  // 15. Pagina inicial e tutorial
  secao('15. Página inicial e este tutorial');
  paragrafo(
    'A página Início exibe a descrição do sistema, uma saudação e atalhos para as principais áreas. ' +
      'O botão "Ver tutorial completo (PDF)" gera e baixa este documento. Use-o sempre que precisar ' +
      'relembrar como utilizar alguma funcionalidade.'
  );

  // 16. Dicas
  secao('16. Dicas e boas práticas');
  bullets([
    'Siga o fluxo da seção 1 na primeira vez: motivos e medicamentos antes dos acolhidos.',
    'Reserve o estoque de cada medicamento ao acolhido (seção 9.5) antes de registrar a administração — o desconto diário sai do estoque reservado dele.',
    'Salve as doses antes de marcar a administração — é isso que garante o desconto correto no estoque.',
    'Reponha o estoque assim que aparecerem os alertas vermelho/amarelo (no login e na lista).',
    'Fique atento ao aviso de consultas próximas exibido ao entrar no sistema.',
    'Mantenha datas de acolhimento e de alta corretas para relatórios fiéis.',
    'Antes de enviar um acolhido ao histórico, confirme que a alta foi registrada.',
    'As mensagens de sucesso e erro aparecem como avisos do próprio sistema; leia antes de confirmar exclusões.',
    'As listagens são paginadas; use a busca no topo de cada lista para encontrar registros rapidamente.',
    'Ao terminar, clique em "Sair", principalmente em computadores compartilhados.',
  ]);

  rodape();
  return doc;
}

function gerarDoc(tipo, dados) {
  switch (tipo) {
    case 'quadro-mensal':
      return quadroMensal(dados);
    case 'altas':
      return altas(dados.acolhidosComAlta ?? [], dados.ano);
    case 'controle':
      return controleAdministracao(dados);
    case 'todos':
      return todos(dados);
    case 'tutorial':
      return tutorial();
    default:
      throw new Error(`Tipo de relatorio invalido: ${tipo}`);
  }
}

export const handler = async (event) => {
  // Aceita tanto invocacao direta (event = { tipo, dados }) quanto via API
  // Gateway (event.body como string JSON), para maior flexibilidade.
  let entrada = event;
  if (event && typeof event.body === 'string') {
    entrada = JSON.parse(event.body);
  }

  const { tipo, dados } = entrada ?? {};
  if (!tipo) {
    throw new Error('Payload invalido: informe "tipo".');
  }
  // O tutorial e estatico; os demais tipos dependem de "dados".
  if (tipo !== 'tutorial' && !dados) {
    throw new Error('Payload invalido: informe "dados".');
  }

  const doc = gerarDoc(tipo, dados ?? {});
  const arrayBuffer = doc.output('arraybuffer');
  const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');

  return { pdfBase64 };
};

export default handler;
