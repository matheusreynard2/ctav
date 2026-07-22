import { useEffect, useMemo, useState } from 'react';
import { medicamentoService, prescricaoService } from '../api';

const NOVO_MED_INICIAL = {
  nome: '',
  descricao: '',
  quantidade_por_caixa: '',
  total_comprimidos: '',
};

const soDigitos = (valor) => String(valor ?? '').replace(/\D/g, '');
const numero = (valor) => Math.max(0, parseInt(valor, 10) || 0);

const linhasDoAcolhido = (acolhido) =>
  (Array.isArray(acolhido?.prescricoes) ? acolhido.prescricoes : [])
    .filter((p) => p?.medicamentoId != null)
    .map((p) => ({
      medicamentoId: p.medicamentoId,
      medicamentoNome: p.medicamentoNome ?? 'Medicamento',
      doseManha: Number(p.doseManha) || 0,
      doseTarde: Number(p.doseTarde) || 0,
      doseNoite: Number(p.doseNoite) || 0,
      totalComprimidos: Number(p.totalComprimidos) || 0,
    }));

export default function GestaoMedicacao({
  acolhidos = [],
  medicamentos = [],
  carregando = false,
  onErro,
  onSucesso,
  onRecarregarAcolhidos,
  onRecarregarMedicamentos,
}) {
  const [acolhidoId, setAcolhidoId] = useState('');
  const [linhas, setLinhas] = useState([]);
  const [selecaoAdd, setSelecaoAdd] = useState('');
  const [salvando, setSalvando] = useState(false);

  const [modalAberto, setModalAberto] = useState(false);
  const [novoMed, setNovoMed] = useState(NOVO_MED_INICIAL);
  const [errosNovo, setErrosNovo] = useState({});
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  const acolhidosOrdenados = useMemo(
    () => [...acolhidos].sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')),
    [acolhidos]
  );

  const medicamentosPorId = useMemo(() => {
    const mapa = new Map();
    (Array.isArray(medicamentos) ? medicamentos : []).forEach((m) => mapa.set(m.id, m));
    return mapa;
  }, [medicamentos]);

  const acolhidoSelecionado = useMemo(
    () => acolhidosOrdenados.find((a) => String(a.id) === String(acolhidoId)) ?? null,
    [acolhidosOrdenados, acolhidoId]
  );

  // Ao selecionar um acolhido (ou quando os dados recarregam), reinicia as
  // linhas com as prescrições atuais dele.
  useEffect(() => {
    setLinhas(linhasDoAcolhido(acolhidoSelecionado));
    setSelecaoAdd('');
  }, [acolhidoSelecionado]);

  const idsNasLinhas = useMemo(
    () => new Set(linhas.map((l) => l.medicamentoId)),
    [linhas]
  );

  const medicamentosDisponiveis = useMemo(
    () =>
      [...medicamentos]
        .filter((m) => !idsNasLinhas.has(m.id))
        .sort((a, b) => (a.nome ?? '').localeCompare(b.nome ?? '')),
    [medicamentos, idsNasLinhas]
  );

  const adicionarMedicamento = (id) => {
    const idNum = Number(id);
    if (!idNum || idsNasLinhas.has(idNum)) return;
    const med = medicamentosPorId.get(idNum);
    setLinhas((atual) => [
      ...atual,
      {
        medicamentoId: idNum,
        medicamentoNome: med?.nome ?? 'Medicamento',
        doseManha: 0,
        doseTarde: 0,
        doseNoite: 0,
        totalComprimidos: 0,
      },
    ]);
    setSelecaoAdd('');
  };

  const removerLinha = (id) => {
    setLinhas((atual) => atual.filter((l) => l.medicamentoId !== id));
  };

  const alterarLinha = (id, campo, valor) => {
    setLinhas((atual) =>
      atual.map((l) => (l.medicamentoId === id ? { ...l, [campo]: numero(valor) } : l))
    );
  };

  const salvar = async () => {
    if (!acolhidoId) return;
    setSalvando(true);
    try {
      await prescricaoService.sincronizar(
        acolhidoId,
        linhas.map((l) => ({
          medicamentoId: l.medicamentoId,
          doseManha: l.doseManha,
          doseTarde: l.doseTarde,
          doseNoite: l.doseNoite,
          totalComprimidos: l.totalComprimidos,
        }))
      );
      await onRecarregarAcolhidos?.();
      await onRecarregarMedicamentos?.();
      onSucesso?.('Medicação do acolhido salva com sucesso.');
    } catch (err) {
      onErro?.(
        err?.response?.data?.message ||
          'Não foi possível salvar. Verifique o estoque livre e tente novamente.'
      );
    } finally {
      setSalvando(false);
    }
  };

  const alterarNovoMed = (campo, valor) => {
    const ehNumero =
      campo === 'quantidade_por_caixa' || campo === 'total_comprimidos';
    setNovoMed((atual) => ({
      ...atual,
      [campo]: ehNumero ? soDigitos(valor) : valor,
    }));
  };

  const validarNovoMed = () => {
    const e = {};
    if (!novoMed.nome.trim()) e.nome = 'Informe o nome';
    if (!novoMed.descricao.trim()) e.descricao = 'Informe a descrição';
    if (novoMed.quantidade_por_caixa === '' || Number(novoMed.quantidade_por_caixa) < 1) {
      e.quantidade_por_caixa = 'Informe os comprimidos por caixa (mínimo 1)';
    }
    if (novoMed.total_comprimidos === '') {
      e.total_comprimidos = 'Informe o total de comprimidos';
    }
    setErrosNovo(e);
    return Object.keys(e).length === 0;
  };

  const salvarNovoMedicamento = async () => {
    if (!validarNovoMed()) return;
    setSalvandoNovo(true);
    try {
      const criado = await medicamentoService.criar({
        nome: novoMed.nome.trim(),
        descricao: novoMed.descricao.trim(),
        quantidade_por_caixa: Number(novoMed.quantidade_por_caixa),
        total_comprimidos: Number(novoMed.total_comprimidos),
      });
      await onRecarregarMedicamentos?.();
      // Já inclui o medicamento recém-criado nas linhas do acolhido atual.
      if (criado?.id) {
        setLinhas((atual) =>
          atual.some((l) => l.medicamentoId === criado.id)
            ? atual
            : [
                ...atual,
                {
                  medicamentoId: criado.id,
                  medicamentoNome: criado.nome ?? 'Medicamento',
                  doseManha: 0,
                  doseTarde: 0,
                  doseNoite: 0,
                  totalComprimidos: 0,
                },
              ]
        );
      }
      onSucesso?.('Medicamento cadastrado com sucesso.');
      setModalAberto(false);
      setNovoMed(NOVO_MED_INICIAL);
      setErrosNovo({});
    } catch (err) {
      onErro?.(
        err?.response?.data?.message || 'Não foi possível cadastrar o medicamento.'
      );
    } finally {
      setSalvandoNovo(false);
    }
  };

  return (
    <section className="card gestao-medicacao">
      <div className="relatorios-cabecalho">
        <div>
          <h2>Controle total de medicação</h2>
          <p className="relatorios-subtitulo">
            Selecione um acolhido para vincular medicamentos, reservar
            caixas/comprimidos do estoque e definir as doses diárias. Cadastre um
            medicamento novo sem sair da página.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-secundario"
          onClick={() => {
            setNovoMed(NOVO_MED_INICIAL);
            setErrosNovo({});
            setModalAberto(true);
          }}
        >
          + Cadastrar novo medicamento
        </button>
      </div>

      {carregando ? (
        <p className="vazio">Carregando dados...</p>
      ) : acolhidosOrdenados.length === 0 ? (
        <p className="vazio">Nenhum acolhido cadastrado.</p>
      ) : (
        <>
          <div className="controle-filtros">
            <div className="campo">
              <label htmlFor="gestao-acolhido">Acolhido</label>
              <select
                id="gestao-acolhido"
                value={acolhidoId}
                onChange={(e) => setAcolhidoId(e.target.value)}
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
          </div>

          {!acolhidoId ? (
            <p className="vazio">Selecione o acolhido para gerenciar a medicação.</p>
          ) : (
            <>
              <div className="gestao-adicionar">
                <div className="campo">
                  <label htmlFor="gestao-add-med">Vincular medicamento</label>
                  <select
                    id="gestao-add-med"
                    value={selecaoAdd}
                    onChange={(e) => {
                      setSelecaoAdd(e.target.value);
                      if (e.target.value) adicionarMedicamento(e.target.value);
                    }}
                    disabled={medicamentosDisponiveis.length === 0}
                  >
                    <option value="">
                      {medicamentosDisponiveis.length === 0
                        ? 'Todos os medicamentos já vinculados'
                        : 'Selecione um medicamento para vincular...'}
                    </option>
                    {medicamentosDisponiveis.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} (livre: {Number(m.total_comprimidos) || 0} comp.)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {linhas.length === 0 ? (
                <p className="vazio">
                  Nenhum medicamento vinculado a este acolhido. Use o campo acima
                  para vincular, ou cadastre um novo medicamento.
                </p>
              ) : (
                <div className="tabela-wrapper">
                  <table className="tabela gestao-tabela">
                    <thead>
                      <tr>
                        <th>Medicamento</th>
                        <th>Livre no estoque</th>
                        <th>Reservar (comp.)</th>
                        <th>Equivalência</th>
                        <th>Manhã</th>
                        <th>Tarde</th>
                        <th>Noite</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linhas.map((l) => {
                        const med = medicamentosPorId.get(l.medicamentoId);
                        const porCaixa = Number(med?.quantidade_por_caixa) || 0;
                        const livre = Number(med?.total_comprimidos) || 0;
                        const caixas = porCaixa > 0 ? Math.floor(l.totalComprimidos / porCaixa) : 0;
                        const avulsos = porCaixa > 0 ? l.totalComprimidos % porCaixa : l.totalComprimidos;
                        return (
                          <tr key={l.medicamentoId}>
                            <td>{l.medicamentoNome}</td>
                            <td className="gestao-livre">
                              {livre} comp.
                              {porCaixa > 0 ? ` (caixa: ${porCaixa})` : ''}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="dose-input"
                                value={l.totalComprimidos}
                                onChange={(e) =>
                                  alterarLinha(l.medicamentoId, 'totalComprimidos', e.target.value)
                                }
                                aria-label={`Reservar comprimidos - ${l.medicamentoNome}`}
                              />
                            </td>
                            <td className="gestao-equivalencia">
                              {porCaixa > 0
                                ? `${caixas} cx + ${avulsos} comp.`
                                : `${l.totalComprimidos} comp.`}
                            </td>
                            {['doseManha', 'doseTarde', 'doseNoite'].map((campo) => (
                              <td key={campo}>
                                <input
                                  type="number"
                                  min="0"
                                  className="dose-input"
                                  value={l[campo]}
                                  onChange={(e) =>
                                    alterarLinha(l.medicamentoId, campo, e.target.value)
                                  }
                                  aria-label={`${campo} - ${l.medicamentoNome}`}
                                />
                              </td>
                            ))}
                            <td className="acoes-tabela">
                              <button
                                type="button"
                                className="btn btn-icone btn-perigo"
                                onClick={() => removerLinha(l.medicamentoId)}
                                title="Desvincular medicamento"
                                aria-label="Desvincular medicamento"
                              >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <polyline points="3 6 5 6 21 6" />
                                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                  <path d="M10 11v6" />
                                  <path d="M14 11v6" />
                                  <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
                                </svg>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="gestao-acoes">
                <button
                  type="button"
                  className="btn btn-primario"
                  onClick={salvar}
                  disabled={salvando}
                >
                  {salvando ? 'Salvando...' : 'Salvar medicação'}
                </button>
                <span className="campo-ajuda">
                  Ao salvar, os comprimidos reservados saem do estoque livre do
                  medicamento e ficam exclusivos deste acolhido. Reduzir a reserva
                  ou desvincular devolve ao estoque livre.
                </span>
              </div>
            </>
          )}
        </>
      )}

      {modalAberto && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="novo-med-titulo"
          onClick={() => !salvandoNovo && setModalAberto(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="novo-med-titulo" className="modal-titulo">
              Cadastrar novo medicamento
            </h3>
            <div className="grid">
              <div className="campo campo-largo">
                <label htmlFor="novo-med-nome">Nome *</label>
                <input
                  id="novo-med-nome"
                  value={novoMed.nome}
                  onChange={(e) => alterarNovoMed('nome', e.target.value)}
                  maxLength={120}
                  placeholder="Nome do medicamento"
                />
                {errosNovo.nome && <span className="erro">{errosNovo.nome}</span>}
              </div>
              <div className="campo campo-largo">
                <label htmlFor="novo-med-descricao">Descrição *</label>
                <textarea
                  id="novo-med-descricao"
                  value={novoMed.descricao}
                  onChange={(e) => alterarNovoMed('descricao', e.target.value)}
                  rows={3}
                  maxLength={255}
                  placeholder="Descrição (uso, posologia resumida, observações)"
                />
                {errosNovo.descricao && (
                  <span className="erro">{errosNovo.descricao}</span>
                )}
              </div>
              <div className="campo">
                <label htmlFor="novo-med-por-caixa">Comprimidos por caixa *</label>
                <input
                  id="novo-med-por-caixa"
                  value={novoMed.quantidade_por_caixa}
                  onChange={(e) => alterarNovoMed('quantidade_por_caixa', e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
                {errosNovo.quantidade_por_caixa && (
                  <span className="erro">{errosNovo.quantidade_por_caixa}</span>
                )}
              </div>
              <div className="campo">
                <label htmlFor="novo-med-total">Total de comprimidos *</label>
                <input
                  id="novo-med-total"
                  value={novoMed.total_comprimidos}
                  onChange={(e) => alterarNovoMed('total_comprimidos', e.target.value)}
                  inputMode="numeric"
                  placeholder="0"
                />
                {errosNovo.total_comprimidos && (
                  <span className="erro">{errosNovo.total_comprimidos}</span>
                )}
              </div>
            </div>
            <div className="modal-acoes">
              <button
                type="button"
                className="btn btn-secundario"
                onClick={() => setModalAberto(false)}
                disabled={salvandoNovo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn btn-primario"
                onClick={salvarNovoMedicamento}
                disabled={salvandoNovo}
              >
                {salvandoNovo ? 'Salvando...' : 'Cadastrar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
