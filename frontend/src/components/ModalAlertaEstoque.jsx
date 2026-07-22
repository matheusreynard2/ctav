import { useEffect, useMemo } from 'react';
import { NIVEL_ESTOQUE, rotuloNivelEstoque } from '../utils/estoqueMedicamentos';

export default function ModalAlertaEstoque({
  aberto,
  alertas = [],
  onFechar,
  onVerAcolhidos,
}) {
  const temCritico = useMemo(
    () => alertas.some((a) => a.nivel === NIVEL_ESTOQUE.CRITICO),
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
      aria-labelledby="alerta-estoque-titulo"
      onClick={onFechar}
    >
      <div
        className={`modal modal-alerta-estoque ${
          temCritico ? 'modal-alerta-estoque-critico' : 'modal-alerta-estoque-baixo'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="alerta-estoque-titulo" className="modal-titulo modal-alerta-estoque-titulo">
          Alerta de estoque baixo
        </h3>
        <p className="modal-mensagem">
          O estoque reservado de alguns medicamentos está acabando:
          <strong className="alerta-estoque-legenda-critico"> vermelho</strong> — menos de 8
          comprimidos;
          <strong className="alerta-estoque-legenda-baixo"> amarelo</strong> — uma caixa ou
          menos.
        </p>

        <ul className="alerta-estoque-lista">
          {alertas.map((item) => {
            const total = Number(item.totalComprimidos) || 0;
            const porCaixa = Number(item.quantidadePorCaixa) || 0;
            return (
              <li
                key={item.chave}
                className={`alerta-estoque-item alerta-estoque-item-${item.nivel}`}
              >
                <div className="alerta-estoque-item-info">
                  <span className="alerta-estoque-nome">{item.medicamentoNome}</span>
                  <span className="alerta-estoque-acolhido">
                    Acolhido: {item.acolhidoNome}
                  </span>
                  <span className="alerta-estoque-motivo">
                    {rotuloNivelEstoque(item.nivel)}
                  </span>
                </div>
                <span className="alerta-estoque-qtd">
                  {total} {total === 1 ? 'comprimido' : 'comprimidos'}
                  {porCaixa > 0 ? ` (caixa: ${porCaixa})` : ''}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="modal-acoes">
          {onVerAcolhidos && (
            <button
              type="button"
              className="btn btn-secundario"
              onClick={onVerAcolhidos}
            >
              Ver acolhidos
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
