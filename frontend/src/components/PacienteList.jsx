export default function PacienteList({
  pacientes,
  carregando,
  onExibir,
  onEditar,
  onExcluir,
}) {
  if (carregando) {
    return <div className="card vazio">Carregando pacientes...</div>;
  }

  if (!pacientes.length) {
    return (
      <div className="card vazio">
        Nenhum paciente cadastrado. Use o formulário acima para adicionar o primeiro.
      </div>
    );
  }

  return (
    <div className="card tabela-wrapper">
      <h2>Pacientes cadastrados ({pacientes.length})</h2>
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF</th>
            <th>Email</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.cpf}</td>
              <td>{p.email ?? '-'}</td>
              <td className="acoes-tabela">
                <button
                  className="btn btn-icone btn-exibir"
                  onClick={() => onExibir(p)}
                  title="Exibir detalhes"
                >
                  Exibir
                </button>
                <button
                  className="btn btn-icone"
                  onClick={() => onEditar(p)}
                  title="Editar"
                >
                  Editar
                </button>
                <button
                  className="btn btn-icone btn-perigo"
                  onClick={() => onExcluir(p)}
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
