import { useEffect, useMemo, useState } from 'react';

const FORM_INICIAL = {
  nome: '',
  descricao: '',
  quantidade_caixas: '',
  quantidade_por_caixa: '',
  total_comprimidos: '',
};

// Total padrao derivado de caixas × comprimidos por caixa, para pré-preencher
// o campo de total ao informar caixas no cadastro.
const derivarTotal = (medicamento) => {
  if (medicamento?.total_comprimidos != null) {
    return String(medicamento.total_comprimidos);
  }
  const caixas = Number(medicamento?.quantidade_caixas) || 0;
  const porCaixa = Number(medicamento?.quantidade_por_caixa) || 0;
  return String(caixas * porCaixa);
};

export default function MedicamentoForm({
  medicamentoEditando,
  acolhidos = [],
  onSalvar,
  onCancelar,
  onVerLista,
  salvando,
}) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});
  // Reserva por acolhido: { [acolhidoId]: string(comprimidos) }.
  const [reservas, setReservas] = useState({});
  // Acolhido escolhido no combobox para editar a reserva.
  const [acolhidoReservaId, setAcolhidoReservaId] = useState('');

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
        total_comprimidos: derivarTotal(medicamentoEditando),
      });
    } else {
      setForm(FORM_INICIAL);
    }
    setErros({});
  }, [medicamentoEditando]);

  // Acolhidos ordenados por nome para a seção de reserva.
  const acolhidosOrdenados = useMemo(
    () =>
      [...(Array.isArray(acolhidos) ? acolhidos : [])].sort((a, b) =>
        (a.nome ?? '').localeCompare(b.nome ?? '')
      ),
    [acolhidos]
  );

  // Reserva já persistida deste medicamento por acolhido (estado do backend).
  const reservaBasePorAcolhido = useMemo(() => {
    const mapa = {};
    const medId = medicamentoEditando?.id;
    if (medId == null) return mapa;
    acolhidosOrdenados.forEach((a) => {
      const presc = (Array.isArray(a.prescricoes) ? a.prescricoes : []).find(
        (p) => p?.medicamentoId === medId
      );
      if (presc) mapa[a.id] = Number(presc.totalComprimidos) || 0;
    });
    return mapa;
  }, [acolhidosOrdenados, medicamentoEditando]);

  // Prefill das reservas ao abrir/editar.
  useEffect(() => {
    const inicial = {};
    Object.entries(reservaBasePorAcolhido).forEach(([id, valor]) => {
      inicial[id] = String(valor);
    });
    setReservas(inicial);
  }, [reservaBasePorAcolhido]);

  const alterarReserva = (acolhidoId, valor) => {
    const soDigitos = valor.replace(/\D/g, '');
    setReservas((atual) => ({ ...atual, [acolhidoId]: soDigitos }));
  };

  const reservaDe = (acolhidoId) => Number(reservas[acolhidoId]) || 0;

  const totalReservadoBase = useMemo(
    () =>
      Object.values(reservaBasePorAcolhido).reduce(
        (s, v) => s + (Number(v) || 0),
        0
      ),
    [reservaBasePorAcolhido]
  );

  const totalReservadoAtual = useMemo(
    () =>
      acolhidosOrdenados.reduce((s, a) => s + reservaDe(a.id), 0),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [acolhidosOrdenados, reservas]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    let novoValor = value;
    if (
      name === 'quantidade_caixas' ||
      name === 'quantidade_por_caixa' ||
      name === 'total_comprimidos'
    ) {
      novoValor = value.replace(/\D/g, '');
    }
    setForm((atual) => {
      const proximo = { ...atual, [name]: novoValor };
      // Ao alterar caixas ou comprimidos por caixa, recalcula o total.
      if (name === 'quantidade_caixas' || name === 'quantidade_por_caixa') {
        const caixas =
          Number(name === 'quantidade_caixas' ? novoValor : atual.quantidade_caixas) || 0;
        const porCaixa =
          Number(name === 'quantidade_por_caixa' ? novoValor : atual.quantidade_por_caixa) || 0;
        if (porCaixa > 0) {
          proximo.total_comprimidos = String(caixas * porCaixa);
        }
      }
      return proximo;
    });
  };

  const porCaixaNum = Number(form.quantidade_por_caixa) || 0;
  const totalNum = Number(form.total_comprimidos) || 0;
  const resumoCaixas = useMemo(() => {
    if (porCaixaNum <= 0) return null;
    const cheias = Math.floor(totalNum / porCaixaNum);
    const avulsos = totalNum % porCaixaNum;
    return { cheias, avulsos };
  }, [porCaixaNum, totalNum]);

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
      if (Number.isNaN(numero) || numero < 1) {
        novosErros.quantidade_por_caixa = 'A quantidade por caixa deve ser ao menos 1';
      }
    }

    if (form.total_comprimidos === '' || form.total_comprimidos == null) {
      novosErros.total_comprimidos = 'Informe o total de comprimidos';
    } else {
      const numero = Number(form.total_comprimidos);
      if (Number.isNaN(numero) || numero < 0) {
        novosErros.total_comprimidos = 'O total não pode ser negativo';
      }
    }

    setErros(novosErros);
    return Object.keys(novosErros).length === 0;
  };

  // Estoque livre previsto após as reservas informadas (cálculo em tempo real).
  const livrePrevisto =
    (Number(form.total_comprimidos) || 0) + totalReservadoBase - totalReservadoAtual;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validar()) return;

    // Envia apenas as reservas que mudaram em relação ao estado atual.
    const reservasAlteradas = acolhidosOrdenados
      .map((a) => ({
        acolhidoId: a.id,
        totalComprimidos: reservaDe(a.id),
        base: Number(reservaBasePorAcolhido[a.id]) || 0,
      }))
      .filter((r) => r.totalComprimidos !== r.base)
      .map(({ acolhidoId, totalComprimidos }) => ({ acolhidoId, totalComprimidos }));

    const payload = {
      nome: form.nome.trim(),
      descricao: form.descricao.trim(),
      quantidade_por_caixa: Number(form.quantidade_por_caixa),
      total_comprimidos: Number(form.total_comprimidos),
      reservas: reservasAlteradas,
    };
    onSalvar(payload);
  };

  const editando = Boolean(medicamentoEditando);
  const porCaixaReserva = Number(form.quantidade_por_caixa) || 0;

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
          <label htmlFor="medicamento-quantidade-caixas">Quantidade de caixas *</label>
          <input
            id="medicamento-quantidade-caixas"
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
            Comprimidos por caixa *
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

        <div className="campo">
          <label htmlFor="medicamento-total-comprimidos">
            Total de comprimidos *
          </label>
          <input
            id="medicamento-total-comprimidos"
            name="total_comprimidos"
            value={form.total_comprimidos}
            onChange={handleChange}
            placeholder="0"
            inputMode="numeric"
          />
          {erros.total_comprimidos && (
            <span className="erro">{erros.total_comprimidos}</span>
          )}
          <span className="campo-ajuda">
            Calculado automaticamente ao informar caixas e comprimidos por caixa;
            também pode ser editado diretamente.
          </span>
          {resumoCaixas && resumoCaixas.avulsos > 0 && (
            <span className="campo-ajuda">
              Equivale a {resumoCaixas.cheias} caixa(s) cheia(s)
              {resumoCaixas.avulsos > 0
                ? ` + ${resumoCaixas.avulsos} comprimido(s) avulso(s)`
                : ''}
              .
            </span>
          )}
        </div>
      </div>

      {acolhidosOrdenados.length > 0 && (
        <div className="campo campo-largo">
          <label htmlFor="medicamento-reserva-acolhido">
            Reservar para acolhido
          </label>
          <p className="campo-ajuda">
            Selecione um acolhido para reservar comprimidos deste medicamento
            exclusivamente para ele. O que for reservado sai do estoque livre. O
            valor é recalculado em tempo real conforme você digita.
          </p>
          <select
            id="medicamento-reserva-acolhido"
            value={acolhidoReservaId}
            onChange={(e) => setAcolhidoReservaId(e.target.value)}
          >
            <option value="">Selecione um acolhido...</option>
            {acolhidosOrdenados.map((a) => {
              const reservado = reservaDe(a.id);
              return (
                <option key={a.id} value={String(a.id)}>
                  {a.nome}
                  {a.quarto ? ` — Quarto ${a.quarto}` : ''}
                  {reservado > 0 ? ` (reservado: ${reservado})` : ''}
                </option>
              );
            })}
          </select>

          {acolhidoReservaId &&
            (() => {
              const reservado = reservaDe(acolhidoReservaId);
              const caixas =
                porCaixaReserva > 0 ? Math.floor(reservado / porCaixaReserva) : 0;
              const avulsos =
                porCaixaReserva > 0 ? reservado % porCaixaReserva : reservado;
              return (
                <div className="campo campo-inline" style={{ marginTop: 12 }}>
                  <label htmlFor="medicamento-reserva-qtd">
                    Reservar (comprimidos)
                  </label>
                  <input
                    id="medicamento-reserva-qtd"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    className="dose-input"
                    value={reservas[acolhidoReservaId] ?? ''}
                    onChange={(e) =>
                      alterarReserva(acolhidoReservaId, e.target.value)
                    }
                    placeholder="0"
                  />
                  <span className="campo-ajuda">
                    {porCaixaReserva > 0
                      ? `Equivale a ${caixas} caixa(s) + ${avulsos} comp.`
                      : `${reservado} comp.`}
                  </span>
                </div>
              );
            })()}

          <p
            className={`estoque-reservado-resumo${
              livrePrevisto < 0 ? ' doses-estoque-insuficiente' : ''
            }`}
            style={{ marginTop: 12 }}
          >
            Estoque livre previsto: <strong>{livrePrevisto}</strong> comp.
            {livrePrevisto < 0 && (
              <span className="erro"> estoque insuficiente para reservar</span>
            )}
          </p>
        </div>
      )}

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
