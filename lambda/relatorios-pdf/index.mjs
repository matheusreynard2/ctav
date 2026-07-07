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
      'Ele foi feito para que qualquer funcionário consiga cadastrar acolhidos, controlar ' +
      'medicamentos, registrar saídas (combinados), acompanhar altas e gerar relatórios ' +
      'sem dificuldade. Guarde este documento como material de consulta.'
  );

  // 1. Acesso
  secao('1. Acesso ao sistema (login e logout)');
  paragrafo(
    'Para usar o sistema é necessário estar autenticado. Na tela de login, informe seu ' +
      'usuário e senha e confirme para entrar. Enquanto estiver logado, seu nome aparece no ' +
      'topo direito da tela.'
  );
  bullets([
    'Sair: clique no botão "Sair", no canto superior direito, para encerrar a sessão com segurança.',
    'Sessão expirada: por segurança, após um período o sistema pede login novamente. Se isso acontecer no meio de uma ação, basta entrar de novo e repetir.',
    'Cada usuário enxerga apenas os seus próprios dados (acolhidos, medicamentos, combinados etc.). As informações não são compartilhadas entre usuários diferentes.',
  ]);

  // 2. Navegacao
  secao('2. Navegação (menu principal)');
  paragrafo(
    'A navegação é feita pelo menu no topo da tela (ícone de três barras, no canto direito). ' +
      'Ao abri-lo, você vê os grupos de funções. Alguns grupos abrem um submenu com mais opções.'
  );
  bullets([
    'Início: volta para a página de boas-vindas com a descrição do sistema.',
    'Acolhidos: "Lista de acolhidos", "Cadastrar acolhido" e os atalhos para os motivos de adesão e de desistência.',
    'Motivos: "Motivos de adesão" e "Motivos de desistência", onde você cadastra, edita e exclui os motivos usados nos acolhidos e nos relatórios.',
    'Histórico: "Arquivo morto" e "Cadastrar" (registro direto no arquivo morto).',
    'Medicamentos: "Lista de medicamentos", "Cadastrar medicamento" e "Controle de administração".',
    'Combinados: "Lista de combinados" e "Cadastrar combinado".',
    'Relatórios: quadros, gráficos e exportação de PDF.',
  ]);

  // 3. Acolhidos
  secao('3. Acolhidos');
  subtitulo('3.1. Cadastrar um acolhido');
  paragrafo(
    'Acesse Acolhidos → Cadastrar acolhido e preencha os dados da pessoa. Ao final, salve para ' +
      'registrar o acolhido na lista.'
  );
  bullets([
    'Dados principais: nome, CPF, data de nascimento, data de acolhimento na CTAV, e-mail, telefone, sexo, endereço e quarto.',
    'Motivo de adesão (obrigatório): selecione por que o acolhido entrou na comunidade. As opções são gerenciadas no menu "Motivos" (ver seção 3.7).',
    'O CPF e o e-mail não podem se repetir entre os seus acolhidos — o sistema avisa se já existir cadastro igual.',
    'Foto: é possível anexar uma foto do acolhido (JPG, PNG ou WEBP, até 10 MB).',
    'Prescrição de medicamentos: informe os medicamentos e as doses por período (manhã, tarde e noite). Essas doses alimentam o Controle de administração.',
    'Alta: se o acolhido já teve alta, marque a alta, a data e o tipo de alta (ver seção 3.4).',
  ]);

  subtitulo('3.2. Abas do formulário de cadastro');
  paragrafo(
    'Ao cadastrar um acolhido novo (ativo ou no histórico), o formulário é dividido em abas. ' +
      'Navegue entre elas antes de salvar.'
  );
  bullets([
    'Informações gerais: dados pessoais, foto, endereço, quarto e (quando aplicável) alta.',
    'Medicações: selecione medicamentos da lista disponível e defina as doses de manhã, tarde e noite. Use as setas para mover medicamentos entre "disponíveis" e "selecionados".',
    'Combinados (cadastro novo): inclua saídas/combinados que serão criados junto com o acolhido.',
    'Anexos (cadastro novo): adicione documentos que serão enviados após o salvamento.',
    'Na edição de um acolhido já existente, as doses são alteradas pelo Controle de administração (seção 6), não pelo formulário.',
  ]);

  subtitulo('3.3. Lista de acolhidos');
  paragrafo(
    'Em Acolhidos → Lista de acolhidos você vê todos os acolhidos ativos (que não estão no arquivo ' +
      'morto). Use a busca para filtrar por nome, CPF ou e-mail. Cada linha oferece ações:'
  );
  bullets([
    'Ver: abre os detalhes completos do acolhido.',
    'Editar: altera os dados cadastrais, a foto e a prescrição.',
    'Anexos: gerencia documentos do acolhido (ver seção 3.6).',
    'Enviar ao histórico: move o acolhido para o arquivo morto (ver seção 4). Só é permitido para quem já teve alta.',
    'Excluir: remove definitivamente o acolhido e seus dados relacionados. Use com cuidado.',
    'Seleção múltipla: marque checkboxes nas linhas (ou "selecionar todos") para enviar vários ao histórico ou excluir vários de uma vez.',
  ]);

  subtitulo('3.4. Detalhes e foto');
  paragrafo(
    'Na tela de detalhes você consulta todas as informações do acolhido, incluindo a foto, os dados ' +
      'pessoais, a prescrição e a situação de alta. A foto pode ser adicionada ou removida pela edição ' +
      '(JPG, PNG ou WEBP, até 10 MB).'
  );

  subtitulo('3.5. Alta e tipos de alta');
  paragrafo(
    'A alta indica o encerramento do acolhimento. Ao marcar a alta, informe a data e o tipo. Os tipos ' +
      'disponíveis são:'
  );
  bullets([
    'Alta por conclusão: o acolhido cumpriu todas as etapas do programa terapêutico e foi encaminhado para a sociedade.',
    'Alta administrativa: desligamento por infração ao regimento interno (por exemplo, agressões físicas ou furto).',
    'Alta por desistência: o acolhido decidiu, por vontade própria, interromper o tratamento. Nesse caso é obrigatório informar o motivo da desistência.',
    'Alta por recaída: desligamento em razão do uso de substâncias psicoativas durante o acolhimento.',
  ]);

  subtitulo('3.6. Anexos do acolhido');
  paragrafo(
    'Cada acolhido pode ter documentos anexados (exames, documentos pessoais, planilhas etc.). Na tela ' +
      'de anexos você pode enviar, renomear, baixar e excluir arquivos.'
  );
  bullets([
    'Formatos aceitos: PDF, JPG, PNG e Excel (.xlsx).',
    'Tamanho máximo por arquivo: 10 MB. Limite de 50 anexos por acolhido.',
    'Tipos de anexo: Atestado, Receita, Documento ou Outro — classifique cada arquivo ao enviar.',
    'Ao baixar, o sistema gera um link seguro e temporário para o arquivo.',
    'É possível editar o nome e o tipo de um anexo já cadastrado.',
  ]);

  subtitulo('3.7. Motivos de adesão e de desistência');
  paragrafo(
    'O sistema permite cadastrar os motivos que explicam por que um acolhido entrou na comunidade ' +
      '(adesão) e por que interrompeu o tratamento (desistência). Gerencie-os no menu "Motivos" ou ' +
      'pelos atalhos dentro de "Acolhidos".'
  );
  bullets([
    'Motivos de adesão: cadastre, edite e exclua as opções que aparecem no campo "Motivo de adesão" do cadastro de acolhido (obrigatório em todo cadastro).',
    'Motivos de desistência: cadastre as opções do campo "Motivo da desistência", exigido quando a alta é do tipo desistência.',
    'Ao abrir cada lista pela primeira vez, o sistema sugere alguns motivos padrão que você pode ajustar livremente.',
    'Um motivo em uso por algum acolhido não pode ser excluído — troque o motivo do acolhido antes de excluí-lo.',
    'Esses dados alimentam a aba "Motivos" e os gráficos dos relatórios (ver seção 8).',
  ]);

  // 4. Historico
  secao('4. Histórico (arquivo morto)');
  paragrafo(
    'O arquivo morto guarda os acolhidos que já encerraram o acolhimento, sem apagar nenhum dado. ' +
      'Assim a lista principal fica limpa, mas o histórico permanece disponível para consulta.'
  );
  bullets([
    'Arquivo morto: em Histórico → Arquivo morto você vê os acolhidos arquivados, com busca por nome, CPF ou e-mail, e a data em que foram arquivados.',
    'Enviar ao histórico: feito a partir da Lista de acolhidos. Só é permitido para acolhidos que já tiveram alta. Todos os dados (prescrições, administrações, anexos e combinados) são preservados.',
    'Restaurar: devolve o acolhido do arquivo morto para a lista de acolhidos ativos.',
    'Cadastrar no histórico: em Histórico → Cadastrar você registra diretamente no arquivo morto uma pessoa que passou pela comunidade antes do sistema. Nesse caso é obrigatório informar a alta. É possível incluir medicações, combinados e anexos já no cadastro.',
    'Seleção múltipla: marque vários registros para restaurar ou excluir em lote.',
    'Excluir: remove o registro definitivamente. Ação irreversível.',
  ]);

  // 5. Medicamentos
  secao('5. Medicamentos');
  paragrafo(
    'O cadastro de medicamentos alimenta as prescrições dos acolhidos. Em Medicamentos → Lista de ' +
      'medicamentos você vê todos os itens cadastrados; em Cadastrar medicamento você inclui um novo.'
  );
  bullets([
    'Cadastrar / editar / excluir medicamentos a qualquer momento.',
    'Busca por nome na lista de medicamentos.',
    'Seleção múltipla: exclua vários medicamentos de uma vez com os checkboxes.',
    'Os medicamentos cadastrados ficam disponíveis para serem prescritos no cadastro de cada acolhido, com as doses de manhã, tarde e noite.',
  ]);

  // 6. Controle de administracao
  secao('6. Controle de administração de medicamentos');
  paragrafo(
    'É onde a equipe registra, dia a dia, se o acolhido tomou (ou não) cada medicamento prescrito, ' +
      'em cada período. Acesse por Medicamentos → Controle de administração.'
  );
  bullets([
    'Selecione o acolhido, o mês e o ano para abrir a grade do período.',
    'Doses: acima da grade, ajuste quantos comprimidos o acolhido toma em cada período (manhã, tarde, noite) e clique em "Salvar doses".',
    'A grade mostra os dias do mês e os medicamentos com dose definida, separados por Manhã, Tarde e Noite.',
    'Clique em cada célula para marcar se o medicamento foi tomado (Sim/Não) naquele dia e período. Períodos sem dose prescrita aparecem como não aplicáveis.',
    'Esses registros são a base do relatório de controle de administração (seção 8).',
  ]);

  // 7. Combinados
  secao('7. Combinados (saídas)');
  paragrafo(
    'Os combinados registram as saídas e compromissos agendados dos acolhidos. Em Combinados → Lista ' +
      'de combinados você acompanha os registros; em Cadastrar combinado você cria um novo.'
  );
  bullets([
    'Informe o acolhido, o tipo da saída e uma descrição.',
    'Tipos de combinado: Médico, Dentista, Governo, Banco, Detran, Ressocialização com a família e Outro tipo de saída.',
    'Datas: para Ressocialização com a família, informe data de ida e data de volta. Para os demais tipos, informe apenas a data do combinado.',
    'Na lista: busque por nome do acolhido, CPF ou tipo; use Ver para detalhes, Editar, Excluir ou excluir vários selecionados.',
  ]);

  // 8. Relatorios
  secao('8. Relatórios');
  paragrafo(
    'Em Relatórios você acompanha indicadores e pode exportar tudo em PDF. Primeiro selecione o ano; ' +
      'depois escolha a visão desejada nas abas.'
  );
  subtitulo('8.1. Quadro mensal');
  paragrafo(
    'Mostra, mês a mês, quantos acolhidos foram registrados e quantas altas ocorreram, separadas por ' +
      'tipo de alta, com os totais do ano.'
  );
  paragrafo(
    'Abaixo da tabela, o quadro mensal também traz gráficos: barras de acolhidos registrados por mês, ' +
      'barras de altas por mês e a distribuição das altas por tipo.'
  );
  subtitulo('8.2. Acolhidos com alta');
  paragrafo(
    'Lista os acolhidos que tiveram alta no ano escolhido, com data de entrada, data de saída, tempo ' +
      'de permanência (em dias e em meses), o tipo de alta e, nas desistências, o motivo da desistência.'
  );
  subtitulo('8.3. Motivos');
  paragrafo(
    'Reúne, em gráficos de distribuição, os motivos de adesão dos acolhidos registrados no ano e os ' +
      'motivos de desistência das altas por desistência do ano, cada um com a contagem e o percentual.'
  );
  subtitulo('8.4. Controle de administração (somente leitura)');
  paragrafo(
    'Exibe a grade de administração de um acolhido em um mês específico, apenas para consulta. Para ' +
      'registrar tomadas, use a tela de Controle de administração (seção 6).'
  );
  subtitulo('8.5. Exportar em PDF');
  bullets([
    '"Exportar visão (PDF)": gera o PDF apenas da aba que está aberta.',
    '"Exportar todos (PDF)": gera um PDF consolidado com o quadro mensal, os acolhidos com alta e, se houver uma seleção, o controle de administração.',
    'Os PDFs são gerados na nuvem (AWS Lambda) e baixados automaticamente pelo navegador. Enquanto o arquivo é preparado, o botão mostra "Gerando PDF...".',
  ]);

  // 9. Pagina inicial e tutorial
  secao('9. Página inicial e este tutorial');
  paragrafo(
    'A página Início exibe a descrição do sistema, uma saudação e atalhos para as principais áreas. ' +
      'O botão "Ver tutorial completo (PDF)" gera e baixa este documento. Use-o sempre que precisar ' +
      'relembrar como utilizar alguma funcionalidade.'
  );

  // 10. Dicas
  secao('10. Dicas e boas práticas');
  bullets([
    'Mantenha os cadastros sempre atualizados: datas de acolhimento e de alta corretas deixam os relatórios fiéis.',
    'Antes de enviar um acolhido ao histórico, confirme que a alta foi registrada.',
    'Ao excluir ou arquivar, o sistema pede confirmação — leia a mensagem antes de confirmar.',
    'Mensagens de sucesso ou erro aparecem em janelas do próprio sistema; clique em OK para continuar.',
    'Ao terminar de usar, clique em "Sair", principalmente em computadores compartilhados.',
    'Em caso de dúvida, gere novamente este tutorial pelo botão "Ver tutorial completo (PDF)" na página inicial.',
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
