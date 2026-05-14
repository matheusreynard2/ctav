const resumirDescricao = (texto, max = 56) => {
  if (!texto) return '—';
  const t = String(texto).trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
};

export default function RemedioList({
  remedios,
  carregando,
  onEditar,
  onExcluir,
}) {
  if (carregando) {
    return <div className="card vazio">Carregando remédios...</div>;
  }

  if (!remedios.length) {
    return (
      <div className="card vazio">
        Nenhum remédio cadastrado. Use o formulário em &apos;Remédios &gt; Cadastrar remédio&apos;
        para fazer cadastros.
      </div>
    );
  }

  return (
    <div className="card tabela-wrapper">
      <h2>Remédios cadastrados ({remedios.length})</h2>
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Descrição</th>
            <th>Qtd. de caixas</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {remedios.map((r) => (
            <tr key={r.id}>
              <td>{r.nome}</td>
              <td title={r.descricao}>{resumirDescricao(r.descricao)}</td>
              <td>{r.quantidade_caixas}</td>
              <td className="acoes-tabela">
                <button
                  className="btn btn-icone"
                  onClick={() => onEditar(r)}
                  title="Editar"
                >
                  Editar
                </button>
                <button
                  className="btn btn-icone btn-perigo"
                  onClick={() => onExcluir(r)}
                  title="Excluir"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
