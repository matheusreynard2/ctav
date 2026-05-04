const formatarData = (data) => {
  if (!data) return '-';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
};

const formatarSexo = (sexo) => {
  if (!sexo) return '-';
  const mapa = { MASCULINO: 'Masculino', FEMININO: 'Feminino', OUTRO: 'Outro' };
  return mapa[sexo] ?? sexo;
};

export default function PacienteList({ pacientes, carregando, onEditar, onExcluir }) {
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
            <th>Nascimento</th>
            <th>Sexo</th>
            <th>Email</th>
            <th>Celular</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {pacientes.map((p) => (
            <tr key={p.id}>
              <td>{p.nome}</td>
              <td>{p.cpf}</td>
              <td>{formatarData(p.dataNascimento)}</td>
              <td>{formatarSexo(p.sexo)}</td>
              <td>{p.email ?? '-'}</td>
              <td>{p.telefone ?? '-'}</td>
              <td className="acoes-tabela">
                <button className="btn btn-icone" onClick={() => onEditar(p)} title="Editar">
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
