import { useEffect, useMemo, useState } from 'react';
import { STATUS_CONSULTA } from '../utils/consultas';

const FORM_INICIAL = {
  acolhidoId: '',
  dataHora: '',
  status: 'AGENDADA',
  profissional: '',
  local: '',
  descricao: '',
  resumo: '',
};

// Converte o ISO vindo do backend ("2026-07-15T14:30:00") para o formato do
// input datetime-local ("2026-07-15T14:30").
const isoParaInputDataHora = (valor) => {
  if (!valor) return '';
  const texto = String(valor);
  return texto.length >= 16 ? texto.slice(0, 16) : texto;
};

export default function ConsultaForm({
  consultaEditando,
  acolhidosDisponiveis = [],
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (consultaEditando) {
      setForm({
        acolhidoId:
          consultaEditando.acolhidoId != null
            ? String(consultaEditando.acolhidoId)
            : '',
        dataHora: isoParaInputDataHora(consultaEditando.dataHora),
        status: consultaEditando.status ?? 'AGENDADA',
        profissional: consultaEditando.profissional ?? '',
        local: consultaEditando.local ?? '',
        descricao: consultaEditando.descricao ?? '',
        resumo: consultaEditando.resumo ?? '',
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [consultaEditando]);

  const acolhidosOrdenados = useMemo(
    () =>
      [...acolhidosDisponiveis].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [acolhidosDisponiveis]
  );

  const ehRealizada = form.status === 'REALIZADA';
  // Consulta que já estava realizada ao abrir a edição: a situação fica travada
  // (não pode voltar atrás), mas todos os demais campos são editáveis.
  const situacaoTravada = consultaEditando?.status === 'REALIZADA';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  };

  const validar = () => {
    const novosErros = {};

    if (!form.acolhidoId) {
      novosErros.acolhidoId = 'Selecione o acolhido';
    }

    if (!form.dataHora) {
      novosErros.dataHora = 'Informe a data e a hora';
    } else if (Number.isNaN(new Date(form.dataHora).getTime())) {
      novosErros.dataHora = 'Data/hora inválida';
    }

    const descricaoLimpa = form.descricao.trim();
    if (!descricaoLimpa) {
      novosErros.descricao = 'Informe a descrição';
    } else if (descricaoLimpa.length < 2) {
      novosErros.descricao = 'A descrição deve ter ao menos 2 caracteres';
    } else if (descricaoLimpa.length > 1000) {
      novosErros.descricao = 'A descrição pode ter no máximo 1000 caracteres';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      acolhidoId: Number(form.acolhidoId),
      // datetime-local já entrega "YYYY-MM-DDTHH:mm" (LocalDateTime no backend).
      dataHora: form.dataHora,
      status: form.status || 'AGENDADA',
      profissional: form.profissional.trim() || null,
      local: form.local.trim() || null,
      descricao: form.descricao.trim(),
      // O resumo só faz sentido para consultas realizadas.
      resumo: ehRealizada ? form.resumo.trim() || null : null,
    };
    onSalvar(payload);
  };

  const editando = Boolean(consultaEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar consulta' : 'Agendar consulta'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de consultas"
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
          <label htmlFor="consulta-acolhido">Acolhido *</label>
          <select
            id="consulta-acolhido"
            name="acolhidoId"
            value={form.acolhidoId}
            onChange={handleChange}
          >
            <option value="">Selecione o acolhido...</option>
            {acolhidosOrdenados.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
                {a.cpf ? ` — CPF ${a.cpf}` : ''}
              </option>
            ))}
          </select>
          {acolhidosOrdenados.length === 0 && (
            <span className="campo-ajuda">
              Nenhum acolhido cadastrado. Cadastre um acolhido antes de agendar uma consulta.
            </span>
          )}
          {erros.acolhidoId && <span className="erro">{erros.acolhidoId}</span>}
        </div>

        <div className="campo">
          <label htmlFor="consulta-data-hora">Data e hora *</label>
          <input
            id="consulta-data-hora"
            type="datetime-local"
            name="dataHora"
            value={form.dataHora}
            onChange={handleChange}
          />
          {erros.dataHora && <span className="erro">{erros.dataHora}</span>}
        </div>

        <div className="campo">
          <label htmlFor="consulta-status">Situação</label>
          <select
            id="consulta-status"
            name="status"
            value={form.status}
            onChange={handleChange}
            disabled={situacaoTravada}
          >
            {STATUS_CONSULTA.map((s) => (
              <option key={s.valor} value={s.valor}>
                {s.rotulo}
              </option>
            ))}
          </select>
          {situacaoTravada && (
            <span className="campo-ajuda">
              A situação de uma consulta realizada não pode ser alterada.
            </span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="consulta-profissional">Profissional</label>
          <input
            id="consulta-profissional"
            name="profissional"
            value={form.profissional}
            onChange={handleChange}
            placeholder="Nome do profissional (ex.: psicólogo)"
            maxLength={150}
          />
          {erros.profissional && <span className="erro">{erros.profissional}</span>}
        </div>

        <div className="campo">
          <label htmlFor="consulta-local">Local</label>
          <input
            id="consulta-local"
            name="local"
            value={form.local}
            onChange={handleChange}
            placeholder="Local da consulta"
            maxLength={150}
          />
          {erros.local && <span className="erro">{erros.local}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="consulta-descricao">Descrição *</label>
          <textarea
            id="consulta-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Motivo, objetivo e observações da consulta"
            rows={4}
            maxLength={1000}
          />
          {erros.descricao && <span className="erro">{erros.descricao}</span>}
          <span className="hint-contador">{form.descricao.length}/1000</span>
        </div>

        {ehRealizada && (
          <div className="campo campo-largo">
            <label htmlFor="consulta-resumo">Resumo da consulta (realizada)</label>
            <textarea
              id="consulta-resumo"
              name="resumo"
              value={form.resumo}
              onChange={handleChange}
              placeholder="Descreva o que foi tratado/observado na consulta realizada"
              rows={4}
              maxLength={4000}
            />
            <span className="campo-ajuda">
              Ao salvar como realizada, a consulta ficará bloqueada para edição —
              apenas visualização e exclusão continuarão disponíveis.
            </span>
            <span className="hint-contador">{form.resumo.length}/4000</span>
          </div>
        )}
      </div>

      <div className="acoes">
        <button type="submit" className="btn btn-primario" disabled={salvando}>
          {salvando ? 'Salvando...' : editando ? 'Atualizar' : 'Agendar'}
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
