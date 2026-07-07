import { useEffect, useState } from 'react';
import { dataParaIso, isoParaData, maskData } from '../utils/masks';
import SelecaoAcolhidos from './SelecaoAcolhidos.jsx';

const FORM_INICIAL = {
  acolhidoIds: [],
  titulo: '',
  descricao: '',
  dataOcorrencia: '',
};

export default function OcorrenciaForm({
  ocorrenciaEditando,
  acolhidosDisponiveis = [],
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (ocorrenciaEditando) {
      setForm({
        acolhidoIds: Array.isArray(ocorrenciaEditando.acolhidoIds)
          ? ocorrenciaEditando.acolhidoIds.map((x) => Number(x))
          : [],
        titulo: ocorrenciaEditando.titulo ?? '',
        descricao: ocorrenciaEditando.descricao ?? '',
        dataOcorrencia: isoParaData(ocorrenciaEditando.dataOcorrencia),
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [ocorrenciaEditando]);

  // Nomes registrados que não estão mais entre os acolhidos ativos (ex.: acolhido
  // excluído). Exibidos apenas como informação de histórico.
  const nomesSnapshot =
    ocorrenciaEditando?.acolhidosNomes &&
    (!ocorrenciaEditando.acolhidoIds ||
      ocorrenciaEditando.acolhidoIds.length === 0)
      ? ocorrenciaEditando.acolhidosNomes
      : null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    const novoValor = name === 'dataOcorrencia' ? maskData(value) : value;
    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const setAcolhidoIds = (ids) => {
    setForm((atual) => ({ ...atual, acolhidoIds: ids }));
  };

  const validar = () => {
    const novosErros = {};

    const tituloLimpo = form.titulo.trim();
    if (!tituloLimpo) {
      novosErros.titulo = 'Informe qual foi a ocorrência';
    } else if (tituloLimpo.length < 2) {
      novosErros.titulo = 'A ocorrência deve ter ao menos 2 caracteres';
    } else if (tituloLimpo.length > 200) {
      novosErros.titulo = 'A ocorrência pode ter no máximo 200 caracteres';
    }

    const descricaoLimpa = form.descricao.trim();
    if (!descricaoLimpa) {
      novosErros.descricao = 'Informe a descrição';
    } else if (descricaoLimpa.length < 2) {
      novosErros.descricao = 'A descrição deve ter ao menos 2 caracteres';
    } else if (descricaoLimpa.length > 1000) {
      novosErros.descricao = 'A descrição pode ter no máximo 1000 caracteres';
    }

    if (form.dataOcorrencia.trim() && !dataParaIso(form.dataOcorrencia)) {
      novosErros.dataOcorrencia = 'Data inválida';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      acolhidoIds: form.acolhidoIds.map((x) => Number(x)),
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim(),
      dataOcorrencia: form.dataOcorrencia.trim()
        ? dataParaIso(form.dataOcorrencia)
        : null,
    };
    onSalvar(payload);
  };

  const editando = Boolean(ocorrenciaEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar ocorrência' : 'Nova ocorrência'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de ocorrências"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Ver lista
          </button>
        </div>
      </div>

      <div className="grid">
        <div className="campo campo-largo">
          <label htmlFor="ocorrencia-acolhidos-busca">
            Acolhidos envolvidos (opcional)
          </label>
          <SelecaoAcolhidos
            id="ocorrencia-acolhidos"
            acolhidos={acolhidosDisponiveis}
            selecionados={form.acolhidoIds}
            onChange={setAcolhidoIds}
            vazioTexto="Nenhum acolhido cadastrado."
          />
          {nomesSnapshot && (
            <span className="campo-ajuda">
              Registrada originalmente para: {nomesSnapshot} (sem vínculo ativo —
              selecione os acolhidos novamente, se desejar).
            </span>
          )}
          <span className="campo-ajuda">
            Selecione um ou mais acolhidos envolvidos na ocorrência. Deixe vazio
            se não houver vínculo.
          </span>
        </div>

        <div className="campo">
          <label htmlFor="ocorrencia-data">Data da ocorrência</label>
          <input
            id="ocorrencia-data"
            name="dataOcorrencia"
            value={form.dataOcorrencia}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataOcorrencia && (
            <span className="erro">{erros.dataOcorrencia}</span>
          )}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="ocorrencia-titulo">Qual foi a ocorrência? *</label>
          <input
            id="ocorrencia-titulo"
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            placeholder="Ex.: Discussão no refeitório, saída sem autorização..."
            maxLength={200}
          />
          {erros.titulo && <span className="erro">{erros.titulo}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="ocorrencia-descricao">Descrição *</label>
          <textarea
            id="ocorrencia-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descreva o que aconteceu (contexto, envolvidos, providências)"
            rows={4}
            maxLength={1000}
          />
          {erros.descricao && <span className="erro">{erros.descricao}</span>}
          <span className="hint-contador">{form.descricao.length}/1000</span>
        </div>
      </div>

      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Cadastrar'}
        </button>
        {editando && (
          <button type="button" className="btn btn-secundario" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
