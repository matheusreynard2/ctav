import { useEffect } from 'react';

const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

const formatarDataHora = (valor) => {
  if (!valor) return '-';
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatarSexo = (sexo) => {
  if (!sexo) return '-';
  const mapa = { MASCULINO: 'Masculino', FEMININO: 'Feminino', OUTRO: 'Outro' };
  return mapa[sexo] ?? sexo;
};

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesAcolhidoModal({ acolhido, onFechar }) {
  useEffect(() => {
    if (!acolhido) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acolhido, onFechar]);

  if (!acolhido) return null;

  const prescricoes = Array.isArray(acolhido.prescricoes)
    ? acolhido.prescricoes
    : [];

  const resumoDose = (p) => {
    const partes = [];
    if (p.doseManha > 0) partes.push(`Manhã: ${p.doseManha}`);
    if (p.doseTarde > 0) partes.push(`Tarde: ${p.doseTarde}`);
    if (p.doseNoite > 0) partes.push(`Noite: ${p.doseNoite}`);
    return partes.length
      ? partes.join(' · ')
      : 'Doses no controle de administração';
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onFechar}
    >
      <div
        className="modal modal-detalhes"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detalhes-cabecalho">
          <div className="detalhes-cabecalho-info">
            <div className="detalhes-foto">
              {acolhido.fotoUrl ? (
                <img src={acolhido.fotoUrl} alt={`Foto de ${acolhido.nome}`} />
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              )}
            </div>
            <div>
              <span className="detalhes-eyebrow">Acolhido</span>
              <h3 className="modal-titulo detalhes-nome">{acolhido.nome}</h3>
            </div>
          </div>
          <button
            type="button"
            className="modal-fechar"
            onClick={onFechar}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="detalhes-corpo">
        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Dados pessoais</h4>
          <div className="detalhes-grid">
            <Campo label="CPF" valor={acolhido.cpf} />
            <Campo label="Data de nascimento" valor={formatarData(acolhido.dataNascimento)} />
            <Campo label="Sexo" valor={formatarSexo(acolhido.sexo)} />
          </div>
        </section>

        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Instituição CTAV</h4>
          <div className="detalhes-grid">
            <Campo
              label="Data de acolhimento (entrada)"
              valor={formatarData(acolhido.dataAcolhimentoCtav)}
            />
            <Campo label="Quarto" valor={acolhido.quarto} />
          </div>
        </section>

        {acolhido.alta && (
          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">Alta</h4>
            <div className="detalhes-grid">
              <Campo label="Data da alta" valor={formatarData(acolhido.dataAlta)} />
              <Campo
                label="Tipo de alta"
                valor={acolhido.tipoAltaRotulo ?? acolhido.tipoAlta}
              />
              <Campo
                label="Descrição da alta"
                valor={acolhido.descricaoAlta}
                largo
              />
            </div>
          </section>
        )}

        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Contato</h4>
          <div className="detalhes-grid">
            <Campo label="Email" valor={acolhido.email} />
            <Campo label="Celular" valor={acolhido.telefone} />
            <Campo label="Endereço" valor={acolhido.endereco} largo />
          </div>
        </section>

        <section className="detalhes-secao">
          <h4 className="detalhes-secao-titulo">Medicamentos prescritos</h4>
          {prescricoes.length > 0 ? (
            <ul className="detalhes-medicamentos">
              {prescricoes.map((p, i) => {
                const nome = p?.medicamentoNome ?? '-';
                const desc = p?.medicamentoDescricao
                  ? String(p.medicamentoDescricao).trim()
                  : '';
                const chave = p?.id ?? p?.medicamentoId ?? `${nome}-${i}`;
                return (
                  <li key={chave}>
                    <span className="detalhes-medicamento-nome">{nome}</span>
                    {desc ? (
                      <span className="detalhes-medicamento-descricao">{desc}</span>
                    ) : null}
                    <span className="detalhes-medicamento-dose">{resumoDose(p)}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="detalhes-vazio">Nenhum medicamento prescrito.</p>
          )}
        </section>

        <section className="detalhes-secao detalhes-auditoria">
          <Campo label="Cadastrado em" valor={formatarDataHora(acolhido.criadoEm)} />
          <Campo label="Última atualização" valor={formatarDataHora(acolhido.atualizadoEm)} />
        </section>
        </div>

        <div className="modal-acoes detalhes-acoes">
          <button
            type="button"
            className="btn btn-primario"
            onClick={onFechar}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
