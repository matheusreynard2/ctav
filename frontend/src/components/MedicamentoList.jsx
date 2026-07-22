import { Fragment, useEffect, useMemo, useState } from 'react';
import {
  NIVEL_ESTOQUE,
  nivelAlertaEstoque,
  rotuloNivelEstoque,
  totalComprimidos,
} from '../utils/estoqueMedicamentos';
import { usePaginacao } from '../hooks/usePaginacao';
import Paginacao from './Paginacao.jsx';

const resumirDescricao = (texto, max = 56) => {
  if (!texto) return '—';
  const t = String(texto).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
};

// Célula com valor numérico editável: exibe o valor; ao clicar, abre um campo
// com um botão de confirmação (ícone "verified") que salva a alteração.
function CelulaEditavel({ valor, onSalvar, titulo }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');
  const [salvando, setSalvando] = useState(false);

  const abrir = () => {
    setTexto(String(valor ?? 0));
    setEditando(true);
  };

  const cancelar = () => {
    if (salvando) return;
    setEditando(false);
  };

  const confirmar = async () => {
    const novo = Number(String(texto).replace(/\D/g, ''));
    if (Number.isNaN(novo)) {
      cancelar();
      return;
    }
    if (novo === Number(valor)) {
      setEditando(false);
      return;
    }
    setSalvando(true);
    try {
      await onSalvar(novo);
      setEditando(false);
    } catch {
      // Mantém o campo aberto para nova tentativa; o erro é exibido em toast.
    } finally {
      setSalvando(false);
    }
  };

  if (!editando) {
    return (
      <button
        type="button"
        className="celula-editavel-valor"
        onClick={abrir}
        title={titulo || 'Clique para editar'}
      >
        {valor}
      </button>
    );
  }

  return (
    <div className="celula-editavel">
      <input
        type="text"
        inputMode="numeric"
        className="celula-editavel-input"
        value={texto}
        autoFocus
        disabled={salvando}
        onChange={(e) => setTexto(e.target.value.replace(/\D/g, ''))}
        onKeyDown={(e) => {
          if (e.key === 'Enter') confirmar();
          if (e.key === 'Escape') cancelar();
        }}
        onBlur={cancelar}
        aria-label={titulo || 'Editar valor'}
      />
      <button
        type="button"
        className="btn-verificar"
        onMouseDown={(e) => e.preventDefault()}
        onClick={confirmar}
        disabled={salvando}
        title="Salvar"
        aria-label="Salvar"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </button>
    </div>
  );
}

export default function MedicamentoList({
  medicamentos,
  acolhidos = [],
  carregando,
  onEditar,
  onExcluir,
  onExcluirSelecionados,
  onSalvarCampos,
  onSalvarEstoqueReservado,
  onNovo,
}) {
  const [busca, setBusca] = useState('');
  const [selecionados, setSelecionados] = useState(() => new Set());
  const [expandidos, setExpandidos] = useState(() => new Set());

  const lista = Array.isArray(medicamentos) ? medicamentos : [];

  // Alocações (estoque reservado) de cada medicamento por acolhido, derivadas
  // das prescrições dos acolhidos.
  const alocacoesPorMedicamento = useMemo(() => {
    const mapa = new Map();
    (Array.isArray(acolhidos) ? acolhidos : []).forEach((acolhido) => {
      const prescricoes = Array.isArray(acolhido?.prescricoes)
        ? acolhido.prescricoes
        : [];
      prescricoes.forEach((p) => {
        if (p?.medicamentoId == null) return;
        const atual = mapa.get(p.medicamentoId) ?? [];
        atual.push({
          acolhidoId: acolhido.id,
          acolhidoNome: acolhido.nome ?? 'Acolhido',
          totalComprimidos: Number(p.totalComprimidos) || 0,
          doseManha: Number(p.doseManha) || 0,
          doseTarde: Number(p.doseTarde) || 0,
          doseNoite: Number(p.doseNoite) || 0,
        });
        mapa.set(p.medicamentoId, atual);
      });
    });
    // Ordena as alocações de cada medicamento pelo nome do acolhido.
    mapa.forEach((arr) =>
      arr.sort((a, b) => (a.acolhidoNome ?? '').localeCompare(b.acolhidoNome ?? ''))
    );
    return mapa;
  }, [acolhidos]);

  useEffect(() => {
    setSelecionados(new Set());
  }, [medicamentos]);

  const alternarExpandido = (id) => {
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  };

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    if (!termo) return lista;
    return lista.filter((r) =>
      [r.nome, r.descricao].some((valor) =>
        String(valor ?? '').toLowerCase().includes(termo)
      )
    );
  }, [lista, termo]);

  const {
    paginaAtual,
    totalPaginas,
    total: totalRegistros,
    inicio,
    fim,
    itensPagina,
    setPagina,
  } = usePaginacao(filtrados, 10, termo);

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

      <div className="estoque-legenda" aria-label="Legenda de estoque">
        <span className="estoque-legenda-titulo">Legenda de estoque:</span>
        <span className="estoque-legenda-item estoque-legenda-critico">
          <span className="estoque-legenda-amostra" aria-hidden="true" />
          {rotuloNivelEstoque(NIVEL_ESTOQUE.CRITICO)}
        </span>
        <span className="estoque-legenda-item estoque-legenda-baixo">
          <span className="estoque-legenda-amostra" aria-hidden="true" />
          {rotuloNivelEstoque(NIVEL_ESTOQUE.BAIXO)}
        </span>
      </div>

      <p className="tabela-dica-edicao" role="note">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
        </svg>
        <span>
          Dica: você pode editar as colunas <strong>Qtd. de caixas</strong>,{' '}
          <strong>Qtd. de comprimidos por caixa</strong> e{' '}
          <strong>Total de comprimidos (livre)</strong> diretamente na tabela —
          clique no valor na linha do medicamento e confirme no botão de
          confirmação. A <strong>Qtd. de caixas</strong> reflete o{' '}
          <strong>estoque físico total</strong> (livre + reservado). O{' '}
          <strong>Total de comprimidos (livre)</strong> é o{' '}
          <strong>estoque livre</strong> (ainda não reservado a nenhum acolhido).
          Clique em <strong>Reservado</strong> para ver e editar quanto cada
          acolhido tem reservado; alterar aqui move comprimidos entre o estoque
          livre e o do acolhido.
        </span>
      </p>

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
              <th>Total de comprimidos (livre)</th>
              <th>Reservado (acolhidos)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itensPagina.map((r) => {
              const nivel = nivelAlertaEstoque(r);
              const total = totalComprimidos(r);
              const alocacoes = alocacoesPorMedicamento.get(r.id) ?? [];
              const totalReservado = alocacoes.reduce(
                (soma, a) => soma + a.totalComprimidos,
                0
              );
              const estoqueGeral = total + totalReservado;
              const porCaixa = Number(r.quantidade_por_caixa) || 1;
              // Caixas exibidas = estoque FÍSICO geral (livre + reservado), não
              // apenas o livre; assim "2 caixas com 30, sendo 30 reservados"
              // continua mostrando 2 caixas (60 comp.), e não 1.
              const caixasGeral = Math.floor(estoqueGeral / porCaixa);
              const aberto = expandidos.has(r.id);
              const classeLinha = [
                selecionados.has(r.id) ? 'linha-selecionada' : '',
                nivel === NIVEL_ESTOQUE.CRITICO ? 'estoque-critico' : '',
                nivel === NIVEL_ESTOQUE.BAIXO ? 'estoque-baixo' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
              <Fragment key={r.id}>
              <tr className={classeLinha}>
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
                <td>
                  <CelulaEditavel
                    valor={caixasGeral}
                    titulo="Editar quantidade de caixas (estoque físico total)"
                    onSalvar={(novoCaixas) => {
                      const pc = Number(r.quantidade_por_caixa) || 1;
                      // O valor informado é o total físico de caixas; o que já
                      // está reservado a acolhidos permanece, então o estoque
                      // livre é o restante (nunca negativo).
                      const novoLivre = Math.max(0, novoCaixas * pc - totalReservado);
                      return onSalvarCampos?.(r, {
                        quantidade_por_caixa: pc,
                        total_comprimidos: novoLivre,
                      });
                    }}
                  />
                </td>
                <td>
                  <CelulaEditavel
                    valor={r.quantidade_por_caixa}
                    titulo="Editar comprimidos por caixa"
                    onSalvar={(novoPorCaixa) => {
                      const pc = novoPorCaixa > 0 ? novoPorCaixa : 1;
                      // Alterar o tamanho da caixa não muda a quantidade de
                      // comprimidos livres, apenas a equivalência em caixas.
                      return onSalvarCampos?.(r, {
                        quantidade_por_caixa: pc,
                        total_comprimidos: total,
                      });
                    }}
                  />
                </td>
                <td className="estoque-total">
                  <CelulaEditavel
                    valor={total}
                    titulo="Editar total de comprimidos"
                    onSalvar={(novoTotal) =>
                      onSalvarCampos?.(r, {
                        quantidade_por_caixa: Number(r.quantidade_por_caixa) || 1,
                        total_comprimidos: novoTotal,
                      })
                    }
                  />
                </td>
                <td className="estoque-reservado-cell">
                  <button
                    type="button"
                    className={`estoque-reservado-toggle${aberto ? ' aberto' : ''}`}
                    onClick={() => alternarExpandido(r.id)}
                    aria-expanded={aberto}
                    title={
                      alocacoes.length > 0
                        ? 'Ver/editar reserva por acolhido'
                        : 'Nenhum acolhido com este medicamento reservado'
                    }
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                    <span>
                      {totalReservado} comp.
                      {alocacoes.length > 0 ? ` (${alocacoes.length})` : ''}
                    </span>
                  </button>
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
              {aberto && (
                <tr className="estoque-reservado-detalhe-linha">
                  <td colSpan={8}>
                    <div className="estoque-reservado-detalhe">
                      <div className="estoque-reservado-resumo">
                        <span>
                          Estoque livre: <strong>{total}</strong> comp.
                        </span>
                        <span>
                          Reservado: <strong>{totalReservado}</strong> comp.
                        </span>
                        <span>
                          Estoque geral: <strong>{estoqueGeral}</strong> comp.
                        </span>
                      </div>
                      {alocacoes.length === 0 ? (
                        <p className="estoque-reservado-vazio">
                          Nenhum acolhido tem este medicamento reservado. A
                          reserva é feita na aba de medicamentos do cadastro do
                          acolhido, ou aqui após vincular o medicamento a ele.
                        </p>
                      ) : (
                        <table className="tabela estoque-reservado-tabela">
                          <thead>
                            <tr>
                              <th>Acolhido</th>
                              <th>Doses (M/T/N)</th>
                              <th>Comprimidos reservados</th>
                            </tr>
                          </thead>
                          <tbody>
                            {alocacoes.map((a) => (
                              <tr key={`${r.id}-${a.acolhidoId}`}>
                                <td>{a.acolhidoNome}</td>
                                <td>
                                  {a.doseManha}/{a.doseTarde}/{a.doseNoite}
                                </td>
                                <td>
                                  <CelulaEditavel
                                    valor={a.totalComprimidos}
                                    titulo="Editar comprimidos reservados"
                                    onSalvar={(novo) =>
                                      onSalvarEstoqueReservado?.(
                                        a.acolhidoId,
                                        r.id,
                                        novo
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </td>
                </tr>
              )}
              </Fragment>
            );
            })}
          </tbody>
        </table>
      )}

      <Paginacao
        paginaAtual={paginaAtual}
        totalPaginas={totalPaginas}
        total={totalRegistros}
        inicio={inicio}
        fim={fim}
        onMudar={setPagina}
      />
    </div>
  );
}
