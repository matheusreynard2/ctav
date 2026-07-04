import { useEffect, useState } from 'react';

const FORM_INICIAL = {
  nome: '',
  descricao: '',
  quantidade_caixas: '',
  quantidade_por_caixa: '',
};

export default function MedicamentoForm({
  medicamentoEditando,
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (medicamentoEditando) {
      setForm({
        nome: medicamentoEditando.nome ?? '',
        descricao: medicamentoEditando.descricao ?? '',
        quantidade_caixas:
          medicamentoEditando.quantidade_caixas != null
            ? String(medicamentoEditando.quantidade_caixas)
            : '',
        quantidade_por_caixa:
          medicamentoEditando.quantidade_por_caixa != null
            ? String(medicamentoEditando.quantidade_por_caixa)
            : '',
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [medicamentoEditando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;
    if (name === 'quantidade_caixas' || name === 'quantidade_por_caixa') {
      novoValor = value.replace(/\D/g, '');
    }
    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const validar = () => {
    const novosErros = {};
    if (!form.nome.trim()) {
      novosErros.nome = 'Informe o nome';
    } else if (form.nome.trim().length < 2) {
      novosErros.nome = 'O nome deve ter ao menos 2 caracteres';
    }

    const descricaoLimpa = form.descricao.trim();
    if (!descricaoLimpa) {
      novosErros.descricao = 'Informe a descrição';
    } else if (descricaoLimpa.length < 2) {
      novosErros.descricao = 'A descrição deve ter ao menos 2 caracteres';
    } else if (descricaoLimpa.length > 255) {
      novosErros.descricao = 'A descrição pode ter no máximo 255 caracteres';
    }

    if (form.quantidade_caixas === '' || form.quantidade_caixas == null) {
      novosErros.quantidade_caixas = 'Informe a quantidade de caixas';
    } else {
      const numero = Number(form.quantidade_caixas);
      if (Number.isNaN(numero) || numero < 0) {
        novosErros.quantidade_caixas = 'A quantidade não pode ser negativa';
      }
    }

    if (form.quantidade_por_caixa === '' || form.quantidade_por_caixa == null) {
      novosErros.quantidade_por_caixa = 'Informe a quantidade por caixa';
    } else {
      const numero = Number(form.quantidade_por_caixa);
      if (Number.isNaN(numero) || numero < 0) {
        novosErros.quantidade_por_caixa = 'A quantidade não pode ser negativa';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      quantidade_caixas: Number(form.quantidade_caixas),
      quantidade_por_caixa: Number(form.quantidade_por_caixa),
    };
    onSalvar(payload);
  };

  const editando = Boolean(medicamentoEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar medicamento' : 'Novo medicamento'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de medicamentos"
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
          <label htmlFor="medicamento-nome">Nome *</label>
          <input
            id="medicamento-nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do medicamento"
            maxLength={120}
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="medicamento-descricao">Descrição *</label>
          <textarea
            id="medicamento-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição do medicamento (uso, posologia resumida, observações)"
            rows={4}
            maxLength={255}
          />
          {erros.descricao && <span className="erro">{erros.descricao}</span>}
          <span className="hint-contador">{form.descricao.length}/255</span>
        </div>

        <div className="campo">
          <label htmlFor="medicamento-quantidade">Quantidade de caixas *</label>
          <input
            id="medicamento-quantidade"
            name="quantidade_caixas"
            value={form.quantidade_caixas}
            onChange={handleChange}
            placeholder="0"
            inputMode="numeric"
          />
          {erros.quantidade_caixas && (
            <span className="erro">{erros.quantidade_caixas}</span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="medicamento-quantidade-por-caixa">
            Quantidade de comprimidos por caixa *
          </label>
          <input
            id="medicamento-quantidade-por-caixa"
            name="quantidade_por_caixa"
            value={form.quantidade_por_caixa}
            onChange={handleChange}
            placeholder="0"
            inputMode="numeric"
          />
          {erros.quantidade_por_caixa && (
            <span className="erro">{erros.quantidade_por_caixa}</span>
          )}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="medicamento-total-comprimidos">Total de comprimidos</label>
          <input
            id="medicamento-total-comprimidos"
            value={
              (Number(form.quantidade_caixas) || 0) *
              (Number(form.quantidade_por_caixa) || 0)
            }
            readOnly
            tabIndex={-1}
          />
          <span className="campo-ajuda">
            Calculado automaticamente: quantidade de caixas × comprimidos por caixa.
          </span>
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
