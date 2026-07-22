import { useMemo } from 'react';
import {
  calcularMetricasConsultas,
  formatarDataHoraConsulta,
  rotuloStatusConsulta,
} from '../utils/consultas';
import {
  GraficoBarras,
  GraficoDistribuicao,
  PALETA_GRAFICOS,
} from './GraficosRelatorio';

export default function RelatorioConsultas({ consultas = [], anoSelecionado = '' }) {
  const lista = Array.isArray(consultas) ? consultas : [];

  const metricas = useMemo(
    () => calcularMetricasConsultas(lista, anoSelecionado),
    [lista, anoSelecionado]
  );

  const usarPorMes = !!Number(anoSelecionado);
  const barras = usarPorMes
    ? { titulo: `Consultas por mês (${anoSelecionado})`, dados: metricas.porMes }
    : { titulo: 'Consultas por ano', dados: metricas.porAno };

  if (lista.length === 0) {
    return (
      <div className="relatorio-quadro">
        <p className="vazio">Nenhuma consulta agendada para gerar relatórios.</p>
      </div>
    );
  }

  return (
    <div className="relatorio-quadro">
      <div className="relatorio-quadro-topo">
        <h3 className="relatorio-quadro-titulo">
          Relatório de consultas
          {anoSelecionado ? ` — ${anoSelecionado}` : ' — todos os anos'}
        </h3>
        <div className="relatorio-resumo">
          <span className="relatorio-chip">
            Total: <strong>{metricas.total}</strong>
          </span>
          <span className="relatorio-chip">
            Agendadas: <strong>{metricas.agendadas}</strong>
          </span>
          <span className="relatorio-chip relatorio-chip-alta">
            Realizadas: <strong>{metricas.realizadas}</strong>
          </span>
          <span className="relatorio-chip">
            Canceladas: <strong>{metricas.canceladas}</strong>
          </span>
        </div>
      </div>

      <div className="tabela-wrapper">
        <table className="tabela">
          <thead>
            <tr>
              <th>Acolhido</th>
              <th>Data e hora</th>
              <th>Profissional</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            {metricas.consultasOrdenadas.map((c) => (
              <tr key={c.id}>
                <td>{c.acolhidoNome ?? '-'}</td>
                <td>{formatarDataHoraConsulta(c.dataHora)}</td>
                <td>{c.profissional || '-'}</td>
                <td>
                  <span
                    className={`consulta-status consulta-status-${(c.status ?? 'AGENDADA').toLowerCase()}`}
                  >
                    {rotuloStatusConsulta(c.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h4 className="relatorio-graficos-secao relatorio-consultas-graficos">
        Gráficos
      </h4>
      <div className="relatorio-graficos">
        <GraficoBarras titulo={barras.titulo} dados={barras.dados} cor="#2563eb" />
        <GraficoDistribuicao
          titulo="Consultas por situação"
          itens={metricas.situacao.map((s, i) => ({
            ...s,
            cor: PALETA_GRAFICOS[i % PALETA_GRAFICOS.length],
          }))}
          vazioTexto="Nenhuma consulta no período."
        />
        <GraficoDistribuicao
          titulo="Consultas por profissional (top 8)"
          itens={metricas.profissionais}
          vazioTexto="Nenhum profissional informado."
        />
        <GraficoDistribuicao
          titulo="Consultas por acolhido (top 8)"
          itens={metricas.acolhidos}
          vazioTexto="Nenhum acolhido vinculado."
        />
      </div>
    </div>
  );
}
