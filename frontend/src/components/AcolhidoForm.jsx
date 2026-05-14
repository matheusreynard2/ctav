import { useEffect, useMemo, useState } from 'react';
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
  dataAcolhimentoCtav: '',
  dataSaidaCtav: '',
  email: '',
  telefone: '',
  sexo: '',
  endereco: '',
};

const hojeComoIso = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
};

const truncarDescricaoRemedio = (texto, max = 72) => {
  if (!texto) return '';
  const t = String(texto).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, Math.max(0, max - 1))}…`;
};

export default function AcolhidoForm({
  acolhidoEditando,
  remediosDisponiveis = [],
  onSalvar,
  onCancelar,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [remediosSelecionadosIds, setRemediosSelecionadosIds] = useState([]);
  const [destaqueDisponivel, setDestaqueDisponivel] = useState(null);
  const [destaqueSelecionado, setDestaqueSelecionado] = useState(null);
  const [erros, setErros] = useState({});

  useEffect(() => {
    if (acolhidoEditando) {
      setForm({
        nome: acolhidoEditando.nome ?? '',
        cpf: maskCpf(acolhidoEditando.cpf ?? ''),
        dataNascimento: isoParaData(acolhidoEditando.dataNascimento),
        dataAcolhimentoCtav: isoParaData(acolhidoEditando.dataAcolhimentoCtav),
        dataSaidaCtav: isoParaData(acolhidoEditando.dataSaidaCtav),
        email: acolhidoEditando.email ?? '',
        telefone: maskCelular(acolhidoEditando.telefone ?? ''),
        sexo: acolhidoEditando.sexo ?? '',
        endereco: acolhidoEditando.endereco ?? '',
      });
      const ids = Array.isArray(acolhidoEditando.remedios_prescritos)
        ? acolhidoEditando.remedios_prescritos
            .map((r) => (typeof r === 'object' ? r?.id : null))
            .filter((id) => id != null)
        : [];
      setRemediosSelecionadosIds(ids);
    } else {
      setForm(FORM_INICIAL);
      setRemediosSelecionadosIds([]);
    }
    setDestaqueDisponivel(null);
    setDestaqueSelecionado(null);
    setErros({});
  }, [acolhidoEditando]);

  const remediosDisponiveisOrdenados = useMemo(
    () => [...remediosDisponiveis].sort((a, b) => a.nome.localeCompare(b.nome)),
    [remediosDisponiveis]
  );

  const remediosNaoSelecionados = useMemo(
    () =>
      remediosDisponiveisOrdenados.filter(
        (r) => !remediosSelecionadosIds.includes(r.id)
      ),
    [remediosDisponiveisOrdenados, remediosSelecionadosIds]
  );

  const remediosSelecionados = useMemo(() => {
    const mapa = new Map(remediosDisponiveisOrdenados.map((r) => [r.id, r]));
    return remediosSelecionadosIds
      .map((id) => mapa.get(id))
      .filter(Boolean);
  }, [remediosDisponiveisOrdenados, remediosSelecionadosIds]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;

    if (name === 'cpf') novoValor = maskCpf(value);
    else if (name === 'telefone') novoValor = maskCelular(value);
    else if (
      name === 'dataNascimento' ||
      name === 'dataAcolhimentoCtav' ||
      name === 'dataSaidaCtav'
    )
      novoValor = maskData(value);

    setForm((atual) => ({ ...atual, [name]: novoValor }));
  };

  const incluirRemedio = (id) => {
    if (id == null) return;
    setRemediosSelecionadosIds((atual) =>
      atual.includes(id) ? atual : [...atual, id]
    );
    setDestaqueDisponivel(null);
  };

  const removerRemedio = (id) => {
    if (id == null) return;
    setRemediosSelecionadosIds((atual) => atual.filter((x) => x !== id));
    setDestaqueSelecionado(null);
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

    const hoje = hojeComoIso();
    if (!form.dataAcolhimentoCtav.trim()) {
      novosErros.dataAcolhimentoCtav = 'Informe a data de acolhimento na CTAV';
    } else {
      const isoAcolhimento = dataParaIso(form.dataAcolhimentoCtav);
      if (!isoAcolhimento) {
        novosErros.dataAcolhimentoCtav = 'Data inválida';
      } else if (isoAcolhimento > hoje) {
        novosErros.dataAcolhimentoCtav =
          'A data não pode ser posterior à data atual';
      }
    }

    if (form.dataSaidaCtav.trim()) {
      const isoSaida = dataParaIso(form.dataSaidaCtav);
      if (!isoSaida) {
        novosErros.dataSaidaCtav = 'Data inválida';
      } else if (isoSaida > hoje) {
        novosErros.dataSaidaCtav =
          'A data não pode ser posterior à data atual';
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
      dataAcolhimentoCtav: dataParaIso(form.dataAcolhimentoCtav),
      dataSaidaCtav: form.dataSaidaCtav.trim()
        ? dataParaIso(form.dataSaidaCtav)
        : null,
      email: form.email || null,
      telefone: form.telefone || null,
      sexo: form.sexo || null,
      endereco: form.endereco || null,
      remedios_prescritos_ids: remediosSelecionadosIds.length
        ? [...remediosSelecionadosIds]
        : null,
    };
    onSalvar(payload);
  };

  const editando = Boolean(acolhidoEditando);

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h2>{editando ? 'Editar acolhido' : 'Novo acolhido'}</h2>

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
          <label htmlFor="dataAcolhimentoCtav" title="Data em que o acolhido entra na instituição">
            Data de acolhimento na CTAV *
          </label>
          <input
            id="dataAcolhimentoCtav"
            name="dataAcolhimentoCtav"
            value={form.dataAcolhimentoCtav}
            onChange={handleChange}
            placeholder="dd/mm/aaaa"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataAcolhimentoCtav && (
            <span className="erro">{erros.dataAcolhimentoCtav}</span>
          )}
        </div>

        <div className="campo">
          <label htmlFor="dataSaidaCtav" title="Data em que o acolhido sai ou recebe alta da instituição">
            Data de saída / alta na CTAV
          </label>
          <input
            id="dataSaidaCtav"
            name="dataSaidaCtav"
            value={form.dataSaidaCtav}
            onChange={handleChange}
            placeholder="dd/mm/aaaa (opcional)"
            inputMode="numeric"
            maxLength={10}
          />
          {erros.dataSaidaCtav && <span className="erro">{erros.dataSaidaCtav}</span>}
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
            placeholder="acolhido@email.com"
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
          <label>Remédios prescritos</label>
          <div className="dual-list">
            <div className="dual-list-coluna">
              <span className="dual-list-titulo">Remédios disponíveis</span>
              <ul className="dual-list-caixa" role="listbox">
                {remediosNaoSelecionados.length === 0 ? (
                  <li className="dual-list-vazio">
                    {remediosDisponiveis.length === 0
                      ? 'Nenhum remédio cadastrado.'
                      : 'Todos já foram incluídos.'}
                  </li>
                ) : (
                  remediosNaoSelecionados.map((r) => (
                    <li
                      key={r.id}
                      role="option"
                      aria-selected={destaqueDisponivel === r.id}
                      className={`dual-list-item ${
                        destaqueDisponivel === r.id ? 'destaque' : ''
                      }`}
                      onClick={() => setDestaqueDisponivel(r.id)}
                      onDoubleClick={() => incluirRemedio(r.id)}
                    >
                      <span className="dual-list-item-titulo">{r.nome}</span>
                      {r.descricao ? (
                        <span className="dual-list-item-sub" title={r.descricao}>
                          {truncarDescricaoRemedio(r.descricao)}
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>

            <div className="dual-list-acoes">
              <button
                type="button"
                className="btn btn-secundario btn-seta"
                onClick={() => incluirRemedio(destaqueDisponivel)}
                disabled={destaqueDisponivel == null}
                aria-label="Incluir remédio selecionado"
                title="Incluir"
              >
                &gt;
              </button>
              <button
                type="button"
                className="btn btn-secundario btn-seta"
                onClick={() => removerRemedio(destaqueSelecionado)}
                disabled={destaqueSelecionado == null}
                aria-label="Remover remédio selecionado"
                title="Remover"
              >
                &lt;
              </button>
            </div>

            <div className="dual-list-coluna">
              <span className="dual-list-titulo">Remédios inclusos</span>
              <ul className="dual-list-caixa" role="listbox">
                {remediosSelecionados.length === 0 ? (
                  <li className="dual-list-vazio">Nenhum remédio incluído.</li>
                ) : (
                  remediosSelecionados.map((r) => (
                    <li
                      key={r.id}
                      role="option"
                      aria-selected={destaqueSelecionado === r.id}
                      className={`dual-list-item ${
                        destaqueSelecionado === r.id ? 'destaque' : ''
                      }`}
                      onClick={() => setDestaqueSelecionado(r.id)}
                      onDoubleClick={() => removerRemedio(r.id)}
                    >
                      <span className="dual-list-item-titulo">{r.nome}</span>
                      {r.descricao ? (
                        <span className="dual-list-item-sub" title={r.descricao}>
                          {truncarDescricaoRemedio(r.descricao)}
                        </span>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
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
