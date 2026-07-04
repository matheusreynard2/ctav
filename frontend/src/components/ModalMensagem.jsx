import { useEffect, useRef } from 'react';

const TITULOS = {
  sucesso: 'Sucesso',
  erro: 'Atenção',
  info: 'Aviso',
};

export default function ModalMensagem({
  aberto,
  tipo = 'sucesso',
  mensagem,
  duracao = 4000,
  onFechar,
}) {
  // Mantem a referencia atual de onFechar sem reiniciar o timer a cada render.
  const onFecharRef = useRef(onFechar);
  useEffect(() => {
    onFecharRef.current = onFechar;
  });

  useEffect(() => {
    if (!aberto) return undefined;
    const fechar = () => onFecharRef.current?.();
    const handleEsc = (e) => {
      if (e.key === 'Escape') fechar();
    };
    document.addEventListener('keydown', handleEsc);
    const timer = setTimeout(fechar, duracao);
    return () => {
      document.removeEventListener('keydown', handleEsc);
      clearTimeout(timer);
    };
  }, [aberto, duracao]);

  if (!aberto) return null;

  const titulo = TITULOS[tipo] ?? TITULOS.info;

  // Toast nao-bloqueante: fica na parte inferior e permite continuar navegando.
  return (
    <div className={`toast toast-${tipo}`} role="status" aria-live="polite">
      <div className="toast-conteudo">
        <h3 className="toast-titulo">{titulo}</h3>
        <p className="toast-mensagem">{mensagem}</p>
      </div>
      <button
        type="button"
        className="btn btn-primario toast-ok"
        onClick={onFechar}
      >
        OK
      </button>
      <div className="toast-progresso">
        <div
          className="toast-progresso-barra"
          style={{ animationDuration: `${duracao}ms` }}
        />
      </div>
    </div>
  );
}
