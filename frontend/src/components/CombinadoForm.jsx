import { useEffect, useMemo, useState } from 'react';
import {
  TIPOS_COMBINADO,
  TIPO_RESSOCIALIZACAO,
} from '../utils/combinados';
import { dataParaIso, isoParaData, maskData } from '../utils/masks';

const FORM_INICIAL = {
  acolhidoId: '',
  tipo: '',
  descricao: '',
  dataIda: '',
  dataVolta: '',
};

export default function CombinadoForm({
  combinadoEditando,
  acolhidosDisponiveis = [],
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (combinadoEditando) {
      setForm({
        acolhidoId:
          combinadoEditando.acolhidoId != null
            ? String(combinadoEditando.acolhidoId)
            : '',
        tipo: combinadoEditando.tipo ?? '',
        descricao: combinadoEditando.descricao ?? '',
        dataIda: isoParaData(combinadoEditando.dataIda),
        dataVolta: isoParaData(combinadoEditando.dataVolta),
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [combinadoEditando]);

  const acolhidosOrdenados = useMemo(
    () =>
      [...acolhidosDisponiveis].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [acolhidosDisponiveis]
  );

  const ehRessocializacao = form.tipo === TIPO_RESSOCIALIZACAO;

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;
    if (name === 'dataIda' || name === 'dataVolta') {
      novoValor = maskData(value);
    }

    setForm((atual) => {
      const proximo = { ...atual, [name]: novoValor };
      // ao trocar de tipo para algo diferente de ressocializacao, limpa as datas
      if (name === 'tipo' && value !== TIPO_RESSOCIALIZACAO) {
        proximo.dataIda = '';
        proximo.dataVolta = '';
      }
      return proximo;
    });

    if (name === 'tipo' && value !== TIPO_RESSOCIALIZACAO) {
      setErros((atual) => {
        const copia = { ...atual };
        delete copia.dataIda;
        delete copia.dataVolta;
        return copia;
      });
    }
  };

  const validar = () => {
    const novosErros = {};

    if (!form.acolhidoId) {
      novosErros.acolhidoId = 'Selecione o acolhido';
    }

    if (!form.tipo) {
      novosErros.tipo = 'Selecione o tipo de combinado';
    }

    const descricaoLimpa = form.descricao.trim();
    if (!descricaoLimpa) {
      novosErros.descricao = 'Informe a descrição';
    } else if (descricaoLimpa.length < 2) {
      novosErros.descricao = 'A descrição deve ter ao menos 2 caracteres';
    } else if (descricaoLimpa.length > 1000) {
      novosErros.descricao = 'A descrição pode ter no máximo 1000 caracteres';
    }

    if (form.tipo === TIPO_RESSOCIALIZACAO) {
      const isoIda = dataParaIso(form.dataIda);
      const isoVolta = dataParaIso(form.dataVolta);

      if (!form.dataIda.trim()) {
        novosErros.dataIda = 'Informe a data de ida';
      } else if (!isoIda) {
        novosErros.dataIda = 'Data inválida';
      }

      if (!form.dataVolta.trim()) {
        novosErros.dataVolta = 'Informe a data de volta';
      } else if (!isoVolta) {
        novosErros.dataVolta = 'Data inválida';
      }

      if (isoIda && isoVolta && isoVolta < isoIda) {
        novosErros.dataVolta = 'A data de volta não pode ser anterior à data de ida';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      acolhidoId: Number(form.acolhidoId),
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      dataIda: ehRessocializacao ? dataParaIso(form.dataIda) : null,
      dataVolta: ehRessocializacao ? dataParaIso(form.dataVolta) : null,
    };
    onSalvar(payload);
  };

  const editando = Boolean(combinadoEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar combinado' : 'Novo combinado'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de combinados"
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
        <div className="campo">
          <label htmlFor="combinado-acolhido">Acolhido *</label>
          <select
            id="combinado-acolhido"
            name="acolhidoId"
            value={form.acolhidoId}
            onChange={handleChange}
          >
            <option value="">Selecione o acolhido...</option>
            {acolhidosOrdenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          {acolhidosOrdenados.length === 0 && (
            <span className="campo-ajuda">
              Nenhum acolhido cadastrado. Cadastre um acolhido antes de criar um combinado.
            </span>
          )}
          {erros.acolhidoId && <span className="erro">{erros.acolhidoId}</span>}
        </div>

        <div className="campo">
          <label htmlFor="combinado-tipo">Tipo de combinado *</label>
          <select
            id="combinado-tipo"
            name="tipo"
            value={form.tipo}
            onChange={handleChange}
          >
            <option value="">Selecione o tipo...</option>
            {TIPOS_COMBINADO.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.rotulo}
              </option>
            ))}
          </select>
          {erros.tipo && <span className="erro">{erros.tipo}</span>}
        </div>

        {ehRessocializacao && (
          <>
            <div className="campo">
              <label htmlFor="combinado-data-ida">Data de ida *</label>
              <input
                id="combinado-data-ida"
                name="dataIda"
                value={form.dataIda}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                maxLength={10}
              />
              {erros.dataIda && <span className="erro">{erros.dataIda}</span>}
            </div>

            <div className="campo">
              <label htmlFor="combinado-data-volta">Data de volta *</label>
              <input
                id="combinado-data-volta"
                name="dataVolta"
                value={form.dataVolta}
                onChange={handleChange}
                placeholder="dd/mm/aaaa"
                inputMode="numeric"
                maxLength={10}
              />
              {erros.dataVolta && <span className="erro">{erros.dataVolta}</span>}
            </div>
          </>
        )}

        <div className="campo campo-largo">
          <label htmlFor="combinado-descricao">Descrição *</label>
          <textarea
            id="combinado-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Detalhes do combinado (motivo, local, horário, observações)"
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
