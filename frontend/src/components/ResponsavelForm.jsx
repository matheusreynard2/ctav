import { useEffect, useState } from 'react';
import { maskCelular, maskCep, maskCpf } from '../utils/masks';

const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
  'SP', 'SE', 'TO',
];

const FORM_INICIAL = {
  nome: '',
  rg: '',
  cpf: '',
  endereco: '',
  bairro: '',
  cidade: '',
  estado: '',
  cep: '',
  celular: '',
  conveniado: false,
};

export default function ResponsavelForm({
  responsavelEditando,
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (responsavelEditando) {
      setForm({
        nome: responsavelEditando.nome ?? '',
        rg: responsavelEditando.rg ?? '',
        cpf: maskCpf(responsavelEditando.cpf ?? ''),
        endereco: responsavelEditando.endereco ?? '',
        bairro: responsavelEditando.bairro ?? '',
        cidade: responsavelEditando.cidade ?? '',
        estado: responsavelEditando.estado ?? '',
        cep: maskCep(responsavelEditando.cep ?? ''),
        celular: maskCelular(responsavelEditando.celular ?? ''),
        conveniado: Boolean(responsavelEditando.conveniado),
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [responsavelEditando]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let novoValor = type === 'checkbox' ? checked : value;
    if (name === 'cpf') novoValor = maskCpf(value);
    else if (name === 'celular') novoValor = maskCelular(value);
    else if (name === 'cep') novoValor = maskCep(value);
    else if (name === 'estado') novoValor = value.toUpperCase();
    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const validar = () => {
    const novosErros = {};

    const nomeLimpo = form.nome.trim();
    if (!nomeLimpo) {
      novosErros.nome = 'Informe o nome';
    } else if (nomeLimpo.length < 2) {
      novosErros.nome = 'O nome deve ter ao menos 2 caracteres';
    }

    const cpfDigitos = form.cpf.replace(/\D/g, '');
    if (!cpfDigitos) {
      novosErros.cpf = 'Informe o CPF';
    } else if (cpfDigitos.length !== 11) {
      novosErros.cpf = 'CPF deve ter 11 dígitos';
    }

    const celDigitos = form.celular.replace(/\D/g, '');
    if (celDigitos && celDigitos.length !== 11) {
      novosErros.celular = 'Celular deve ter DDD + 9 dígitos';
    }

    if (form.estado && form.estado.length !== 2) {
      novosErros.estado = 'Use a sigla do estado (UF)';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;
    onSalvar({
      nome: form.nome.trim(),
      rg: form.rg.trim() || null,
      cpf: form.cpf,
      endereco: form.endereco.trim() || null,
      bairro: form.bairro.trim() || null,
      cidade: form.cidade.trim() || null,
      estado: form.estado.trim() || null,
      cep: form.cep.trim() || null,
      celular: form.celular.trim() || null,
      conveniado: form.conveniado,
    });
  };

  const editando = Boolean(responsavelEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <div className="form-cabecalho">
        <h2>{editando ? 'Editar responsável' : 'Novo responsável'}</h2>
        <div className="form-cabecalho-acoes">
          <button
            type="button"
            className="btn btn-secundario btn-novo"
            onClick={onVerLista}
            title="Ver lista de responsáveis"
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
          <label htmlFor="resp-nome">Nome *</label>
          <input
            id="resp-nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome completo do responsável"
            maxLength={120}
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo">
          <label htmlFor="resp-cpf">CPF *</label>
          <input
            id="resp-cpf"
            name="cpf"
            value={form.cpf}
            onChange={handleChange}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
          />
          {erros.cpf && <span className="erro">{erros.cpf}</span>}
        </div>

        <div className="campo">
          <label htmlFor="resp-rg">RG</label>
          <input
            id="resp-rg"
            name="rg"
            value={form.rg}
            onChange={handleChange}
            placeholder="Documento de identidade"
            maxLength={20}
          />
          {erros.rg && <span className="erro">{erros.rg}</span>}
        </div>

        <div className="campo">
          <label htmlFor="resp-celular">Celular</label>
          <input
            id="resp-celular"
            name="celular"
            value={form.celular}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            maxLength={15}
          />
          {erros.celular && <span className="erro">{erros.celular}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="resp-endereco">Endereço</label>
          <input
            id="resp-endereco"
            name="endereco"
            value={form.endereco}
            onChange={handleChange}
            placeholder="Rua, número, complemento"
            maxLength={200}
          />
        </div>

        <div className="campo">
          <label htmlFor="resp-bairro">Bairro</label>
          <input
            id="resp-bairro"
            name="bairro"
            value={form.bairro}
            onChange={handleChange}
            placeholder="Bairro"
            maxLength={100}
          />
        </div>

        <div className="campo">
          <label htmlFor="resp-cidade">Cidade</label>
          <input
            id="resp-cidade"
            name="cidade"
            value={form.cidade}
            onChange={handleChange}
            placeholder="Cidade"
            maxLength={100}
          />
        </div>

        <div className="campo">
          <label htmlFor="resp-estado">Estado (UF)</label>
          <select
            id="resp-estado"
            name="estado"
            value={form.estado}
            onChange={handleChange}
          >
            <option value="">Selecione...</option>
            {UFS.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
          {erros.estado && <span className="erro">{erros.estado}</span>}
        </div>

        <div className="campo">
          <label htmlFor="resp-cep">CEP</label>
          <input
            id="resp-cep"
            name="cep"
            value={form.cep}
            onChange={handleChange}
            placeholder="00000-000"
            inputMode="numeric"
            maxLength={9}
          />
        </div>

        <div className="campo campo-largo">
          <label className="campo-check">
            <input
              type="checkbox"
              name="conveniado"
              checked={form.conveniado}
              onChange={handleChange}
            />
            <span>Conveniado</span>
          </label>
          <span className="campo-ajuda">
            Marque se o responsável é conveniado.
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
