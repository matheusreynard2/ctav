// Utilidades do agendamento de consultas: status, formatação e o cálculo dos
// avisos de consultas próximas exibidos no login.

export const STATUS_CONSULTA = [
  { valor: 'AGENDADA', rotulo: 'Agendada' },
  { valor: 'REALIZADA', rotulo: 'Realizada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
];

export function rotuloStatusConsulta(status) {
  const item = STATUS_CONSULTA.find((s) => s.valor === status);
  return item ? item.rotulo : status || '-';
}

export function formatarDataHoraConsulta(valor) {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

const anoDeIso = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getFullYear();
};

const mesDeIso = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.getMonth();
};

const mapaParaDistribuicao = (mapa) =>
  [...mapa.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

/**
 * Lista os anos com consultas cadastradas (mais recente primeiro).
 */
export function anosComConsultas(consultas = []) {
  const anos = new Set();
  (Array.isArray(consultas) ? consultas : []).forEach((c) => {
    const ano = anoDeIso(c.dataHora);
    if (ano) anos.add(ano);
  });
  return [...anos].sort((a, b) => b - a);
}

/**
 * Consolida as métricas de consultas para o relatório (resumo, distribuições,
 * séries por mês/ano e a lista ordenada). Quando `ano` é vazio/inválido,
 * considera todas as consultas.
 */
export function calcularMetricasConsultas(consultas = [], ano) {
  const lista = Array.isArray(consultas) ? consultas : [];
  const anoNum = Number(ano);
  const filtradas = anoNum
    ? lista.filter((c) => anoDeIso(c.dataHora) === anoNum)
    : lista;

  let agendadas = 0;
  let realizadas = 0;
  let canceladas = 0;
  const situacaoMapa = new Map();
  const profissionalMapa = new Map();
  const acolhidoMapa = new Map();
  const porMesVetor = Array(12).fill(0);
  const porAnoMapa = new Map();

  filtradas.forEach((c) => {
    const status = c.status ?? 'AGENDADA';
    if (status === 'AGENDADA') agendadas += 1;
    else if (status === 'REALIZADA') realizadas += 1;
    else if (status === 'CANCELADA') canceladas += 1;

    const rotuloStatus = rotuloStatusConsulta(status);
    situacaoMapa.set(rotuloStatus, (situacaoMapa.get(rotuloStatus) ?? 0) + 1);

    const prof = (c.profissional || '').trim() || 'Não informado';
    profissionalMapa.set(prof, (profissionalMapa.get(prof) ?? 0) + 1);

    const acolhido = (c.acolhidoNome || '').trim() || 'Sem acolhido';
    acolhidoMapa.set(acolhido, (acolhidoMapa.get(acolhido) ?? 0) + 1);

    const mes = mesDeIso(c.dataHora);
    if (mes != null) porMesVetor[mes] += 1;
    const anoC = anoDeIso(c.dataHora);
    if (anoC) porAnoMapa.set(anoC, (porAnoMapa.get(anoC) ?? 0) + 1);
  });

  const porAno = [...porAnoMapa.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([a, valor]) => ({ rotulo: String(a), valor }));

  const consultasOrdenadas = [...filtradas].sort((a, b) =>
    String(b.dataHora ?? '').localeCompare(String(a.dataHora ?? ''))
  );

  return {
    filtradas,
    consultasOrdenadas,
    total: filtradas.length,
    agendadas,
    realizadas,
    canceladas,
    situacao: mapaParaDistribuicao(situacaoMapa),
    profissionais: mapaParaDistribuicao(profissionalMapa).slice(0, 8),
    acolhidos: mapaParaDistribuicao(acolhidoMapa).slice(0, 8),
    porMes: porMesVetor.map((valor, i) => ({ rotulo: MESES_CURTOS[i], valor })),
    porAno,
  };
}

const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;

// Classifica quanto tempo falta para a consulta e define a cor do aviso.
// Ordem importa: da faixa mais urgente para a menos urgente.
const FAIXAS = [
  { limite: 15 * MINUTO, faixa: '15min', rotulo: 'Em 15 minutos ou menos', nivel: 'critico' },
  { limite: 1 * HORA, faixa: '1h', rotulo: 'Na próxima 1 hora', nivel: 'critico' },
  { limite: 2 * HORA, faixa: '2h', rotulo: 'Nas próximas 2 horas', nivel: 'alerta' },
  { limite: 3 * HORA, faixa: '3h', rotulo: 'Nas próximas 3 horas', nivel: 'alerta' },
  { limite: 24 * HORA, faixa: '24h', rotulo: 'Nas próximas 24 horas', nivel: 'info' },
];

function classificarFaixa(diffMs) {
  return FAIXAS.find((f) => diffMs <= f.limite) || null;
}

/**
 * Retorna as consultas AGENDADAS que ocorrerão da hora atual até as próximas
 * 24 horas, anotadas com a faixa de urgência (15min/1h/2h/3h/24h) e o nível
 * de cor (critico/alerta/info). Consultas passadas, realizadas ou canceladas
 * são ignoradas. Resultado ordenado da mais próxima para a mais distante.
 */
export function filtrarConsultasProximas(consultas = [], referencia = new Date()) {
  const agora = referencia instanceof Date ? referencia : new Date(referencia);
  const agoraMs = agora.getTime();

  return (Array.isArray(consultas) ? consultas : [])
    .filter((c) => c && c.dataHora && (c.status ?? 'AGENDADA') === 'AGENDADA')
    .map((c) => {
      const quando = new Date(c.dataHora);
      const diffMs = quando.getTime() - agoraMs;
      return { consulta: c, quando, diffMs };
    })
    .filter((item) => !Number.isNaN(item.quando.getTime()) && item.diffMs >= 0)
    .map((item) => {
      const faixa = classificarFaixa(item.diffMs);
      if (!faixa) return null;
      return {
        chave: `consulta-${item.consulta.id}`,
        id: item.consulta.id,
        acolhidoNome: item.consulta.acolhidoNome,
        descricao: item.consulta.descricao,
        profissional: item.consulta.profissional,
        local: item.consulta.local,
        dataHora: item.consulta.dataHora,
        diffMs: item.diffMs,
        faixa: faixa.faixa,
        faixaRotulo: faixa.rotulo,
        nivel: faixa.nivel,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.diffMs - b.diffMs);
}
