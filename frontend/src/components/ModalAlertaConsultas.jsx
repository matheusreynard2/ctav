import { useEffect, useMemo } from 'react';
import { formatarDataHoraConsulta } from '../utils/consultas';

export default function ModalAlertaConsultas({
  aberto,
  alertas = [],
  onFechar,
  onVerConsultas,
}) {
  const temUrgente = useMemo(
    () => alertas.some((a) => a.nivel === 'critico'),
    [alertas]
  );

  useEffect(() => {
    if (!aberto) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar?.();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [aberto, onFechar]);

  if (!aberto || alertas.length === 0) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="alerta-consultas-titulo"
      onClick={onFechar}
    >
      <div
        className={`modal modal-alerta-estoque ${
          temUrgente ? 'modal-alerta-estoque-critico' : 'modal-alerta-estoque-baixo'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="alerta-consultas-titulo" className="modal-titulo modal-alerta-estoque-titulo">
          Consultas próximas
        </h3>
        <p className="modal-mensagem">
          Você tem consultas agendadas para as próximas 24 horas:
          <strong className="alerta-estoque-legenda-critico"> vermelho</strong> — na próxima 1
          hora (ou menos);
          <strong className="alerta-estoque-legenda-baixo"> amarelo</strong> — nas próximas
          horas.
        </p>

        <ul className="alerta-estoque-lista">
          {alertas.map((item) => (
            <li
              key={item.chave}
              className={`alerta-estoque-item alerta-estoque-item-${item.nivel}`}
            >
              <div className="alerta-estoque-item-info">
                <span className="alerta-estoque-nome">{item.acolhidoNome ?? 'Acolhido'}</span>
                <span className="alerta-estoque-acolhido">{item.faixaRotulo}</span>
                {item.profissional && (
                  <span className="alerta-estoque-motivo">
                    Profissional: {item.profissional}
                  </span>
                )}
              </div>
              <span className="alerta-estoque-qtd">
                {formatarDataHoraConsulta(item.dataHora)}
              </span>
            </li>
          ))}
        </ul>

        <div className="modal-acoes">
          {onVerConsultas && (
            <button
              type="button"
              className="btn btn-secundario"
              onClick={onVerConsultas}
            >
              Ver consultas
            </button>
          )}
          <button
            type="button"
            className="btn btn-primario"
            onClick={onFechar}
            autoFocus
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
