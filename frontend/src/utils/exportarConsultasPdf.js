// Geração client-side (jsPDF) do relatório de consultas. Diferente dos demais
// relatórios (gerados numa Lambda), este é montado inteiramente no navegador
// para não depender de alterações no backend/Lambda.

const CORES = ['#2563eb', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#0ea5e9'];

const hexParaRgb = (hex) => {
  const h = hex.replace('#', '');
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

export async function exportarConsultasPdf(dados) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const larguraPagina = doc.internal.pageSize.getWidth();
  const alturaPagina = doc.internal.pageSize.getHeight();
  const margem = 48;
  const largura = larguraPagina - margem * 2;
  let y = margem;

  const garantirEspaco = (altura) => {
    if (y + altura > alturaPagina - margem) {
      doc.addPage();
      y = margem;
    }
  };

  const escreverTexto = (texto, tamanho, estilo = 'normal', cor = [30, 41, 59]) => {
    doc.setFont('helvetica', estilo);
    doc.setFontSize(tamanho);
    doc.setTextColor(cor[0], cor[1], cor[2]);
    const linhas = doc.splitTextToSize(String(texto ?? ''), largura);
    linhas.forEach((linha) => {
      garantirEspaco(tamanho + 4);
      doc.text(linha, margem, y);
      y += tamanho + 4;
    });
  };

  // Cabeçalho.
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, larguraPagina, 70, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Relatório de Consultas', margem, 34);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(dados.subtitulo || '', margem, 52);
  y = 92;

  escreverTexto(`Gerado em: ${dados.geradoEm}`, 9, 'normal', [100, 116, 139]);
  y += 6;

  // Resumo.
  escreverTexto('Resumo', 13, 'bold');
  y += 2;
  const { total, agendadas, realizadas, canceladas } = dados.resumo;
  escreverTexto(
    `Total de consultas: ${total}  •  Agendadas: ${agendadas}  •  Realizadas: ${realizadas}  •  Canceladas: ${canceladas}`,
    10
  );
  y += 8;

  // Gráfico de barras.
  const barras = dados.barras;
  if (barras && barras.dados.length > 0) {
    escreverTexto(barras.titulo, 12, 'bold');
    y += 4;
    const alturaGrafico = 120;
    garantirEspaco(alturaGrafico + 30);
    const baseY = y + alturaGrafico;
    const maxValor = Math.max(1, ...barras.dados.map((d) => Number(d.valor) || 0));
    const gap = 6;
    const larguraBarra = (largura - gap * (barras.dados.length - 1)) / barras.dados.length;
    const [r, g, b] = hexParaRgb('#2563eb');
    barras.dados.forEach((d, i) => {
      const valor = Number(d.valor) || 0;
      const h = (valor / maxValor) * alturaGrafico;
      const x = margem + i * (larguraBarra + gap);
      doc.setFillColor(r, g, b);
      doc.rect(x, baseY - h, larguraBarra, h, 'F');
      doc.setFontSize(7);
      doc.setTextColor(30, 41, 59);
      doc.setFont('helvetica', 'normal');
      if (valor > 0) doc.text(String(valor), x + larguraBarra / 2, baseY - h - 3, { align: 'center' });
      doc.setTextColor(100, 116, 139);
      doc.text(String(d.rotulo), x + larguraBarra / 2, baseY + 12, { align: 'center' });
    });
    doc.setDrawColor(203, 213, 225);
    doc.line(margem, baseY, margem + largura, baseY);
    y = baseY + 26;
  }

  // Distribuições (situação, profissional, acolhido).
  (dados.distribuicoes || []).forEach((dist) => {
    if (!dist.itens || dist.itens.length === 0) return;
    escreverTexto(dist.titulo, 12, 'bold');
    y += 2;
    const totalDist = dist.itens.reduce((s, it) => s + (Number(it.valor) || 0), 0) || 1;
    const maxDist = Math.max(1, ...dist.itens.map((it) => Number(it.valor) || 0));
    dist.itens.forEach((it, i) => {
      garantirEspaco(18);
      const valor = Number(it.valor) || 0;
      const pct = Math.round((valor / totalDist) * 100);
      const rotulo = doc.splitTextToSize(String(it.rotulo), 160)[0];
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(rotulo, margem, y + 9);
      const trilhaX = margem + 170;
      const trilhaLargura = largura - 170 - 70;
      doc.setFillColor(226, 232, 240);
      doc.rect(trilhaX, y, trilhaLargura, 10, 'F');
      const [r, g, b] = hexParaRgb(CORES[i % CORES.length]);
      doc.setFillColor(r, g, b);
      doc.rect(trilhaX, y, (valor / maxDist) * trilhaLargura, 10, 'F');
      doc.setTextColor(100, 116, 139);
      doc.text(`${valor} (${pct}%)`, trilhaX + trilhaLargura + 6, y + 9);
      y += 16;
    });
    y += 8;
  });

  // Tabela de consultas.
  if (dados.tabela && dados.tabela.length > 0) {
    escreverTexto('Consultas', 12, 'bold');
    y += 4;
    const colunas = [
      { rotulo: 'Acolhido', largura: largura * 0.28 },
      { rotulo: 'Data e hora', largura: largura * 0.22 },
      { rotulo: 'Profissional', largura: largura * 0.28 },
      { rotulo: 'Situação', largura: largura * 0.22 },
    ];
    const desenharCabecalho = () => {
      doc.setFillColor(37, 99, 235);
      doc.rect(margem, y, largura, 18, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      let x = margem + 4;
      colunas.forEach((c) => {
        doc.text(c.rotulo, x, y + 12);
        x += c.largura;
      });
      y += 18;
    };
    garantirEspaco(40);
    desenharCabecalho();
    dados.tabela.forEach((linha, idx) => {
      garantirEspaco(18);
      if (y === margem) desenharCabecalho();
      if (idx % 2 === 1) {
        doc.setFillColor(241, 245, 249);
        doc.rect(margem, y, largura, 16, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      const valores = [linha.acolhido, linha.dataHora, linha.profissional, linha.situacao];
      let x = margem + 4;
      colunas.forEach((c, i) => {
        const texto = doc.splitTextToSize(String(valores[i] ?? '-'), c.largura - 6)[0] || '-';
        doc.text(texto, x, y + 11);
        x += c.largura;
      });
      y += 16;
    });
  }

  doc.save(dados.nomeArquivo || 'ctav-relatorio-consultas.pdf');
}
