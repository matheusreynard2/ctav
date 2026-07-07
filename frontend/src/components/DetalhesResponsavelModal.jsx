import { useEffect } from 'react';

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

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesResponsavelModal({ responsavel, onFechar }) {
  useEffect(() => {
    if (!responsavel) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [responsavel, onFechar]);

  if (!responsavel) return null;

  const cidadeUf =
    [responsavel.cidade, responsavel.estado].filter(Boolean).join(' / ') || '-';

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onFechar}
    >
      <div className="modal modal-detalhes" onClick={(e) => e.stopPropagation()}>
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Responsável</span>
            <h3 className="modal-titulo detalhes-nome">{responsavel.nome ?? '-'}</h3>
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
              <Campo label="CPF" valor={responsavel.cpf} />
              <Campo label="RG" valor={responsavel.rg} />
              <Campo label="Celular" valor={responsavel.celular} />
              <Campo
                label="Conveniado"
                valor={responsavel.conveniado ? 'Sim' : 'Não'}
              />
            </div>
          </section>

          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">Endereço</h4>
            <div className="detalhes-grid">
              <Campo label="Endereço" valor={responsavel.endereco} largo />
              <Campo label="Bairro" valor={responsavel.bairro} />
              <Campo label="Cidade / UF" valor={cidadeUf} />
              <Campo label="CEP" valor={responsavel.cep} />
            </div>
          </section>

          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">Vínculos</h4>
            <div className="detalhes-grid">
              <Campo
                label="Acolhidos vinculados"
                valor={responsavel.qtdAcolhidos ?? 0}
              />
            </div>
          </section>

          <section className="detalhes-secao detalhes-auditoria">
            <Campo label="Cadastrado em" valor={formatarDataHora(responsavel.criadoEm)} />
            <Campo label="Última atualização" valor={formatarDataHora(responsavel.atualizadoEm)} />
          </section>
        </div>

        <div className="modal-acoes detalhes-acoes">
          <button type="button" className="btn btn-primario" onClick={onFechar}>
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
