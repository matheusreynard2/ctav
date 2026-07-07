import { useEffect } from 'react';
import { rotuloTipoCombinado, TIPO_RESSOCIALIZACAO } from '../utils/combinados';

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

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesCombinadoModal({ combinado, onFechar }) {
  useEffect(() => {
    if (!combinado) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [combinado, onFechar]);

  if (!combinado) return null;

  const ehRessocializacao = combinado.tipo === TIPO_RESSOCIALIZACAO;

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
            <span className="detalhes-eyebrow">Combinado</span>
            <h3 className="modal-titulo detalhes-nome">{combinado.acolhidoNome ?? '-'}</h3>
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
            <h4 className="detalhes-secao-titulo">Informações do combinado</h4>
            <div className="detalhes-grid">
              <Campo label="Acolhido" valor={combinado.acolhidoNome} />
              <Campo label="CPF" valor={combinado.acolhidoCpf} />
              <Campo label="Tipo de combinado" valor={rotuloTipoCombinado(combinado.tipo)} />
              {ehRessocializacao ? (
                <>
                  <Campo label="Data de ida" valor={formatarData(combinado.dataIda)} />
                  <Campo label="Data de volta" valor={formatarData(combinado.dataVolta)} />
                </>
              ) : combinado.dataCombinado ? (
                <Campo label="Data do combinado" valor={formatarData(combinado.dataCombinado)} />
              ) : null}
              <Campo label="Descrição" valor={combinado.descricao} largo />
            </div>
          </section>

          <section className="detalhes-secao detalhes-auditoria">
            <Campo label="Cadastrado em" valor={formatarDataHora(combinado.criadoEm)} />
            <Campo label="Última atualização" valor={formatarDataHora(combinado.atualizadoEm)} />
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
