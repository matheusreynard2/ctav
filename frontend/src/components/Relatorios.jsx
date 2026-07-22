import { useEffect, useMemo, useState } from 'react';
import { administracaoService } from '../api';
import { TIPOS_ALTA, rotuloTipoAlta } from '../utils/altas';
import {
  calcularMetricasConsultas,
  formatarDataHoraConsulta,
  rotuloStatusConsulta,
} from '../utils/consultas';
import { exportarConsultasPdf } from '../utils/exportarConsultasPdf';
import {
  MESES_CONTROLE,
  diasDoMes,
  mapaRegistrosAdministracao,
  prescricoesComDose,
  rotuloMesAno,
} from '../utils/controleMedicamentos';
import {
  exportAltasPdf,
  exportControleAdministracaoPdf,
  exportQuadroMensalPdf,
  exportTodosRelatoriosPdf,
} from '../utils/exportarRelatoriosPdf';
import GradeControleAdministracao from './GradeControleAdministracao';
import RelatorioConsultas from './RelatorioConsultas';
import {
  GraficoBarras,
  GraficoDistribuicao,
  PALETA_GRAFICOS,
} from './GraficosRelatorio';

// Converte um Map(nome -> contagem) numa lista ordenada por valor (desc).
const mapaParaDistribuicao = (mapa) =>
  [...mapa.entries()]
    .map(([rotulo, valor]) => ({ rotulo, valor }))
    .sort((a, b) => b.valor - a.valor);

const MESES = [
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

const partesData = (iso) => {
  if (!iso || typeof iso !== 'string' || iso.length < 7) return null;
  const ano = Number(iso.slice(0, 4));
  const mes = Number(iso.slice(5, 7));
  if (!Number.isInteger(ano) || !Number.isInteger(mes) || mes < 1 || mes > 12) {
    return null;
  }
  return { ano, mes };
};

const vetorZeros = () => Array(12).fill(0);

const formatarData = (iso) => {
  if (!iso || typeof iso !== 'string' || iso.length < 10) return '-';
  const [ano, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const calcularPermanencia = (entradaIso, saidaIso) => {
  const e = entradaIso?.slice(0, 10).split('-').map(Number);
  const s = saidaIso?.slice(0, 10).split('-').map(Number);
  if (!e || !s || e.length !== 3 || s.length !== 3 || e.some(Number.isNaN) || s.some(Number.isNaN)) {
    return null;
  }
  const [ay, am, ad] = e;
  const [by, bm, bd] = s;
  const dias = Math.round(
    (Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86400000
  );
  if (dias < 0) return { dias, meses: 0, diasRestantes: 0 };

  let meses = (by - ay) * 12 + (bm - am);
  let diasRestantes = bd - ad;
  if (diasRestantes < 0) {
    meses -= 1;
    const diasMesAnterior = new Date(by, bm - 1, 0).getDate();
    diasRestantes += diasMesAnterior;
  }
  return { dias, meses, diasRestantes };
};

const textoMeses = (perm) => {
  if (!perm) return '-';
  const { meses, diasRestantes } = perm;
  const parteMes = `${meses} ${meses === 1 ? 'mês' : 'meses'}`;
  if (diasRestantes <= 0) return parteMes;
  const parteDia = `${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`;
  return `${parteMes} e ${parteDia}`;
};

// Faixas usadas para distribuir a permanência (em dias) na aba Gráficos.
const FAIXAS_PERMANENCIA = [
  { rotulo: 'Até 1 mês', min: 0, max: 30 },
  { rotulo: '1 a 3 meses', min: 31, max: 90 },
  { rotulo: '3 a 6 meses', min: 91, max: 180 },
  { rotulo: '6 meses a 1 ano', min: 181, max: 365 },
  { rotulo: 'Mais de 1 ano', min: 366, max: Infinity },
];

// Faixas etárias (em anos completos) usadas nos gráficos demográficos.
const FAIXAS_ETARIAS = [
  { rotulo: '0 a 17', min: 0, max: 17 },
  { rotulo: '18 a 24', min: 18, max: 24 },
  { rotulo: '25 a 34', min: 25, max: 34 },
  { rotulo: '35 a 44', min: 35, max: 44 },
  { rotulo: '45 a 59', min: 45, max: 59 },
  { rotulo: '60 ou mais', min: 60, max: Infinity },
];

const rotuloSexo = (s) =>
  s === 'MASCULINO'
    ? 'Masculino'
    : s === 'FEMININO'
    ? 'Feminino'
    : s === 'OUTRO'
    ? 'Outro'
    : 'Não informado';

// Idade em anos completos a partir de uma data ISO (yyyy-mm-dd).
const calcularIdade = (iso) => {
  const p = iso?.slice(0, 10).split('-').map(Number);
  if (!p || p.length !== 3 || p.some(Number.isNaN)) return null;
  const [ano, mes, dia] = p;
  const hoje = new Date();
  let idade = hoje.getFullYear() - ano;
  const diffMes = hoje.getMonth() + 1 - mes;
  if (diffMes < 0 || (diffMes === 0 && hoje.getDate() < dia)) idade -= 1;
  return idade >= 0 ? idade : null;
};

// Converte a média (em dias) para um texto amigável em meses e dias.
const textoMediaDias = (dias) => {
  if (dias == null || dias < 0) return '-';
  const meses = Math.floor(dias / 30);
  const diasRestantes = dias % 30;
  const partes = [];
  if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);
  if (diasRestantes > 0 || meses === 0) {
    partes.push(`${diasRestantes} ${diasRestantes === 1 ? 'dia' : 'dias'}`);
  }
  return partes.join(' e ');
};

export default function Relatorios({
  acolhidos = [],
  consultas = [],
  podeConsultas = false,
  carregando = false,
  onErro,
}) {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  const anosDisponiveis = useMemo(() => {
    const anos = new Set();
    acolhidos.forEach((a) => {
      const acolhimento = partesData(a.dataAcolhimentoCtav);
      if (acolhimento) anos.add(acolhimento.ano);
      if (a.alta) {
        const alta = partesData(a.dataAlta);
        if (alta) anos.add(alta.ano);
      }
    });
    // Inclui os anos com consultas para que o seletor geral também sirva ao
    // relatório de consultas.
    if (podeConsultas) {
      (Array.isArray(consultas) ? consultas : []).forEach((c) => {
        const d = c?.dataHora ? new Date(c.dataHora) : null;
        if (d && !Number.isNaN(d.getTime())) anos.add(d.getFullYear());
      });
    }
    return [...anos].sort((x, y) => y - x);
  }, [acolhidos, consultas, podeConsultas]);

  const acolhidosOrdenados = useMemo(
    () => [...acolhidos].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')),
    [acolhidos]
  );

  const [anoSelecionado, setAnoSelecionado] = useState('');
  const [visao, setVisao] = useState('mensal');
  const [mesAdmin, setMesAdmin] = useState(String(mesAtual));
  const [acolhidoAdminId, setAcolhidoAdminId] = useState('');
  const [registrosAdmin, setRegistrosAdmin] = useState({});
  const [carregandoAdmin, setCarregandoAdmin] = useState(false);
  const [exportando, setExportando] = useState(false);

  const relatorio = useMemo(() => {
    const ano = Number(anoSelecionado);
    if (!ano) return null;

    const registrados = vetorZeros();
    const altasPorTipo = new Map(TIPOS_ALTA.map((t) => [t.valor, vetorZeros()]));
    const totalAltas = vetorZeros();
    const motivosAdesaoMapa = new Map();
    const motivosDesistenciaMapa = new Map();

    acolhidos.forEach((a) => {
      const acolhimento = partesData(a.dataAcolhimentoCtav);
      if (acolhimento && acolhimento.ano === ano) {
        registrados[acolhimento.mes - 1] += 1;
        const motivo = a.motivoAdesaoNome || 'Não informado';
        motivosAdesaoMapa.set(motivo, (motivosAdesaoMapa.get(motivo) ?? 0) + 1);
      }

      if (a.alta) {
        const alta = partesData(a.dataAlta);
        if (alta && alta.ano === ano) {
          totalAltas[alta.mes - 1] += 1;
          const vetor = altasPorTipo.get(a.tipoAlta);
          if (vetor) vetor[alta.mes - 1] += 1;
          if (a.tipoAlta === 'DESISTENCIA') {
            const motivo = a.motivoDesistenciaNome || 'Não informado';
            motivosDesistenciaMapa.set(
              motivo,
              (motivosDesistenciaMapa.get(motivo) ?? 0) + 1
            );
          }
        }
      }
    });

    const somar = (vetor) => vetor.reduce((acc, n) => acc + n, 0);

    return {
      ano,
      registrados,
      registradosTotal: somar(registrados),
      linhasAlta: TIPOS_ALTA.map((t) => {
        const vetor = altasPorTipo.get(t.valor);
        return { ...t, vetor, total: somar(vetor) };
      }),
      totalAltas,
      totalAltasAno: somar(totalAltas),
      motivosAdesao: mapaParaDistribuicao(motivosAdesaoMapa),
      motivosDesistencia: mapaParaDistribuicao(motivosDesistenciaMapa),
    };
  }, [acolhidos, anoSelecionado]);

  const acolhidosComAlta = useMemo(() => {
    const ano = Number(anoSelecionado);
    if (!ano) return [];

    return acolhidos
      .filter((a) => {
        if (!a.alta) return false;
        const alta = partesData(a.dataAlta);
        return alta && alta.ano === ano;
      })
      .map((a) => ({
        id: a.id,
        nome: a.nome,
        cpf: a.cpf,
        entrada: a.dataAcolhimentoCtav,
        saida: a.dataAlta,
        permanencia: calcularPermanencia(a.dataAcolhimentoCtav, a.dataAlta),
        tipoAltaRotulo: a.tipoAltaRotulo ?? rotuloTipoAlta(a.tipoAlta),
        motivoDesistencia:
          a.tipoAlta === 'DESISTENCIA' ? a.motivoDesistenciaNome ?? '-' : '-',
      }))
      .sort((x, y) => (x.saida ?? '').localeCompare(y.saida ?? ''));
  }, [acolhidos, anoSelecionado]);

  // Média de permanência: considera apenas as altas do ano que possuem data de
  // entrada E data de saída (permanência calculável e não negativa). Também
  // distribui essas permanências em faixas para exibição em porcentagem.
  const mediaPermanencia = useMemo(() => {
    const validos = acolhidosComAlta.filter(
      (a) => a.permanencia && Number.isFinite(a.permanencia.dias) && a.permanencia.dias >= 0
    );

    const contagemFaixas = FAIXAS_PERMANENCIA.map((faixa) => ({
      rotulo: faixa.rotulo,
      valor: 0,
    }));

    let totalDias = 0;
    validos.forEach((a) => {
      const dias = a.permanencia.dias;
      totalDias += dias;
      const indice = FAIXAS_PERMANENCIA.findIndex(
        (faixa) => dias >= faixa.min && dias <= faixa.max
      );
      if (indice >= 0) contagemFaixas[indice].valor += 1;
    });

    const quantidade = validos.length;
    const mediaDias = quantidade ? Math.round(totalDias / quantidade) : 0;

    return {
      quantidade,
      mediaDias,
      faixas: contagemFaixas,
    };
  }, [acolhidosComAlta]);

  // Conjunto ampliado de gráficos: demografia dos registrados no ano e um
  // panorama geral (situação, convênio, ocupação e medicamentos) de toda a base.
  const graficos = useMemo(() => {
    const ano = Number(anoSelecionado);
    if (!ano) return null;

    const registradosAno = acolhidos.filter((a) => {
      const ac = partesData(a.dataAcolhimentoCtav);
      return ac && ac.ano === ano;
    });

    const contarMapa = (lista, fn) => {
      const mapa = new Map();
      lista.forEach((a) => {
        const chave = fn(a);
        if (chave == null) return;
        mapa.set(chave, (mapa.get(chave) ?? 0) + 1);
      });
      return mapa;
    };

    const distribuirFaixas = (lista, faixas, valorFn) =>
      faixas.map((f) => ({
        rotulo: f.rotulo,
        valor: lista.filter((a) => {
          const v = valorFn(a);
          return v != null && v >= f.min && v <= f.max;
        }).length,
      }));

    const sexoAno = mapaParaDistribuicao(
      contarMapa(registradosAno, (a) => rotuloSexo(a.sexo))
    );
    const faixaEtariaAno = distribuirFaixas(
      registradosAno,
      FAIXAS_ETARIAS,
      (a) => calcularIdade(a.dataNascimento)
    );

    // Panorama geral considera todos os acolhidos (ativos + histórico).
    const ativos = acolhidos.filter((a) => !a.arquivado);
    const situacao = [
      { rotulo: 'Ativos', valor: ativos.length },
      { rotulo: 'No histórico', valor: acolhidos.length - ativos.length },
    ];

    const conveniados = acolhidos.filter((a) => a.responsavelConveniado).length;
    const vinculo = [
      { rotulo: 'Com responsável conveniado', valor: conveniados },
      {
        rotulo: 'Sem convênio / sem responsável',
        valor: acolhidos.length - conveniados,
      },
    ];

    const ocupacaoQuarto = mapaParaDistribuicao(
      contarMapa(
        ativos.filter(
          (a) => a.quarto != null && String(a.quarto).trim() !== ''
        ),
        (a) => `Quarto ${String(a.quarto).trim()}`
      )
    );

    const medMapa = new Map();
    acolhidos.forEach((a) => {
      (a.prescricoes ?? []).forEach((p) => {
        const nome = p.medicamentoNome?.trim();
        if (!nome) return;
        medMapa.set(nome, (medMapa.get(nome) ?? 0) + 1);
      });
    });
    const medicamentos = mapaParaDistribuicao(medMapa).slice(0, 10);

    return {
      sexoAno,
      faixaEtariaAno,
      situacao,
      vinculo,
      ocupacaoQuarto,
      medicamentos,
    };
  }, [acolhidos, anoSelecionado]);

  const acolhidoAdmin = useMemo(
    () =>
      acolhidosOrdenados.find((a) => String(a.id) === String(acolhidoAdminId)) ??
      null,
    [acolhidosOrdenados, acolhidoAdminId]
  );

  const prescricoesAdmin = useMemo(
    () => prescricoesComDose(acolhidoAdmin),
    [acolhidoAdmin]
  );

  const diasAdmin = useMemo(() => {
    const ano = Number(anoSelecionado);
    const mes = Number(mesAdmin);
    if (!ano || !mes) return [];
    return diasDoMes(ano, mes);
  }, [anoSelecionado, mesAdmin]);

  const rotuloAdmin = useMemo(
    () => rotuloMesAno(Number(anoSelecionado), Number(mesAdmin)),
    [anoSelecionado, mesAdmin]
  );

  useEffect(() => {
    let ativo = true;
    const ano = Number(anoSelecionado);
    const mes = Number(mesAdmin);
    if (visao !== 'administracao' || !acolhidoAdminId || !ano || !mes) {
      setRegistrosAdmin({});
      return () => {
        ativo = false;
      };
    }
    setCarregandoAdmin(true);
    administracaoService
      .listarMes(acolhidoAdminId, ano, mes)
      .then((lista) => {
        if (!ativo) return;
        setRegistrosAdmin(mapaRegistrosAdministracao(lista));
      })
      .catch(() => {
        if (!ativo) return;
        setRegistrosAdmin({});
        onErro?.('Não foi possível carregar o controle de administração.');
      })
      .finally(() => {
        if (ativo) setCarregandoAdmin(false);
      });
    return () => {
      ativo = false;
    };
  }, [visao, acolhidoAdminId, anoSelecionado, mesAdmin, onErro]);

  const controlePronto =
    acolhidoAdminId &&
    prescricoesAdmin.length > 0 &&
    diasAdmin.length > 0 &&
    !carregandoAdmin;

  const dadosControlePdf = controlePronto
    ? {
        ano: Number(anoSelecionado),
        mes: Number(mesAdmin),
        acolhidoNome: acolhidoAdmin.nome,
        dias: diasAdmin,
        prescricoesComDose: prescricoesAdmin,
        registros: registrosAdmin,
      }
    : null;

  // Consultas podem ser exportadas mesmo sem ano selecionado (todos os anos).
  const podeExportarConsultas =
    podeConsultas && Array.isArray(consultas) && consultas.length > 0;

  const exportarConsultasComFiltro = () => {
    const metricas = calcularMetricasConsultas(consultas, anoSelecionado);
    const usarPorMes = !!Number(anoSelecionado);
    return exportarConsultasPdf({
      subtitulo: anoSelecionado ? String(anoSelecionado) : 'Todos os anos',
      geradoEm: new Date().toLocaleString('pt-BR'),
      resumo: {
        total: metricas.total,
        agendadas: metricas.agendadas,
        realizadas: metricas.realizadas,
        canceladas: metricas.canceladas,
      },
      barras: usarPorMes
        ? { titulo: `Consultas por mês (${anoSelecionado})`, dados: metricas.porMes }
        : { titulo: 'Consultas por ano', dados: metricas.porAno },
      distribuicoes: [
        { titulo: 'Por situação', itens: metricas.situacao },
        { titulo: 'Por profissional', itens: metricas.profissionais },
        { titulo: 'Por acolhido', itens: metricas.acolhidos },
      ],
      tabela: metricas.consultasOrdenadas.map((c) => ({
        acolhido: c.acolhidoNome ?? '-',
        dataHora: formatarDataHoraConsulta(c.dataHora),
        profissional: c.profissional || '-',
        situacao: rotuloStatusConsulta(c.status),
      })),
      nomeArquivo: `ctav-relatorio-consultas-${anoSelecionado || 'geral'}.pdf`,
    });
  };

  const exportarComFeedback = async (acao) => {
    if (exportando) return;
    setExportando(true);
    try {
      await acao();
    } catch (e) {
      onErro?.(e?.message || 'Não foi possível gerar o PDF do relatório. Tente novamente.');
    } finally {
      setExportando(false);
    }
  };

  const exportarVisaoAtual = () =>
    exportarComFeedback(() => {
      if (visao === 'consultas') return exportarConsultasComFiltro();
      if (!relatorio) return Promise.resolve();
      if (visao === 'mensal') return exportQuadroMensalPdf(relatorio);
      if (visao === 'altas') return exportAltasPdf(acolhidosComAlta, relatorio.ano);
      if (dadosControlePdf) return exportControleAdministracaoPdf(dadosControlePdf);
      return Promise.resolve();
    });

  const exportarTodos = () =>
    exportarComFeedback(async () => {
      if (relatorio) {
        await exportTodosRelatoriosPdf({
          relatorio,
          acolhidosComAlta,
          controle: dadosControlePdf,
        });
      }
      if (podeExportarConsultas) {
        await exportarConsultasComFiltro();
      }
    });

  return (
    <section className="card relatorios">
      <div className="relatorios-cabecalho">
        <div>
          <h2>Relatórios</h2>
          <p className="relatorios-subtitulo">
            Selecione um ano e a visão desejada para acompanhar os acolhidos
            registrados, as altas por tipo, o tempo de permanência e o controle
            de administração de medicamentos.
          </p>
        </div>
        {((anoSelecionado && relatorio) ||
          (visao === 'consultas' && podeExportarConsultas)) && (
          <div className="relatorios-acoes">
            <button
              type="button"
              className="btn btn-secundario btn-pequeno"
              onClick={exportarVisaoAtual}
              disabled={
                exportando ||
                (visao === 'administracao' && !dadosControlePdf) ||
                (visao === 'consultas' && !podeExportarConsultas)
              }
            >
              {exportando ? 'Gerando PDF...' : 'Exportar visão (PDF)'}
            </button>
            <button
              type="button"
              className="btn btn-primario btn-pequeno"
              onClick={exportarTodos}
              disabled={exportando}
            >
              {exportando ? 'Gerando PDF...' : 'Exportar todos (PDF)'}
            </button>
          </div>
        )}
      </div>

      {carregando ? (
        <p className="vazio">Carregando dados...</p>
      ) : anosDisponiveis.length === 0 && !(podeConsultas && consultas.length > 0) ? (
        <p className="vazio">
          Ainda não há dados suficientes para gerar relatórios.
        </p>
      ) : (
        <>
          <div className="relatorios-filtros">
            <div className="relatorios-filtros-campos">
              <div className="campo">
                <label htmlFor="relatorio-ano">Ano</label>
                <select
                  id="relatorio-ano"
                  value={anoSelecionado}
                  onChange={(e) => setAnoSelecionado(e.target.value)}
                >
                  <option value="">Selecione o ano...</option>
                  {anosDisponiveis.map((ano) => (
                    <option key={ano} value={ano}>
                      {ano}
                      {ano === anoAtual ? ' (ano vigente)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {visao === 'administracao' && anoSelecionado && (
                <>
                  <div className="campo">
                    <label htmlFor="relatorio-mes-admin">Mês</label>
                    <select
                      id="relatorio-mes-admin"
                      value={mesAdmin}
                      onChange={(e) => setMesAdmin(e.target.value)}
                    >
                      {MESES_CONTROLE.map((m) => (
                        <option key={m.valor} value={m.valor}>
                          {m.rotulo}
                          {Number(anoSelecionado) === anoAtual &&
                          m.valor === mesAtual
                            ? ' (mês vigente)'
                            : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="campo">
                    <label htmlFor="relatorio-acolhido-admin">Acolhido</label>
                    <select
                      id="relatorio-acolhido-admin"
                      value={acolhidoAdminId}
                      onChange={(e) => setAcolhidoAdminId(e.target.value)}
                    >
                      <option value="">Selecione o acolhido...</option>
                      {acolhidosOrdenados.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nome}
                          {a.cpf ? ` — CPF ${a.cpf}` : ''}
                          {a.quarto ? ` — Quarto ${a.quarto}` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            <div className="relatorios-visoes" role="tablist" aria-label="Tipo de visão">
              <button
                type="button"
                role="tab"
                aria-selected={visao === 'mensal'}
                className={`relatorios-visao-btn ${visao === 'mensal' ? 'ativo' : ''}`}
                onClick={() => setVisao('mensal')}
              >
                Quadro mensal
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visao === 'altas'}
                className={`relatorios-visao-btn ${visao === 'altas' ? 'ativo' : ''}`}
                onClick={() => setVisao('altas')}
              >
                Acolhidos com alta
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visao === 'graficos'}
                className={`relatorios-visao-btn ${visao === 'graficos' ? 'ativo' : ''}`}
                onClick={() => setVisao('graficos')}
              >
                Gráficos
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={visao === 'administracao'}
                className={`relatorios-visao-btn ${visao === 'administracao' ? 'ativo' : ''}`}
                onClick={() => setVisao('administracao')}
              >
                Controle de administração
              </button>
              {podeConsultas && (
                <button
                  type="button"
                  role="tab"
                  aria-selected={visao === 'consultas'}
                  className={`relatorios-visao-btn ${visao === 'consultas' ? 'ativo' : ''}`}
                  onClick={() => setVisao('consultas')}
                >
                  Consultas
                </button>
              )}
            </div>
          </div>

          {visao === 'consultas' && podeConsultas ? (
            <RelatorioConsultas
              consultas={consultas}
              anoSelecionado={anoSelecionado}
            />
          ) : !anoSelecionado ? (
            <p className="vazio">
              Escolha um ano no seletor acima para abrir o quadro.
            </p>
          ) : visao === 'mensal' ? (
            <div className="relatorio-quadro">
              <div className="relatorio-quadro-topo">
                <h3 className="relatorio-quadro-titulo">Quadro de {relatorio.ano}</h3>
                <div className="relatorio-resumo">
                  <span className="relatorio-chip">
                    Acolhidos registrados: <strong>{relatorio.registradosTotal}</strong>
                  </span>
                  <span className="relatorio-chip relatorio-chip-alta">
                    Altas no ano: <strong>{relatorio.totalAltasAno}</strong>
                  </span>
                </div>
              </div>

              <div className="tabela-wrapper">
                <table className="tabela tabela-relatorio">
                  <thead>
                    <tr>
                      <th className="col-indicador">Indicador</th>
                      {MESES.map((m) => (
                        <th key={m} className="col-mes">
                          {m}
                        </th>
                      ))}
                      <th className="col-total">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="linha-registrados">
                      <th scope="row">Acolhidos registrados</th>
                      {relatorio.registrados.map((n, i) => (
                        <td key={i}>{n}</td>
                      ))}
                      <td className="col-total">{relatorio.registradosTotal}</td>
                    </tr>

                    <tr className="linha-secao">
                      <th scope="row" colSpan={14}>
                        Altas por tipo
                      </th>
                    </tr>

                    {relatorio.linhasAlta.map((linha) => (
                      <tr key={linha.valor}>
                        <th scope="row" title={linha.descricao}>
                          {linha.rotulo}
                        </th>
                        {linha.vetor.map((n, i) => (
                          <td key={i}>{n}</td>
                        ))}
                        <td className="col-total">{linha.total}</td>
                      </tr>
                    ))}

                    <tr className="linha-total-altas">
                      <th scope="row">Total de altas</th>
                      {relatorio.totalAltas.map((n, i) => (
                        <td key={i}>{n}</td>
                      ))}
                      <td className="col-total">{relatorio.totalAltasAno}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="relatorios-legenda">
                &quot;Acolhidos registrados&quot; considera a data de acolhimento na
                CTAV. As altas são contabilizadas pela data da alta.
              </p>

              <div className="relatorio-graficos">
                <GraficoBarras
                  titulo={`Acolhidos registrados por mês (${relatorio.ano})`}
                  dados={relatorio.registrados.map((valor, i) => ({
                    rotulo: MESES[i],
                    valor,
                  }))}
                  cor="#2563eb"
                />
                <GraficoBarras
                  titulo={`Altas por mês (${relatorio.ano})`}
                  dados={relatorio.totalAltas.map((valor, i) => ({
                    rotulo: MESES[i],
                    valor,
                  }))}
                  cor="#f59e0b"
                />
                <GraficoDistribuicao
                  titulo="Altas por tipo"
                  itens={relatorio.linhasAlta.map((l, i) => ({
                    rotulo: l.rotulo,
                    valor: l.total,
                    cor: PALETA_GRAFICOS[i % PALETA_GRAFICOS.length],
                  }))}
                />
              </div>
            </div>
          ) : visao === 'graficos' ? (
            <div className="relatorio-quadro">
              <div className="relatorio-quadro-topo">
                <h3 className="relatorio-quadro-titulo">
                  Gráficos em {relatorio.ano}
                </h3>
                <div className="relatorio-resumo">
                  <span className="relatorio-chip">
                    Adesões: <strong>{relatorio.registradosTotal}</strong>
                  </span>
                  <span className="relatorio-chip relatorio-chip-alta">
                    Desistências:{' '}
                    <strong>
                      {relatorio.motivosDesistencia.reduce(
                        (s, m) => s + m.valor,
                        0
                      )}
                    </strong>
                  </span>
                  <span className="relatorio-chip">
                    Média de permanência:{' '}
                    <strong>
                      {mediaPermanencia.quantidade
                        ? `${mediaPermanencia.mediaDias} dias (${textoMediaDias(
                            mediaPermanencia.mediaDias
                          )})`
                        : '—'}
                    </strong>
                  </span>
                </div>
              </div>

              <h4 className="relatorio-graficos-secao">
                Panorama de {relatorio.ano}
              </h4>
              <div className="relatorio-graficos">
                <GraficoBarras
                  titulo={`Acolhidos registrados por mês (${relatorio.ano})`}
                  dados={relatorio.registrados.map((valor, i) => ({
                    rotulo: MESES[i],
                    valor,
                  }))}
                  cor="#2563eb"
                />
                <GraficoBarras
                  titulo={`Altas por mês (${relatorio.ano})`}
                  dados={relatorio.totalAltas.map((valor, i) => ({
                    rotulo: MESES[i],
                    valor,
                  }))}
                  cor="#f59e0b"
                />
                <GraficoDistribuicao
                  titulo="Altas por tipo"
                  itens={relatorio.linhasAlta.map((l, i) => ({
                    rotulo: l.rotulo,
                    valor: l.total,
                    cor: PALETA_GRAFICOS[i % PALETA_GRAFICOS.length],
                  }))}
                  vazioTexto="Nenhuma alta registrada neste ano."
                />
                <GraficoDistribuicao
                  titulo="Acolhidos por sexo (registrados no ano)"
                  itens={graficos?.sexoAno ?? []}
                  vazioTexto="Nenhum acolhido registrado neste ano."
                />
                <GraficoDistribuicao
                  titulo="Acolhidos por faixa etária (registrados no ano)"
                  itens={graficos?.faixaEtariaAno ?? []}
                  vazioTexto="Sem datas de nascimento informadas neste ano."
                />
                <GraficoDistribuicao
                  titulo={`Média de permanência dos acolhidos${
                    mediaPermanencia.quantidade
                      ? ` — ${mediaPermanencia.mediaDias} dias em média`
                      : ''
                  }`}
                  itens={mediaPermanencia.faixas}
                  vazioTexto="Nenhuma alta com data de entrada e saída neste ano."
                />
                <GraficoDistribuicao
                  titulo="Motivos de adesão"
                  itens={relatorio.motivosAdesao}
                  vazioTexto="Nenhum acolhido registrado neste ano."
                />
                <GraficoDistribuicao
                  titulo="Motivos de desistência"
                  itens={relatorio.motivosDesistencia}
                  vazioTexto="Nenhuma alta por desistência neste ano."
                />
              </div>

              <h4 className="relatorio-graficos-secao">
                Panorama geral (todos os acolhidos)
              </h4>
              <div className="relatorio-graficos">
                <GraficoDistribuicao
                  titulo="Situação atual"
                  itens={graficos?.situacao ?? []}
                  vazioTexto="Nenhum acolhido cadastrado."
                />
                <GraficoDistribuicao
                  titulo="Vínculo com convênio"
                  itens={graficos?.vinculo ?? []}
                  vazioTexto="Nenhum acolhido cadastrado."
                />
                <GraficoDistribuicao
                  titulo="Ocupação por quarto (acolhidos ativos)"
                  itens={graficos?.ocupacaoQuarto ?? []}
                  vazioTexto="Nenhum acolhido ativo com quarto informado."
                />
                <GraficoDistribuicao
                  titulo="Medicamentos mais prescritos (top 10)"
                  itens={graficos?.medicamentos ?? []}
                  vazioTexto="Nenhum medicamento prescrito."
                />
              </div>

              <p className="relatorios-legenda">
                O <strong>Panorama de {relatorio.ano}</strong> considera os
                acolhidos registrados no ano (por data de acolhimento) e as altas
                do ano; a média de permanência usa apenas as altas com data de
                entrada e saída. O <strong>Panorama geral</strong> considera toda
                a base (ativos e histórico), com a ocupação por quarto restrita
                aos acolhidos ativos.
              </p>
            </div>
          ) : visao === 'altas' ? (
            <div className="relatorio-quadro">
              <div className="relatorio-quadro-topo">
                <h3 className="relatorio-quadro-titulo">
                  Acolhidos com alta em {Number(anoSelecionado)}
                </h3>
                <div className="relatorio-resumo">
                  <span className="relatorio-chip relatorio-chip-alta">
                    Total: <strong>{acolhidosComAlta.length}</strong>
                  </span>
                </div>
              </div>

              {acolhidosComAlta.length === 0 ? (
                <p className="vazio">
                  Nenhum acolhido teve alta no ano selecionado.
                </p>
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela tabela-altas">
                    <thead>
                      <tr>
                        <th>Acolhido</th>
                        <th>CPF</th>
                        <th>Entrada</th>
                        <th>Saída</th>
                        <th>Permanência (dias)</th>
                        <th>Permanência (meses)</th>
                        <th>Tipo de alta</th>
                        <th>Motivo da desistência</th>
                      </tr>
                    </thead>
                    <tbody>
                      {acolhidosComAlta.map((a) => (
                        <tr key={a.id}>
                          <td>{a.nome}</td>
                          <td>{a.cpf ?? '-'}</td>
                          <td>{formatarData(a.entrada)}</td>
                          <td>{formatarData(a.saida)}</td>
                          <td>
                            {a.permanencia && a.permanencia.dias >= 0
                              ? a.permanencia.dias
                              : '-'}
                          </td>
                          <td>{textoMeses(a.permanencia)}</td>
                          <td>{a.tipoAltaRotulo}</td>
                          <td>{a.motivoDesistencia}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <p className="relatorios-legenda">
                Entrada = data de acolhimento na CTAV; Saída = data da alta. A
                permanência é o intervalo entre essas duas datas.
              </p>
            </div>
          ) : (
            <div className="relatorio-quadro">
              <div className="relatorio-quadro-topo">
                <h3 className="relatorio-quadro-titulo">
                  Controle de administração — {rotuloAdmin || '—'}
                </h3>
                {acolhidoAdmin && (
                  <div className="relatorio-resumo">
                    <span className="relatorio-chip">
                      Acolhido: <strong>{acolhidoAdmin.nome}</strong>
                      {acolhidoAdmin.cpf ? ` — CPF ${acolhidoAdmin.cpf}` : ''}
                    </span>
                  </div>
                )}
              </div>

              {!acolhidoAdminId ? (
                <p className="vazio">
                  Selecione o acolhido para visualizar a grade do mês.
                </p>
              ) : prescricoesAdmin.length === 0 ? (
                <p className="vazio">
                  Este acolhido não possui medicamentos prescritos com dose definida.
                </p>
              ) : (
                <>
                  <GradeControleAdministracao
                    dias={diasAdmin}
                    prescricoesComDose={prescricoesAdmin}
                    registros={registrosAdmin}
                    rotuloMesAno={rotuloAdmin}
                    somenteLeitura
                    carregandoRegistros={carregandoAdmin}
                  />
                  <p className="relatorios-legenda">
                    Visualização somente leitura do controle de administração.
                    Para registrar tomadas, use a página Controle de administração
                    no menu Medicamentos.
                  </p>
                </>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
