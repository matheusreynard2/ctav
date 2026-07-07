import { useMemo, useState } from 'react';

// Seletor de múltiplos acolhidos: busca + lista de checkboxes.
// - acolhidos: lista disponível [{ id, nome, cpf }]
// - selecionados: array de ids (números)
// - onChange: (novosIds) => void
export default function SelecaoAcolhidos({
  id = 'selecao-acolhidos',
  acolhidos = [],
  selecionados = [],
  onChange,
  vazioTexto = 'Nenhum acolhido disponível.',
}) {
  const [busca, setBusca] = useState('');

  const selecionadosSet = useMemo(
    () => new Set(selecionados.map((x) => Number(x))),
    [selecionados]
  );

  const ordenados = useMemo(
    () =>
      [...acolhidos].sort((a, b) =>
        String(a.nome ?? '').localeCompare(String(b.nome ?? ''))
      ),
    [acolhidos]
  );

  const termo = busca.trim().toLowerCase();
  const filtrados = useMemo(() => {
    if (!termo) return ordenados;
    return ordenados.filter((a) =>
      [a.nome, a.cpf].some((v) =>
        String(v ?? '').toLowerCase().includes(termo)
      )
    );
  }, [ordenados, termo]);

  const alternar = (acolhidoId) => {
    const idNum = Number(acolhidoId);
    const novo = new Set(selecionadosSet);
    if (novo.has(idNum)) novo.delete(idNum);
    else novo.add(idNum);
    onChange?.([...novo]);
  };

  const selecionadosLista = ordenados.filter((a) =>
    selecionadosSet.has(Number(a.id))
  );

  return (
    <div className="selecao-acolhidos">
      {selecionadosLista.length > 0 && (
        <div className="selecao-acolhidos-chips">
          {selecionadosLista.map((a) => (
            <span key={a.id} className="selecao-acolhidos-chip">
              {a.nome}
              <button
                type="button"
                className="selecao-acolhidos-chip-remover"
                onClick={() => alternar(a.id)}
                aria-label={`Remover ${a.nome}`}
                title="Remover"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <input
        id={`${id}-busca`}
        type="search"
        className="busca-input"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar acolhido por nome ou CPF..."
        aria-label="Buscar acolhido"
      />

      <ul className="selecao-acolhidos-lista" role="group">
        {ordenados.length === 0 ? (
          <li className="selecao-acolhidos-vazio">{vazioTexto}</li>
        ) : filtrados.length === 0 ? (
          <li className="selecao-acolhidos-vazio">
            Nenhum acolhido encontrado para &quot;{busca}&quot;.
          </li>
        ) : (
          filtrados.map((a) => {
            const marcado = selecionadosSet.has(Number(a.id));
            return (
              <li key={a.id} className="selecao-acolhidos-item">
                <label className="campo-check">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => alternar(a.id)}
                  />
                  <span>
                    {a.nome}
                    {a.cpf ? ` — CPF ${a.cpf}` : ''}
                  </span>
                </label>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
