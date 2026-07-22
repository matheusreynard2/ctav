import { useEffect } from 'react';

export default function DetalhesPertenceModal({ pertence, onFechar }) {
  useEffect(() => {
    if (!pertence) return undefined;
    const handleEsc = (e) => {
      if (e.key === 'Escape') onFechar();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [pertence, onFechar]);

  if (!pertence) return null;

  const fotos = Array.isArray(pertence.fotos) ? pertence.fotos : [];

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={onFechar}>
      <div className="modal modal-detalhes" onClick={(e) => e.stopPropagation()}>
        <div className="detalhes-cabecalho">
          <div>
            <span className="detalhes-eyebrow">Pertence</span>
            <h3 className="modal-titulo detalhes-nome">{pertence.item}</h3>
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
            <div className="detalhes-grid">
              <div className="detalhes-campo">
                <span className="detalhes-label">Acolhido</span>
                <span className="detalhes-valor">{pertence.acolhidoNome ?? '-'}</span>
              </div>
              <div className="detalhes-campo">
                <span className="detalhes-label">Quantidade</span>
                <span className="detalhes-valor">{pertence.quantidade}</span>
              </div>
              <div className="detalhes-campo detalhes-campo-largo">
                <span className="detalhes-label">Item</span>
                <span className="detalhes-valor">{pertence.item}</span>
              </div>
            </div>
          </section>

          <section className="detalhes-secao">
            <h4 className="detalhes-secao-titulo">Fotos ({fotos.length})</h4>
            {fotos.length === 0 ? (
              <p className="detalhes-vazio">Nenhuma foto anexada.</p>
            ) : (
              <div className="detalhes-pertence-fotos">
                {fotos.map((f) => (
                  <a
                    key={f.id}
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="detalhes-pertence-foto"
                    title={f.nomeArquivo || 'Foto do pertence'}
                  >
                    <img src={f.url} alt={f.nomeArquivo || 'Foto do pertence'} />
                  </a>
                ))}
              </div>
            )}
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
