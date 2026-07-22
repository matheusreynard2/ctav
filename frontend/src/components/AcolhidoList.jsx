import { useEffect, useMemo, useState } from 'react';
import { isoParaData } from '../utils/masks';
import { usePaginacao } from '../hooks/usePaginacao';
import Paginacao from './Paginacao.jsx';

export default function AcolhidoList({
  acolhidos,
  carregando,
  onExibir,
  onEditar,
  onExcluir,
  onExcluirSelecionados,
  onArquivar,
  onArquivarSelecionados,
  onAnexos,
  onNovo,
}) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(() => new Set());

  const lista = Array.isArray(acolhidos) ? acolhidos : [];

  // Limpa a selecao sempre que os dados forem recarregados.
  useEffect(() => {
    setSelecionados(new Set());
  }, [acolhidos]);

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    if (!termo) return lista;
    return lista.filter((p) =>
      [p.nome, p.cpf, p.email].some((valor) =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }, [lista, termo]);

  const { paginaAtual, totalPaginas, total, inicio, fim, itensPagina, setPagina } =
    usePaginacao(filtrados, 10, termo);

  const idsFiltrados = filtrados.map((p) => p.id);
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

  const registrosSelecionados = () => lista.filter((p) => selecionados.has(p.id));

  const excluirSelecionados = () => {
    onExcluirSelecionados?.(registrosSelecionados());
  };

  const arquivarSelecionados = () => {
    onArquivarSelecionados?.(registrosSelecionados());
  };

  if (carregando) {
    return <div className="card vazio">Carregando acolhidos...</div>;
  }

  if (!lista.length) {
    return (
      <div className="card vazio">
        <p>Nenhum acolhido cadastrado ainda.</p>
        <button type="button" className="btn btn-primario" onClick={onNovo}>
          Cadastrar acolhido
        </button>
      </div>
    );
  }

  return (
    <div className="card tabela-wrapper">
      <div className="lista-cabecalho">
        <h2>Acolhidos cadastrados ({filtrados.length})</h2>
        <div className="busca-lista">
          <input
            type="search"
            className="busca-input"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome, CPF ou email..."
            aria-label="Buscar acolhidos"
          />
        </div>
        <button
          type="button"
          className="btn btn-primario btn-novo"
          onClick={onNovo}
          title="Cadastrar acolhido"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Novo acolhido
        </button>
      </div>

      {selecionados.size > 0 && (
        <div className="selecao-acoes">
          <span>{selecionados.size} selecionado(s)</span>
          <button
            type="button"
            className="btn btn-secundario"
            onClick={arquivarSelecionados}
          >
            Enviar ao histórico
          </button>
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
        <div className="vazio">Nenhum acolhido encontrado para &quot;{busca}&quot;.</div>
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
              <th>CPF</th>
              <th>Quarto</th>
              <th>Email</th>
              <th>Alta</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((p) => (
              <tr key={p.id} className={selecionados.has(p.id) ? 'linha-selecionada' : ''}>
                <td className="col-check">
                  <input
                    type="checkbox"
                    checked={selecionados.has(p.id)}
                    onChange={() => alternarUm(p.id)}
                    aria-label={`Selecionar ${p.nome}`}
                  />
                </td>
                <td>
                  <div className="celula-nome">
                    <span className="lista-foto">
                      {p.fotoUrl ? (
                        <img src={p.fotoUrl} alt={`Foto de ${p.nome}`} />
                      ) : (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      )}
                    </span>
                    <span>{p.nome}</span>
                  </div>
                </td>
                <td>{p.cpf}</td>
                <td>{p.quarto ?? '-'}</td>
                <td>{p.email ?? '-'}</td>
                <td>
                  {p.alta ? (
                    <span className="alta-status alta-sim">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      {p.dataAlta && (
                        <span className="alta-data">{isoParaData(p.dataAlta)}</span>
                      )}
                    </span>
                  ) : (
                    <span className="alta-status alta-nao" title="Sem alta">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </span>
                  )}
                </td>
                <td className="acoes-tabela">
                  <button
                    className="btn btn-icone btn-exibir"
                    onClick={() => onExibir(p)}
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
                    onClick={() => onEditar(p)}
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
                    className="btn btn-icone"
                    onClick={() => onAnexos(p)}
                    title="Anexos"
                    aria-label="Anexos"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                    </svg>
                    <span className="acao-label">Anexos</span>
                  </button>
                  <button
                    className="btn btn-icone btn-arquivar"
                    onClick={() => onArquivar(p)}
                    disabled={!p.alta}
                    title={
                      p.alta
                        ? 'Enviar ao histórico'
                        : 'Só acolhidos com alta podem ir ao histórico'
                    }
                    aria-label="Enviar ao histórico"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="21 8 21 21 3 21 3 8" />
                      <rect x="1" y="3" width="22" height="5" />
                      <line x1="10" y1="12" x2="14" y2="12" />
                    </svg>
                    <span className="acao-label">Histórico</span>
                  </button>
                  <button
                    className="btn btn-icone btn-perigo"
                    onClick={() => onExcluir(p)}
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

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        total={total}
        inicio={inicio}
        fim={fim}
        onMudar={setPagina}
      />
    </div>
  );
}
