import { useEffect } from 'react';

export default function ModalConfirmacao({
  aberto,
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  onConfirmar,
  onCancelar,
  perigo = false,
}) {
  useEffect(() => {
    if (!aberto) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onCancelar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [aberto, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={onCancelar}
    >
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {titulo && <h3 className="modal-titulo">{titulo}</h3>}
        <p className="modal-mensagem">{mensagem}</p>
        <div className="modal-acoes">
          <button
            type="button"
            className="btn btn-secundario"
            onClick={onCancelar}
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            className={`btn ${perigo ? 'btn-perigo-cheio' : 'btn-primario'}`}
            onClick={onConfirmar}
            autoFocus
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
