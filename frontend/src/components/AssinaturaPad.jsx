import { useEffect, useRef } from 'react';

// Área de captura de assinatura via canvas (mouse e toque). O canvas é
// controlado por um ref externo para que o componente pai leia a imagem
// (toDataURL) ou limpe o traçado. Aceita uma imagem inicial (data URL) para
// pré-carregar uma assinatura já existente na edição.
export default function AssinaturaPad({
  id,
  canvasRef,
  onMudar,
  onFinalizar,
  disabled = false,
  valorInicial = null,
}) {
  const desenhandoRef = useRef(false);
  const ultimoPontoRef = useRef(null);

  // Carrega a assinatura existente no canvas (uma vez por valor recebido).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!valorInicial) return;
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = valorInicial;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valorInicial]);

  const posicao = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const escalaX = canvas.width / rect.width;
    const escalaY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * escalaX,
      y: (e.clientY - rect.top) * escalaY,
    };
  };

  const iniciar = (e) => {
    if (disabled) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    canvas.setPointerCapture?.(e.pointerId);
    desenhandoRef.current = true;
    ultimoPontoRef.current = posicao(e);
  };

  const mover = (e) => {
    if (!desenhandoRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const ponto = posicao(e);
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(ultimoPontoRef.current.x, ultimoPontoRef.current.y);
    ctx.lineTo(ponto.x, ponto.y);
    ctx.stroke();
    ultimoPontoRef.current = ponto;
    onMudar?.(true);
  };

  const encerrar = () => {
    const estavaDesenhando = desenhandoRef.current;
    desenhandoRef.current = false;
    ultimoPontoRef.current = null;
    // Após um traço, expõe a imagem atual para o pai persistir o valor (útil
    // quando o canvas pode ser desmontado, ex.: troca de aba no formulário).
    if (estavaDesenhando && onFinalizar) {
      onFinalizar(canvasRef.current?.toDataURL('image/png') ?? null);
    }
  };

  const limpar = () => {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onMudar?.(false);
    onFinalizar?.(null);
  };

  return (
    <div className="assinatura-pad">
      <canvas
        id={id}
        ref={canvasRef}
        className="assinatura-canvas"
        width={600}
        height={200}
        onPointerDown={iniciar}
        onPointerMove={mover}
        onPointerUp={encerrar}
        onPointerLeave={encerrar}
        onPointerCancel={encerrar}
      />
      <button
        type="button"
        className="btn btn-secundario btn-pequeno assinatura-limpar"
        onClick={limpar}
        disabled={disabled}
      >
        Limpar
      </button>
    </div>
  );
}
