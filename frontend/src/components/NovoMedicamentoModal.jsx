import { useMemo, useState } from 'react';

const FORM_INICIAL = {
  nome: '',
  descricao: '',
  quantidade_caixas: '',
  quantidade_por_caixa: '',
  total_comprimidos: '',
};

// Modal compacto para cadastrar um medicamento sem sair do cadastro do
// acolhido. Ao salvar, delega a criação (async) a `onCriar`, que deve retornar
// o medicamento criado.
export default function NovoMedicamentoModal({ onCriar, onFechar }) {
  const [form, setForm] = useState(FORM_INICIAL);
  const [erros, setErros] = useState({});
  const [salvando, setSalvando] = useState(false);

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
      if (name === 'quantidade_caixas' || name === 'quantidade_por_caixa') {
        const caixas =
          Number(name === 'quantidade_caixas' ? novoValor : atual.quantidade_caixas) || 0;
        const porCaixa =
          Number(name === 'quantidade_por_caixa' ? novoValor : atual.quantidade_por_caixa) || 0;
        if (porCaixa > 0) proximo.total_comprimidos = String(caixas * porCaixa);
      }
      return proximo;
    });
  };

  const porCaixaNum = Number(form.quantidade_por_caixa) || 0;
  const totalNum = Number(form.total_comprimidos) || 0;
  const resumoCaixas = useMemo(() => {
    if (porCaixaNum <= 0) return null;
    return {
      cheias: Math.floor(totalNum / porCaixaNum),
      avulsos: totalNum % porCaixaNum,
    };
  }, [porCaixaNum, totalNum]);

  const validar = () => {
    const e = {};
    if (!form.nome.trim() || form.nome.trim().length < 2) {
      e.nome = 'Informe o nome (mínimo 2 caracteres).';
    }
    const desc = form.descricao.trim();
    if (!desc || desc.length < 2) e.descricao = 'Informe a descrição.';
    else if (desc.length > 255) e.descricao = 'Máximo de 255 caracteres.';
    if (form.quantidade_por_caixa === '' || Number(form.quantidade_por_caixa) < 1) {
      e.quantidade_por_caixa = 'Comprimidos por caixa deve ser ao menos 1.';
    }
    if (form.total_comprimidos === '' || Number(form.total_comprimidos) < 0) {
      e.total_comprimidos = 'Informe o total de comprimidos.';
    }
    setErros(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (salvando || !validar()) return;
    setSalvando(true);
    try {
      await onCriar({
        nome: form.nome.trim(),
        descricao: form.descricao.trim(),
        quantidade_por_caixa: Number(form.quantidade_por_caixa),
        total_comprimidos: Number(form.total_comprimidos),
      });
      onFechar();
    } catch {
      // O erro é exibido via toast pelo pai; mantém o modal aberto.
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="novo-medicamento-titulo"
      onClick={() => !salvando && onFechar()}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="novo-medicamento-titulo" className="modal-titulo">
          Novo medicamento
        </h3>
        <form className="grid" onSubmit={handleSubmit}>
          <div className="campo campo-largo">
            <label htmlFor="novo-med-nome">Nome *</label>
            <input
              id="novo-med-nome"
              name="nome"
              value={form.nome}
              onChange={handleChange}
              placeholder="Nome do medicamento"
              maxLength={120}
              autoFocus
            />
            {erros.nome && <span className="erro">{erros.nome}</span>}
          </div>
          <div className="campo campo-largo">
            <label htmlFor="novo-med-descricao">Descrição *</label>
            <textarea
              id="novo-med-descricao"
              name="descricao"
              value={form.descricao}
              onChange={handleChange}
              placeholder="Uso, posologia resumida, observações"
              rows={3}
              maxLength={255}
            />
            {erros.descricao && <span className="erro">{erros.descricao}</span>}
          </div>
          <div className="campo">
            <label htmlFor="novo-med-caixas">Quantidade de caixas</label>
            <input
              id="novo-med-caixas"
              name="quantidade_caixas"
              value={form.quantidade_caixas}
              onChange={handleChange}
              placeholder="0"
              inputMode="numeric"
            />
          </div>
          <div className="campo">
            <label htmlFor="novo-med-por-caixa">Comprimidos por caixa *</label>
            <input
              id="novo-med-por-caixa"
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
            <label htmlFor="novo-med-total">Total de comprimidos *</label>
            <input
              id="novo-med-total"
              name="total_comprimidos"
              value={form.total_comprimidos}
              onChange={handleChange}
              placeholder="0"
              inputMode="numeric"
            />
            {erros.total_comprimidos && (
              <span className="erro">{erros.total_comprimidos}</span>
            )}
            {resumoCaixas && resumoCaixas.avulsos > 0 && (
              <span className="campo-ajuda">
                Equivale a {resumoCaixas.cheias} caixa(s) cheia(s) +{' '}
                {resumoCaixas.avulsos} comprimido(s) avulso(s).
              </span>
            )}
          </div>

          <div className="modal-acoes campo-largo">
            <button
              type="button"
              className="btn btn-secundario"
              onClick={onFechar}
              disabled={salvando}
            >
              Cancelar
            </button>
            <button type="submit" className="btn btn-primario" disabled={salvando}>
              {salvando ? 'Cadastrando...' : 'Cadastrar medicamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
