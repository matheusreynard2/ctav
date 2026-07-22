// Geração de PDF dos termos no navegador. Recebe título e parágrafos no mesmo
// formato usado pelo ODF ({ secao }, { rotulo, texto }, { texto }). O jsPDF é
// carregado sob demanda (import dinâmico) para não pesar o carregamento inicial.

const slug = (nome) =>
  (nome ?? 'documento')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60) || 'documento';

export const gerarPdf = async (titulo, paragrafos, opcoes = {}) => {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 56;
  const largura = larguraPagina - margem * 2;
  const alturaLinha = 16;
  let y = margem;

  const quebraDePagina = (proximoY) => {
    if (proximoY > alturaPagina - margem) {
      doc.addPage();
      return margem;
    }
    return proximoY;
  };

  // Escreve uma sequência de "runs" (trechos com/sem negrito) com quebra de
  // linha automática por palavra, respeitando a largura útil da página.
  const escreverRuns = (runs, tamanho) => {
    doc.setFontSize(tamanho);
    const palavras = [];
    runs.forEach((run) => {
      run.text
        .split(/\s+/)
        .filter(Boolean)
        .forEach((palavra) => palavras.push({ palavra, bold: run.bold }));
    });

    let cursorX = margem;
    palavras.forEach(({ palavra, bold }) => {
      doc.setFont('helvetica', bold ? 'bold' : 'normal');
      const larguraPalavra = doc.getTextWidth(palavra);
      const larguraEspaco = doc.getTextWidth(' ');
      if (cursorX > margem && cursorX + larguraPalavra > margem + largura) {
        y = quebraDePagina(y + alturaLinha);
        cursorX = margem;
      }
      doc.text(palavra, cursorX, y);
      cursorX += larguraPalavra + larguraEspaco;
    });
    y += alturaLinha;
  };

  // Título centralizado.
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  const linhasTitulo = doc.splitTextToSize(titulo, largura);
  linhasTitulo.forEach((linha) => {
    const larguraTexto = doc.getTextWidth(linha);
    doc.text(linha, (larguraPagina - larguraTexto) / 2, y);
    y += 20;
  });
  y += 8;

  paragrafos.forEach((p) => {
    if (p.secao) {
      y = quebraDePagina(y + 6);
      escreverRuns([{ text: p.secao, bold: true }], 12);
      return;
    }
    if (p.rotulo) {
      escreverRuns(
        [
          { text: `${p.rotulo} `, bold: true },
          { text: p.texto, bold: false },
        ],
        11
      );
    } else {
      escreverRuns([{ text: p.texto, bold: false }], 11);
    }
    y += 4;
  });

  // Data do acolhimento (quando preenchida).
  if (opcoes.data) {
    y = quebraDePagina(y + 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Data do acolhimento: ', margem, y);
    const larguraRotulo = doc.getTextWidth('Data do acolhimento: ');
    doc.setFont('helvetica', 'normal');
    doc.text(String(opcoes.data), margem + larguraRotulo, y);
  }

  // Espaço e linhas de assinatura (com a imagem embutida, quando houver).
  const linhaLargura = 220;
  const desenharAssinatura = (rotulo, nome, imagemUrl) => {
    y = quebraDePagina(y + 64);
    if (imagemUrl) {
      try {
        doc.addImage(imagemUrl, 'PNG', margem, y - 46, 180, 44);
      } catch {
        // Ignora imagem inválida: mantém apenas a linha de assinatura.
      }
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.line(margem, y, margem + linhaLargura, y);
    doc.text(`${rotulo}${nome ? ` — ${nome}` : ''}`, margem, y + 16);
  };

  desenharAssinatura(
    'Assinatura do acolhido',
    opcoes.nomeAcolhido,
    opcoes.assinaturaAcolhidoUrl
  );
  desenharAssinatura(
    'Assinatura do responsável',
    opcoes.nomeResponsavel,
    opcoes.assinaturaResponsavelUrl
  );

  return doc;
};

export const baixarPdf = async (titulo, paragrafos, nomeArquivo, opcoes = {}) => {
  const doc = await gerarPdf(titulo, paragrafos, opcoes);
  doc.save(nomeArquivo || `${slug(titulo)}.pdf`);
};
