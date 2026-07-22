import { useEffect, useMemo, useState } from 'react';

// Paginação client-side reutilizável. Recebe a lista já filtrada/ordenada e
// devolve apenas os itens da página atual, além dos controles de navegação.
// `resetDep` (ex.: termo de busca) reinicia para a primeira página quando muda.
export function usePaginacao(itens, porPagina = 10, resetDep) {
  const [pagina, setPagina] = useState(1);
  const lista = Array.isArray(itens) ? itens : [];
  const total = lista.length;
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina));

  // Reinicia para a primeira página quando o filtro (dependência) muda.
  useEffect(() => {
    setPagina(1);
  }, [resetDep]);

  // Garante que a página atual permaneça dentro do intervalo válido (ex.: após
  // excluir registros ou reduzir os resultados de uma busca).
  useEffect(() => {
    if (pagina > totalPaginas) setPagina(totalPaginas);
  }, [pagina, totalPaginas]);

  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const itensPagina = useMemo(
    () => lista.slice(inicio, inicio + porPagina),
    [lista, inicio, porPagina]
  );

  return {
    paginaAtual,
    setPagina,
    totalPaginas,
    total,
    inicio,
    fim: Math.min(inicio + porPagina, total),
    itensPagina,
  };
}
