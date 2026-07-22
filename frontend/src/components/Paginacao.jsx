// Controles de navegação de páginas. Renderiza nada quando há uma única página.
function intervaloPaginas(paginaAtual, totalPaginas) {
  const paginas = [];
  const inicio = Math.max(1, paginaAtual - 2);
  const fim = Math.min(totalPaginas, paginaAtual + 2);
  for (let p = inicio; p <= fim; p += 1) paginas.push(p);
  return paginas;
}

export default function Paginacao({
  paginaAtual,
  totalPaginas,
  onMudar,
  total,
  inicio,
  fim,
}) {
  if (totalPaginas <= 1) return null;

  const paginas = intervaloPaginas(paginaAtual, totalPaginas);
  const podeVoltar = paginaAtual > 1;
  const podeAvancar = paginaAtual < totalPaginas;

  return (
    <div className="paginacao">
      <span className="paginacao-info">
        Mostrando {total === 0 ? 0 : inicio + 1}–{fim} de {total}
      </span>
      <div className="paginacao-controles">
        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={() => onMudar(1)}
          disabled={!podeVoltar}
          aria-label="Primeira página"
        >
          «
        </button>
        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={() => onMudar(paginaAtual - 1)}
          disabled={!podeVoltar}
          aria-label="Página anterior"
        >
          ‹
        </button>

        {paginas[0] > 1 && <span className="paginacao-ellipsis">…</span>}
        {paginas.map((p) => (
          <button
            key={p}
            type="button"
            className={`btn btn-pequeno paginacao-num ${p === paginaAtual ? 'ativo' : ''}`}
            onClick={() => onMudar(p)}
            aria-current={p === paginaAtual ? 'page' : undefined}
          >
            {p}
          </button>
        ))}
        {paginas[paginas.length - 1] < totalPaginas && (
          <span className="paginacao-ellipsis">…</span>
        )}

        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={() => onMudar(paginaAtual + 1)}
          disabled={!podeAvancar}
          aria-label="Próxima página"
        >
          ›
        </button>
        <button
          type="button"
          className="btn btn-secundario btn-pequeno"
          onClick={() => onMudar(totalPaginas)}
          disabled={!podeAvancar}
          aria-label="Última página"
        >
          »
        </button>
      </div>
    </div>
  );
}
