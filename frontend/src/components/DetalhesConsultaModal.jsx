import { useEffect } from 'react';
import { formatarDataHoraConsulta, rotuloStatusConsulta } from '../utils/consultas';

const Campo = ({ label, valor, largo = false }) => (
  <div className={`detalhes-campo ${largo ? 'detalhes-campo-largo' : ''}`}>
    <span className="detalhes-label">{label}</span>
    <span className="detalhes-valor">{valor ?? '-'}</span>
  </div>
);

export default function DetalhesConsultaModal({ consulta, onFechar }) {
  useEffect(() => {
    if (!consulta) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [consulta, onFechar]);

  if (!consulta) return null;

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
            <span className="detalhes-eyebrow">Consulta</span>
            <h3 className="modal-titulo detalhes-nome">{consulta.acolhidoNome ?? '-'}</h3>
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
            <h4 className="detalhes-secao-titulo">Informações da consulta</h4>
            <div className="detalhes-grid">
              <Campo label="Acolhido" valor={consulta.acolhidoNome} />
              <Campo label="CPF" valor={consulta.acolhidoCpf} />
              <Campo label="Data e hora" valor={formatarDataHoraConsulta(consulta.dataHora)} />
              <Campo label="Situação" valor={rotuloStatusConsulta(consulta.status)} />
              <Campo label="Profissional" valor={consulta.profissional} />
              <Campo label="Local" valor={consulta.local} />
              <Campo label="Descrição" valor={consulta.descricao} largo />
              {consulta.status === 'REALIZADA' && (
                <Campo label="Resumo da consulta" valor={consulta.resumo} largo />
              )}
            </div>
          </section>

          <section className="detalhes-secao detalhes-auditoria">
            <Campo label="Cadastrada em" valor={formatarDataHoraConsulta(consulta.criadoEm)} />
            <Campo label="Última atualização" valor={formatarDataHoraConsulta(consulta.atualizadoEm)} />
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
