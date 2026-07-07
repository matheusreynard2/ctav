import { useState } from 'react';
import { dataParaIso, isoParaData, maskData } from '../utils/masks';
import SelecaoAcolhidos from './SelecaoAcolhidos.jsx';

const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.slice(0, 10).split('-');
  return `${dia}/${mes}/${ano}`;
};

const editorVazio = (acolhidoId) => ({
  acolhidoIds: acolhidoId != null ? [Number(acolhidoId)] : [],
  titulo: '',
  descricao: '',
  dataOcorrencia: '',
});

// Valida os campos comuns de uma ocorrência; retorna objeto de erros.
const validarEditor = (dados) => {
  const erros = {};
  const titulo = dados.titulo.trim();
  if (!titulo || titulo.length < 2) {
    erros.titulo = 'Informe a ocorrência (mín. 2 caracteres).';
  }
  const descricao = dados.descricao.trim();
  if (!descricao || descricao.length < 2) {
    erros.descricao = 'Informe a descrição (mín. 2 caracteres).';
  }
  if (dados.dataOcorrencia.trim() && !dataParaIso(dados.dataOcorrencia)) {
    erros.dataOcorrencia = 'Data inválida.';
  }
  return erros;
};

const paraPayload = (dados) => ({
  acolhidoIds: dados.acolhidoIds.map((x) => Number(x)),
  titulo: dados.titulo.trim(),
  descricao: dados.descricao.trim(),
  dataOcorrencia: dados.dataOcorrencia.trim()
    ? dataParaIso(dados.dataOcorrencia)
    : null,
});

// Campos reutilizados no editor (nova e edição inline).
function EditorOcorrencia({ dados, erros, acolhidosDisponiveis, onChange, idPrefixo }) {
  const set = (campo, valor) => onChange({ ...dados, [campo]: valor });

  return (
    <div className="grid ocorrencia-editor-grid">
      <div className="campo campo-largo">
        <label>Acolhidos envolvidos</label>
        <SelecaoAcolhidos
          id={`${idPrefixo}-acolhidos`}
          acolhidos={acolhidosDisponiveis}
          selecionados={dados.acolhidoIds}
          onChange={(ids) => set('acolhidoIds', ids)}
          vazioTexto="Nenhum acolhido cadastrado."
        />
      </div>

      <div className="campo">
        <label htmlFor={`${idPrefixo}-data`}>Data da ocorrência</label>
        <input
          id={`${idPrefixo}-data`}
          value={dados.dataOcorrencia}
          onChange={(e) => set('dataOcorrencia', maskData(e.target.value))}
          placeholder="dd/mm/aaaa"
          inputMode="numeric"
          maxLength={10}
        />
        {erros.dataOcorrencia && <span className="erro">{erros.dataOcorrencia}</span>}
      </div>

      <div className="campo campo-largo">
        <label htmlFor={`${idPrefixo}-titulo`}>Qual foi a ocorrência? *</label>
        <input
          id={`${idPrefixo}-titulo`}
          value={dados.titulo}
          onChange={(e) => set('titulo', e.target.value)}
          placeholder="Ex.: Discussão no refeitório..."
          maxLength={200}
        />
        {erros.titulo && <span className="erro">{erros.titulo}</span>}
      </div>

      <div className="campo campo-largo">
        <label htmlFor={`${idPrefixo}-descricao`}>Descrição *</label>
        <textarea
          id={`${idPrefixo}-descricao`}
          value={dados.descricao}
          onChange={(e) => set('descricao', e.target.value)}
          placeholder="Descreva o que aconteceu"
          rows={3}
          maxLength={1000}
        />
        {erros.descricao && <span className="erro">{erros.descricao}</span>}
      </div>
    </div>
  );
}

export default function OcorrenciasDoAcolhido({
  acolhidoId,
  ocorrencias = [],
  acolhidosDisponiveis = [],
  onCriar,
  onAtualizar,
  onExcluir,
  salvando = false,
}) {
  const [mostrarNova, setMostrarNova] = useState(false);
  const [nova, setNova] = useState(() => editorVazio(acolhidoId));
  const [errosNova, setErrosNova] = useState({});

  const [editId, setEditId] = useState(null);
  const [edit, setEdit] = useState(editorVazio(acolhidoId));
  const [errosEdit, setErrosEdit] = useState({});

  const abrirNova = () => {
    setNova(editorVazio(acolhidoId));
    setErrosNova({});
    setMostrarNova(true);
  };

  const cancelarNova = () => {
    setMostrarNova(false);
    setErrosNova({});
  };

  const salvarNova = async () => {
    const erros = validarEditor(nova);
    if (Object.keys(erros).length > 0) {
      setErrosNova(erros);
      return;
    }
    const ok = await onCriar(paraPayload(nova));
    if (ok) {
      setMostrarNova(false);
      setNova(editorVazio(acolhidoId));
      setErrosNova({});
    }
  };

  const iniciarEdicao = (o) => {
    setEditId(o.id);
    setEdit({
      acolhidoIds: Array.isArray(o.acolhidoIds)
        ? o.acolhidoIds.map((x) => Number(x))
        : [],
      titulo: o.titulo ?? '',
      descricao: o.descricao ?? '',
      dataOcorrencia: isoParaData(o.dataOcorrencia),
    });
    setErrosEdit({});
  };

  const cancelarEdicao = () => {
    setEditId(null);
    setErrosEdit({});
  };

  const salvarEdicao = async (id) => {
    const erros = validarEditor(edit);
    if (Object.keys(erros).length > 0) {
      setErrosEdit(erros);
      return;
    }
    const ok = await onAtualizar(id, paraPayload(edit));
    if (ok) {
      setEditId(null);
      setErrosEdit({});
    }
  };

  return (
    <div className="grid">
      <div className="campo campo-largo">
        <div className="ocorrencias-inline-cabecalho">
          <label>Ocorrências relacionadas ({ocorrencias.length})</label>
          {!mostrarNova && (
            <button
              type="button"
              className="btn btn-secundario btn-pequeno"
              onClick={abrirNova}
            >
              Nova ocorrência
            </button>
          )}
        </div>

        {mostrarNova && (
          <div className="ocorrencia-editor">
            <h4 className="ocorrencia-editor-titulo">Nova ocorrência</h4>
            <EditorOcorrencia
              dados={nova}
              erros={errosNova}
              acolhidosDisponiveis={acolhidosDisponiveis}
              onChange={setNova}
              idPrefixo="nova-ocorrencia"
            />
            <div className="acoes">
              <button
                type="button"
                className="btn btn-primario"
                onClick={salvarNova}
                disabled={salvando}
              >
                {salvando ? 'Salvando...' : 'Adicionar'}
              </button>
              <button
                type="button"
                className="btn btn-secundario"
                onClick={cancelarNova}
                disabled={salvando}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {ocorrencias.length === 0 ? (
          <p className="detalhes-vazio">Nenhuma ocorrência relacionada a este acolhido.</p>
        ) : (
          <ul className="ocorrencias-inline-lista">
            {ocorrencias.map((o) => (
              <li key={o.id} className="ocorrencia-inline-item">
                {editId === o.id ? (
                  <div className="ocorrencia-editor">
                    <h4 className="ocorrencia-editor-titulo">Editar ocorrência</h4>
                    <EditorOcorrencia
                      dados={edit}
                      erros={errosEdit}
                      acolhidosDisponiveis={acolhidosDisponiveis}
                      onChange={setEdit}
                      idPrefixo={`editar-ocorrencia-${o.id}`}
                    />
                    <div className="acoes">
                      <button
                        type="button"
                        className="btn btn-primario"
                        onClick={() => salvarEdicao(o.id)}
                        disabled={salvando}
                      >
                        {salvando ? 'Salvando...' : 'Salvar'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-secundario"
                        onClick={cancelarEdicao}
                        disabled={salvando}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="ocorrencia-inline-conteudo">
                    <div className="ocorrencia-inline-info">
                      <span className="detalhes-ocorrencia-titulo">{o.titulo ?? '-'}</span>
                      {o.dataOcorrencia ? (
                        <span className="detalhes-ocorrencia-data">
                          {`Data: ${formatarData(o.dataOcorrencia)}`}
                        </span>
                      ) : null}
                      {(o.acolhidoIds?.length ?? 0) > 1 && o.acolhidosResumo ? (
                        <span className="detalhes-ocorrencia-data">
                          {`Envolvidos: ${o.acolhidosResumo}`}
                        </span>
                      ) : null}
                      {o.descricao ? (
                        <span className="detalhes-ocorrencia-descricao">
                          {String(o.descricao).trim()}
                        </span>
                      ) : null}
                    </div>
                    <div className="ocorrencia-inline-acoes">
                      <button
                        type="button"
                        className="btn btn-icone"
                        onClick={() => iniciarEdicao(o)}
                        title="Editar"
                        aria-label="Editar ocorrência"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                        <span className="acao-label">Editar</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-icone btn-perigo"
                        onClick={() => onExcluir(o)}
                        title="Excluir"
                        aria-label="Excluir ocorrência"
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
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
