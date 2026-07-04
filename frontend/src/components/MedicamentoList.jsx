import { useEffect, useMemo, useState } from 'react';

const resumirDescricao = (texto, max = 56) => {
  if (!texto) return '—';
  const t = String(texto).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
};

export default function MedicamentoList({
  medicamentos,
  carregando,
  onEditar,
  onExcluir,
  onExcluirSelecionados,
  onNovo,
}) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(() => new Set());

  const lista = Array.isArray(medicamentos) ? medicamentos : [];

  useEffect(() => {
    setSelecionados(new Set());
  }, [medicamentos]);

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    if (!termo) return lista;
    return lista.filter((r) =>
      [r.nome, r.descricao].some((valor) =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }, [lista, termo]);

  const idsFiltrados = filtrados.map((r) => r.id);
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
    const registros = lista.filter((r) => selecionados.has(r.id));
    onExcluirSelecionados?.(registros);
  };

  if (carregando) {
    return <div className="card vazio">Carregando medicamentos...</div>;
  }

  if (!lista.length) {
    return (
      <div className="card vazio">
        <p>Nenhum medicamento cadastrado ainda.</p>
        <button type="button" className="btn btn-primario" onClick={onNovo}>
          Cadastrar medicamento
        </button>
      </div>
    );
  }

  return (
    <div className="card tabela-wrapper">
      <div className="lista-cabecalho">
        <h2>Medicamentos cadastrados ({filtrados.length})</h2>
        <div className="busca-lista">
          <input
            type="search"
            className="busca-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            aria-label="Buscar medicamentos"
          />
        </div>
        <button
          type="button"
          className="btn btn-primario btn-novo"
          onClick={onNovo}
          title="Cadastrar medicamento"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo medicamento
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
        <div className="vazio">Nenhum medicamento encontrado para &quot;{busca}&quot;.</div>
      ) : (
        <table className="tabela">
          <thead>
            <tr>
              <th className="col-check">
                <input
                  type="checkbox"
                  checked={todosSelecionados}
                  onChange={alternarTodos}
                  aria-label="Selecionar todos"
                />
              </th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Qtd. de caixas</th>
              <th>Qtd. de comprimidos por caixa</th>
              <th>Total de comprimidos</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((r) => (
              <tr key={r.id} className={selecionados.has(r.id) ? 'linha-selecionada' : ''}>
                <td className="col-check">
                  <input
                    type="checkbox"
                    checked={selecionados.has(r.id)}
                    onChange={() => alternarUm(r.id)}
                    aria-label={`Selecionar ${r.nome}`}
                  />
                </td>
                <td>{r.nome}</td>
                <td title={r.descricao}>{resumirDescricao(r.descricao)}</td>
                <td>{r.quantidade_caixas}</td>
                <td>{r.quantidade_por_caixa}</td>
                <td>
                  {(Number(r.quantidade_caixas) || 0) *
                    (Number(r.quantidade_por_caixa) || 0)}
                </td>
                <td className="acoes-tabela">
                  <button
                    className="btn btn-icone"
                    onClick={() => onEditar(r)}
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
                    onClick={() => onExcluir(r)}
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
