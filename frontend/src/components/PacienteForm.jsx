import { useEffect, useState } from 'react';
import {
  dataParaIso,
  isoParaData,
  maskCelular,
  maskCpf,
  maskData,
} from '../utils/masks';

const FORM_INICIAL = {
  nome: '',
  cpf: '',
  dataNascimento: '',
  email: '',
  telefone: '',
  sexo: '',
  endereco: '',
  remedios_prescritos: [],
};

export default function PacienteForm({ pacienteEditando, onSalvar, onCancelar, salvando }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [novoRemedio, setNovoRemedio] = useState('');
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (pacienteEditando) {
      setForm({
        nome: pacienteEditando.nome ?? '',
        cpf: maskCpf(pacienteEditando.cpf ?? ''),
        dataNascimento: isoParaData(pacienteEditando.dataNascimento),
        email: pacienteEditando.email ?? '',
        telefone: maskCelular(pacienteEditando.telefone ?? ''),
        sexo: pacienteEditando.sexo ?? '',
        endereco: pacienteEditando.endereco ?? '',
        remedios_prescritos: Array.isArray(pacienteEditando.remedios_prescritos)
          ? [...pacienteEditando.remedios_prescritos]
          : [],
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setNovoRemedio('');
    setErros({});
  }, [pacienteEditando]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === 'cpf') novoValor = maskCpf(value);
    else if (name === 'telefone') novoValor = maskCelular(value);
    else if (name === 'dataNascimento') novoValor = maskData(value);

    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const adicionarRemedio = () => {
    const valor = novoRemedio.trim();
    if (!valor) return;

    const jaExiste = form.remedios_prescritos.some(
      (r) => r.toLowerCase() === valor.toLowerCase()
    );
    if (jaExiste) {
      setErros((e) => ({ ...e, remedios_prescritos: 'Esse remédio já está na lista' }));
      return;
    }

    setForm((atual) => ({
      ...atual,
      remedios_prescritos: [...atual.remedios_prescritos, valor],
    }));
    setNovoRemedio('');
    setErros((e) => {
      const { remedios_prescritos, ...resto } = e;
      return resto;
    });
  };

  const removerRemedio = (indice) => {
    setForm((atual) => ({
      ...atual,
      remedios_prescritos: atual.remedios_prescritos.filter((_, i) => i !== indice),
    }));
  };

  const handleRemedioKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      adicionarRemedio();
    }
  };

  const validar = () => {
    const novosErros = {};

    if (!form.nome.trim()) novosErros.nome = 'Informe o nome';

    const cpfDigitos = form.cpf.replace(/\D/g, '');
    if (!cpfDigitos) {
      novosErros.cpf = 'Informe o CPF';
    } else if (cpfDigitos.length !== 11) {
      novosErros.cpf = 'CPF deve ter 11 dígitos';
    }

    if (!form.dataNascimento.trim()) {
      novosErros.dataNascimento = 'Informe a data de nascimento';
    } else {
      const iso = dataParaIso(form.dataNascimento);
      if (!iso) {
        novosErros.dataNascimento = 'Data inválida';
      } else if (new Date(iso) > new Date()) {
        novosErros.dataNascimento = 'A data deve estar no passado';
      }
    }

    const telDigitos = form.telefone.replace(/\D/g, '');
    if (telDigitos && telDigitos.length !== 11) {
      novosErros.telefone = 'Celular deve ter DDD + 9 dígitos';
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    const payload = {
      nome: form.nome.trim(),
      cpf: form.cpf,
      dataNascimento: dataParaIso(form.dataNascimento),
      email: form.email || null,
      telefone: form.telefone || null,
      sexo: form.sexo || null,
      endereco: form.endereco || null,
      remedios_prescritos: form.remedios_prescritos.length
        ? form.remedios_prescritos
        : null,
    };
    onSalvar(payload);
  };

  const editando = Boolean(pacienteEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editando ? 'Editar paciente' : 'Novo paciente'}</h2>

      <div className="grid">
        <div className="campo">
          <label htmlFor="nome">Nome *</label>
          <input
            id="nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            placeholder="Nome completo"
          />
          {erros.nome && <span className="erro">{erros.nome}</span>}
        </div>

        <div className="campo">
          <label htmlFor="cpf">CPF *</label>
          <input
            id="cpf"
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
          <label htmlFor="dataNascimento">Data de nascimento *</label>
          <input
            id="dataNascimento"
            name="dataNascimento"
            value={form.dataNascimento}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataNascimento && <span className="erro">{erros.dataNascimento}</span>}
        </div>

        <div className="campo">
          <label htmlFor="sexo">Sexo</label>
          <select id="sexo" name="sexo" value={form.sexo} onChange={handleChange}>
            <option value="">Selecione...</option>
            <option value="MASCULINO">Masculino</option>
            <option value="FEMININO">Feminino</option>
            <option value="OUTRO">Outro</option>
          </select>
        </div>

        <div className="campo">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="paciente@email.com"
          />
        </div>

        <div className="campo">
          <label htmlFor="telefone">Celular</label>
          <input
            id="telefone"
            name="telefone"
            value={form.telefone}
            onChange={handleChange}
            placeholder="(00) 00000-0000"
            inputMode="numeric"
            maxLength={15}
          />
          {erros.telefone && <span className="erro">{erros.telefone}</span>}
        </div>

        <div className="campo campo-largo">
          <label htmlFor="endereco">Endereço</label>
          <input
            id="endereco"
            name="endereco"
            value={form.endereco}
            onChange={handleChange}
            placeholder="Rua, número, bairro, cidade"
          />
        </div>

        <div className="campo campo-largo">
          <label htmlFor="novoRemedio">Remédios prescritos</label>
          <div className="remedio-input-wrapper">
            <input
              id="novoRemedio"
              type="text"
              value={novoRemedio}
              onChange={(e) => setNovoRemedio(e.target.value)}
              onKeyDown={handleRemedioKeyDown}
              placeholder="Digite o nome do remédio e pressione Enter"
              maxLength={50}
            />
            <button
              type="button"
              className="btn btn-secundario btn-adicionar-remedio"
              onClick={adicionarRemedio}
              disabled={!novoRemedio.trim()}
            >
              Adicionar
            </button>
          </div>
          {erros.remedios_prescritos && (
            <span className="erro">{erros.remedios_prescritos}</span>
          )}
          {form.remedios_prescritos.length > 0 && (
            <ul className="remedios-chips">
              {form.remedios_prescritos.map((remedio, i) => (
                <li key={`${remedio}-${i}`} className="remedio-chip">
                  <span>{remedio}</span>
                  <button
                    type="button"
                    className="remedio-remover"
                    onClick={() => removerRemedio(i)}
                    aria-label={`Remover ${remedio}`}
                    title="Remover"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
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
