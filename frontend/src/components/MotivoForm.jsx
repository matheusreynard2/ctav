import { useEffect, useState } from 'react';

const FORM_INICIAL = { nome: '', descricao: '' };

// Formulario generico de motivo. A categoria (ADESAO/DESISTENCIA) e definida
// pela pagina e passada via prop; os rotulos se adaptam a ela.
export default function MotivoForm({
  categoria,
  rotuloSingular,
  motivoEditando,
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (motivoEditando) {
      setForm({
        nome: motivoEditando.nome ?? '',
        descricao: motivoEditando.descricao ?? '',
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [motivoEditando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((atual) => ({ ...atual, [name]: value }));
  };

  const validar = () => {
    const novosErros = {};
    const nomeLimpo = form.nome.trim();
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome';
    } else if (nomeLimpo.length < 2) {
      novosErros.nome = 'O nome deve ter ao menos 2 caracteres';
    } else if (nomeLimpo.length > 120) {
      novosErros.nome = 'O nome pode ter no máximo 120 caracteres';
    }
    if (form.descricao.trim().length > 255) {
      novosErros.descricao = 'A descrição pode ter no máximo 255 caracteres';
    }
    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({
      categoria,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
    });
  };

  const editando = Boolean(motivoEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>
          {editando ? `Editar ${rotuloSingular}` : `Novo ${rotuloSingular}`}
        </h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista"
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
          <label htmlFor="motivo-nome">Nome *</label>
          <input
            id="motivo-nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder={`Nome do ${rotuloSingular}`}
            maxLength={120}
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="motivo-descricao">Descrição (opcional)</label>
          <textarea
            id="motivo-descricao"
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            placeholder="Observação sobre este motivo"
            rows={3}
            maxLength={255}
          />
          {erros.descricao && <span className="erro">{erros.descricao}</span>}
          <span className="hint-contador">{form.descricao.length}/255</span>
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
