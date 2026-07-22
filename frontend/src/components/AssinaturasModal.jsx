import { useEffect, useRef, useState } from 'react';
import { acolhidoService } from '../api';
import AssinaturaPad from './AssinaturaPad.jsx';

const extrairErro = (err, padrao) => {
  const data = err?.response?.data;
  if (data?.message) return data.message;
  if (!err?.response && err?.message) return err.message;
  return padrao;
};

// Modal para visualizar e editar a assinatura do acolhido no termo de
// concordância. Pré-carrega a assinatura existente e permite substituí-la ou
// removê-la. A assinatura do responsável é gerenciada na tela de responsáveis.
export default function AssinaturasModal({ acolhido, onFechar, onSalvo, onErro }) {
  const acolhidoId = acolhido?.id ?? null;

  const [assinouAcolhido, setAssinouAcolhido] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const canvasAcolhidoRef = useRef(null);

  useEffect(() => {
    if (!acolhido) return;
    setAssinouAcolhido(Boolean(acolhido.assinaturaAcolhido));
  }, [acolhido]);

  useEffect(() => {
    if (!acolhido) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape' && !salvando) onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [acolhido, onFechar, salvando]);

  if (!acolhido) return null;

  const handleSalvar = async () => {
    setSalvando(true);
    try {
      const payload = {
        assinaturaAcolhido: assinouAcolhido
          ? canvasAcolhidoRef.current?.toDataURL('image/png')
          : null,
      };
      const atualizado = await acolhidoService.atualizarAssinaturas(
        acolhidoId,
        payload
      );
      onSalvo?.(atualizado);
    } catch (err) {
      onErro?.(extrairErro(err, 'Erro ao salvar as assinaturas.'));
      setSalvando(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      onClick={() => !salvando && onFechar()}
    >
      <div
        className="modal modal-detalhes modal-detalhes-grande"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Assinatura do acolhido</span>
            <h3 className="modal-titulo detalhes-nome">{acolhido.nome}</h3>
          </div>
          <button
            type="button"
            className="modal-fechar"
            onClick={onFechar}
            disabled={salvando}
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="detalhes-corpo">
          <section className="detalhes-secao">
            <p className="campo-ajuda">
              Desenhe a assinatura abaixo. Use &quot;Limpar&quot; para removê-la
              antes de salvar. A assinatura do responsável é gerenciada na tela
              de responsáveis.
            </p>
            <div className="campo">
              <label>Assinatura do acolhido</label>
              <span className="campo-ajuda">{acolhido.nome || '—'}</span>
              <AssinaturaPad
                id="editar-assinatura-acolhido"
                canvasRef={canvasAcolhidoRef}
                onMudar={setAssinouAcolhido}
                disabled={salvando}
                valorInicial={acolhido.assinaturaAcolhido ?? null}
              />
            </div>
          </section>
        </div>

        <div className="modal-acoes detalhes-acoes">
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
            onClick={handleSalvar}
            disabled={salvando}
          >
            {salvando ? 'Salvando...' : 'Salvar assinaturas'}
          </button>
        </div>
      </div>
    </div>
  );
}
