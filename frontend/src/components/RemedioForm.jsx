import { useEffect, useState } from 'react';

const FORM_INICIAL = {
  nome: '',
  descricao: '',
  quantidade_caixas: '',
};

export default function RemedioForm({ remedioEditando, onSalvar, onCancelar, salvando }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (remedioEditando) {
      setForm({
        nome: remedioEditando.nome ?? '',
        descricao: remedioEditando.descricao ?? '',
        quantidade_caixas:
          remedioEditando.quantidade_caixas != null
            ? String(remedioEditando.quantidade_caixas)
            : '',
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [remedioEditando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;
    if (name === 'quantidade_caixas') {
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
    };
    onSalvar(payload);
  };

  const editando = Boolean(remedioEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editando ? 'Editar remédio' : 'Novo remédio'}</h2>

      <div className="grid">
        <div className="campo campo-largo">
          <label htmlFor="remedio-nome">Nome *</label>
          <input
            id="remedio-nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome do remédio"
            maxLength={120}
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="remedio-descricao">Descrição *</label>
          <textarea
            id="remedio-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Descrição do remédio (uso, posologia resumida, observações)"
            rows={4}
            maxLength={255}
          />
          {erros.descricao && <span className="erro">{erros.descricao}</span>}
          <span className="hint-contador">{form.descricao.length}/255</span>
        </div>

        <div className="campo campo-largo">
          <label htmlFor="remedio-quantidade">Quantidade de caixas *</label>
          <input
            id="remedio-quantidade"
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
