// Gráficos leves (sem dependências) usados na página de Relatórios.
// - GraficoBarras: barras verticais (ex.: valores por mês).
// - GraficoDistribuicao: barras horizontais (ex.: distribuição por categoria).

export const PALETA_GRAFICOS = [
  '#2563eb',
  '#f59e0b',
  '#10b981',
  '#ef4444',
  '#8b5cf6',
  '#0ea5e9',
  '#ec4899',
  '#14b8a6',
  '#f97316',
  '#64748b',
];

export function GraficoBarras({ titulo, dados = [], cor = '#2563eb' }) {
  const max = Math.max(1, ...dados.map((d) => Number(d.valor) || 0));
  const semDados = dados.every((d) => !Number(d.valor));

  return (
    <div className="grafico">
      <h4 className="grafico-titulo">{titulo}</h4>
      {semDados ? (
        <p className="grafico-vazio">Sem dados no período.</p>
      ) : (
        <div className="grafico-barras" role="img" aria-label={titulo}>
          {dados.map((d, i) => {
            const valor = Number(d.valor) || 0;
            return (
              <div className="grafico-barra-col" key={i}>
                <span className="grafico-barra-valor">{valor || ''}</span>
                <span className="grafico-barra-trilha">
                  <span
                    className="grafico-barra"
                    style={{
                      height: `${(valor / max) * 100}%`,
                      background: cor,
                    }}
                  />
                </span>
                <span className="grafico-barra-rotulo">{d.rotulo}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function GraficoDistribuicao({
  titulo,
  itens = [],
  vazioTexto = 'Sem dados no período.',
}) {
  const total = itens.reduce((s, it) => s + (Number(it.valor) || 0), 0);
  const max = Math.max(1, ...itens.map((it) => Number(it.valor) || 0));

  return (
    <div className="grafico">
      <h4 className="grafico-titulo">{titulo}</h4>
      {itens.length === 0 || total === 0 ? (
        <p className="grafico-vazio">{vazioTexto}</p>
      ) : (
        <ul className="grafico-dist">
          {itens.map((it, i) => {
            const valor = Number(it.valor) || 0;
            const pct = total ? Math.round((valor / total) * 100) : 0;
            return (
              <li className="grafico-dist-item" key={i}>
                <span className="grafico-dist-rotulo" title={it.rotulo}>
                  {it.rotulo}
                </span>
                <span className="grafico-dist-trilha">
                  <span
                    className="grafico-dist-barra"
                    style={{
                      width: `${(valor / max) * 100}%`,
                      background: it.cor || PALETA_GRAFICOS[i % PALETA_GRAFICOS.length],
                    }}
                  />
                </span>
                <span className="grafico-dist-valor">
                  {valor} ({pct}%)
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
