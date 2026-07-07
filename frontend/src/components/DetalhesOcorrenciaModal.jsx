import { useEffect } from 'react';

const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.slice(0, 10).split('-');
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

export default function DetalhesOcorrenciaModal({ ocorrencia, onFechar }) {
  useEffect(() => {
    if (!ocorrencia) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [ocorrencia, onFechar]);

  if (!ocorrencia) return null;

  const acolhidosVinculados = Array.isArray(ocorrencia.acolhidos)
    ? ocorrencia.acolhidos
    : [];
  const acolhidoTexto =
    ocorrencia.acolhidosResumo ?? 'Sem acolhido vinculado';
  const semVinculoAtivo =
    acolhidosVinculados.length === 0 && Boolean(ocorrencia.acolhidosNomes);

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
            <span className="detalhes-eyebrow">Ocorrência</span>
            <h3 className="modal-titulo detalhes-nome">{ocorrencia.titulo ?? '-'}</h3>
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
            <h4 className="detalhes-secao-titulo">Informações da ocorrência</h4>
            <div className="detalhes-grid">
              <Campo
                label="Acolhido(s) envolvido(s)"
                valor={
                  semVinculoAtivo
                    ? `${acolhidoTexto} (sem vínculo ativo)`
                    : acolhidoTexto
                }
                largo
              />
              <Campo label="Data da ocorrência" valor={formatarData(ocorrencia.dataOcorrencia)} />
              <Campo label="Ocorrência" valor={ocorrencia.titulo} largo />
              <Campo label="Descrição" valor={ocorrencia.descricao} largo />
            </div>
          </section>

          <section className="detalhes-secao detalhes-auditoria">
            <Campo label="Cadastrado em" valor={formatarDataHora(ocorrencia.criadoEm)} />
            <Campo label="Última atualização" valor={formatarDataHora(ocorrencia.atualizadoEm)} />
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
