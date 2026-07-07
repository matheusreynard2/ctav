import { useEffect, useMemo, useState } from 'react';

const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

export default function OcorrenciaList({
  ocorrencias,
  carregando,
  onExibir,
  onEditar,
  onExcluir,
  onExcluirSelecionados,
  onNovo,
}) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(() => new Set());

  const lista = Array.isArray(ocorrencias) ? ocorrencias : [];

  useEffect(() => {
    setSelecionados(new Set());
  }, [ocorrencias]);

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    if (!termo) return lista;
    return lista.filter((o) =>
      [o.acolhidosResumo, o.acolhidosNomes, o.titulo].some((valor) =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }, [lista, termo]);

  const idsFiltrados = filtrados.map((o) => o.id);
  const todosSelecionados =
    idsFiltrados.length > 0 && idsFiltrados.every((id) => selecionados.has(id));

  const alternarUm = (id) => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const alternarTodos = () => {
    setSelecionados((prev) => {
      const novo = new Set(prev);
      if (todosSelecionados) idsFiltrados.forEach((id) => novo.delete(id));
      else idsFiltrados.forEach((id) => novo.add(id));
      return novo;
    });
  };

  const excluirSelecionados = () => {
    const registros = lista.filter((o) => selecionados.has(o.id));
    onExcluirSelecionados?.(registros);
  };

  if (carregando) {
    return <div className="card vazio">Carregando ocorrências...</div>;
  }

  if (!lista.length) {
    return (
      <div className="card vazio">
        <p>Nenhuma ocorrência cadastrada ainda.</p>
        <button type="button" className="btn btn-primario" onClick={onNovo}>
          Cadastrar ocorrência
        </button>
      </div>
    );
  }

  return (
    <div className="card tabela-wrapper">
      <div className="lista-cabecalho">
        <h2>Ocorrências cadastradas ({filtrados.length})</h2>
        <div className="busca-lista">
          <input
            type="search"
            className="busca-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por acolhido ou ocorrência..."
            aria-label="Buscar ocorrências"
          />
        </div>
        <button
          type="button"
          className="btn btn-primario btn-novo"
          onClick={onNovo}
          title="Cadastrar ocorrência"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nova ocorrência
        </button>
      </div>

      {selecionados.size > 0 && (
        <div className="selecao-acoes">
          <span>{selecionados.size} selecionado(s)</span>
          <button
            type="button"
            className="btn btn-excluir-massa"
            onClick={excluirSelecionados}
          >
            Excluir selecionados
          </button>
        </div>
      )}

      {filtrados.length === 0 ? (
        <div className="vazio">Nenhuma ocorrência encontrada para &quot;{busca}&quot;.</div>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  onChange={alternarTodos}
                  aria-label="Selecionar todas"
                />
              </th>
              <th>Acolhido(s)</th>
              <th>Ocorrência</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((o) => (
              <tr key={o.id} className={selecionados.has(o.id) ? 'linha-selecionada' : ''}>
                <td className="col-check">
                  <input
                    type="checkbox"
                    checked={selecionados.has(o.id)}
                    onChange={() => alternarUm(o.id)}
                    aria-label={`Selecionar ocorrência ${o.titulo ?? ''}`}
                  />
                </td>
                <td>
                  {o.acolhidosResumo ?? 'Sem acolhido'}
                  {!o.acolhidosResumo ? null : (o.acolhidoIds?.length ?? 0) === 0 && (
                    <span className="etiqueta-inativo"> (sem vínculo ativo)</span>
                  )}
                </td>
                <td>{o.titulo ?? '-'}</td>
                <td>{formatarData(o.dataOcorrencia)}</td>
                <td className="acoes-tabela">
                  <button
                    className="btn btn-icone btn-exibir"
                    onClick={() => onExibir(o)}
                    title="Exibir detalhes"
                    aria-label="Exibir detalhes"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="7" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <span className="acao-label">Ver</span>
                  </button>
                  <button
                    className="btn btn-icone"
                    onClick={() => onEditar(o)}
                    title="Editar"
                    aria-label="Editar"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    <span className="acao-label">Editar</span>
                  </button>
                  <button
                    className="btn btn-icone btn-perigo"
                    onClick={() => onExcluir(o)}
                    title="Excluir"
                    aria-label="Excluir"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                    </svg>
                    <span className="acao-label">Excluir</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
