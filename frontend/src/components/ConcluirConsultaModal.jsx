import { useEffect, useState } from 'react';
import { formatarDataHoraConsulta } from '../utils/consultas';

export default function ConcluirConsultaModal({
  consulta,
  salvando = false,
  onConfirmar,
  onFechar,
}) {
  const [resumo, setResumo] = useState('');

  useEffect(() => {
    setResumo(consulta?.resumo ?? '');
  }, [consulta]);

  useEffect(() => {
    if (!consulta) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar?.();
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
      aria-labelledby="concluir-consulta-titulo"
      onClick={onFechar}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3 id="concluir-consulta-titulo" className="modal-titulo">
          Concluir consulta
        </h3>
        <p className="modal-mensagem">
          Consulta de <strong>{consulta.acolhidoNome ?? 'acolhido'}</strong> em{' '}
          {formatarDataHoraConsulta(consulta.dataHora)}. Preencha o resumo do que
          ocorreu. Após concluir, a consulta ficará bloqueada para edição.
        </p>

        <div className="campo campo-largo">
          <label htmlFor="concluir-resumo">Resumo da consulta</label>
          <textarea
            id="concluir-resumo"
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="Descreva o que foi tratado/observado na consulta"
            rows={5}
            maxLength={4000}
            autoFocus
          />
          <span className="hint-contador">{resumo.length}/4000</span>
        </div>

        <div className="modal-acoes">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={onFechar}
            disabled={salvando}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="btn btn-primario"
            onClick={() => onConfirmar(resumo)}
            disabled={salvando}
          >
            {salvando ? 'Concluindo...' : 'Concluir consulta'}
          </button>
        </div>
      </div>
    </div>
  );
}
