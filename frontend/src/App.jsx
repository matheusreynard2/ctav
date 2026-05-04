import { useEffect, useState } from 'react';
import { pacienteService } from './api';
import PacienteForm from './components/PacienteForm.jsx';
import PacienteList from './components/PacienteList.jsx';

export default function App() {
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [mensagem, setMensagem] = useState(null);

  const mostrarMensagem = (tipo, texto) => {
    setMensagem({ tipo, texto });
    setTimeout(() => setMensagem(null), 4000);
  };

  const extrairErroApi = (err, padrao) => {
    const data = err?.response?.data;
    if (data?.message) return data.message;
    if (data?.fields) {
      return Object.entries(data.fields)
        .map(([campo, msg]) => `${campo}: ${msg}`)
        .join(' | ');
    }
    return padrao;
  };

  const carregarPacientes = async () => {
    setCarregando(true);
    try {
      const dados = await pacienteService.listar();
      setPacientes(dados);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar pacientes.'));
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarPacientes();
  }, []);

  const handleSalvar = async (dados) => {
    setSalvando(true);
    try {
      if (pacienteEditando) {
        await pacienteService.atualizar(pacienteEditando.id, dados);
        mostrarMensagem('sucesso', 'Paciente atualizado com sucesso.');
      } else {
        await pacienteService.criar(dados);
        mostrarMensagem('sucesso', 'Paciente cadastrado com sucesso.');
      }
      setPacienteEditando(null);
      await carregarPacientes();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar paciente.'));
    } finally {
      setSalvando(false);
    }
  };

  const handleEditar = (paciente) => {
    setPacienteEditando(paciente);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setPacienteEditando(null);
  };

  const handleExcluir = async (paciente) => {
    const confirmar = window.confirm(`Excluir o paciente "${paciente.nome}"?`);
    if (!confirmar) return;

    try {
      await pacienteService.deletar(paciente.id);
      mostrarMensagem('sucesso', 'Paciente excluído com sucesso.');
      if (pacienteEditando?.id === paciente.id) setPacienteEditando(null);
      await carregarPacientes();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir paciente.'));
    }
  };

  return (
    <div className="app">
      <header className="topo">
        <div className="container">
          <h1>CTAV</h1>
          <p>Gerenciamento de Pacientes</p>
        </div>
      </header>

      <main className="container conteudo">
        {mensagem && (
          <div className={`alerta alerta-${mensagem.tipo}`}>{mensagem.texto}</div>
        )}

        <PacienteForm
          pacienteEditando={pacienteEditando}
          onSalvar={handleSalvar}
          onCancelar={handleCancelar}
          salvando={salvando}
        />

        <PacienteList
          pacientes={pacientes}
          carregando={carregando}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
        />
      </main>
    </div>
  );
}
