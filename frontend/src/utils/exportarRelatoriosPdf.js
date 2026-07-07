import { relatorioService } from '../api';

// A geracao do PDF em si agora acontece em uma Lambda na AWS (ver
// lambda/relatorios-pdf). Aqui apenas montamos o payload, pedimos o PDF ao
// backend e disparamos o download no navegador. O nome do arquivo continua
// sendo definido no frontend, que possui todos os dados.

const baixarBlob = (blob, nomeArquivo) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

const gerarEbaixar = async (tipo, dados, nomeArquivo) => {
  const blob = await relatorioService.gerarPdf(tipo, dados);
  baixarBlob(blob, nomeArquivo);
};

const slugNome = (nome) =>
  (nome ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 40);

export function exportQuadroMensalPdf(relatorio) {
  return gerarEbaixar(
    'quadro-mensal',
    relatorio,
    `ctav-quadro-mensal-${relatorio.ano}.pdf`
  );
}

export function exportAltasPdf(acolhidosComAlta, ano) {
  return gerarEbaixar(
    'altas',
    { acolhidosComAlta, ano },
    `ctav-acolhidos-alta-${ano}.pdf`
  );
}

export function exportControleAdministracaoPdf(dados) {
  const mesStr = String(dados.mes).padStart(2, '0');
  const nome = slugNome(dados.acolhidoNome) || 'acolhido';
  return gerarEbaixar(
    'controle',
    dados,
    `ctav-controle-admin-${dados.ano}-${mesStr}-${nome}.pdf`
  );
}

export function exportTodosRelatoriosPdf({ relatorio, acolhidosComAlta, controle }) {
  return gerarEbaixar(
    'todos',
    { relatorio, acolhidosComAlta, controle },
    `ctav-relatorios-${relatorio.ano}.pdf`
  );
}

// Tutorial do sistema (documento estatico gerado na Lambda).
export function exportTutorialPdf() {
  return gerarEbaixar('tutorial', {}, 'ctav-tutorial-do-sistema.pdf');
}
