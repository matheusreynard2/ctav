import { useEffect, useState } from 'react';
import { pacienteService } from './api';
import DetalhesPacienteModal from './components/DetalhesPacienteModal.jsx';
import Header from './components/Header.jsx';
import ModalConfirmacao from './components/ModalConfirmacao.jsx';
import PacienteForm from './components/PacienteForm.jsx';
import PacienteList from './components/PacienteList.jsx';

export default function App() {
  const [pagina, setPagina] = useState('inicio');
  const [pacientes, setPacientes] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState(null);
  const [pacienteSelecionado, setPacienteSelecionado] = useState(null);
  const [pacienteParaExcluir, setPacienteParaExcluir] = useState(null);
  const [excluindo, setExcluindo] = useState(false);
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

  const handleNavegar = (novaPagina) => {
    setPagina(novaPagina);
    setPacienteEditando(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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

  const handleExibir = (paciente) => {
    setPacienteSelecionado(paciente);
  };

  const handleFecharDetalhes = () => {
    setPacienteSelecionado(null);
  };

  const handleEditar = (paciente) => {
    setPacienteEditando(paciente);
    if (pagina === 'pacientes') {
      setPagina('cadastro');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelar = () => {
    setPacienteEditando(null);
  };

  const handleExcluir = (paciente) => {
    setPacienteParaExcluir(paciente);
  };

  const cancelarExclusao = () => {
    if (excluindo) return;
    setPacienteParaExcluir(null);
  };

  const confirmarExclusao = async () => {
    if (!pacienteParaExcluir) return;
    setExcluindo(true);
    try {
      await pacienteService.deletar(pacienteParaExcluir.id);
      mostrarMensagem('sucesso', 'Paciente excluído com sucesso.');
      if (pacienteEditando?.id === pacienteParaExcluir.id) {
        setPacienteEditando(null);
      }
      setPacienteParaExcluir(null);
      await carregarPacientes();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir paciente.'));
    } finally {
      setExcluindo(false);
    }
  };

  const mostrarForm = pagina === 'inicio' || pagina === 'cadastro';
  const mostrarLista = pagina === 'inicio' || pagina === 'pacientes';
  const mostrarDescricao = pagina === 'inicio';

  return (
    <div className="app">
      <Header pagina={pagina} onNavegar={handleNavegar} />

      <main className="container conteudo">
        {mensagem && (
          <div className={`alerta alerta-${mensagem.tipo}`}>{mensagem.texto}</div>
        )}

        {mostrarDescricao && (
          <section className="card descricao-sistema">
            <div className="descricao-conteudo">
              <div className="descricao-texto">
                <span className="descricao-etiqueta">Descrição do Sistema</span>
                <h2 className="descricao-saudacao">
                  Bem vindo ao sistema da <strong>CTAV</strong>.
                </h2>
                <p>
                  Esse sistema gerencia o <strong>Centro Terapêutico Águas Vivas</strong>,
                  ou seja, seus pacientes e tudo que envolve eles, como:
                </p>
                <ul className="descricao-lista">
                  <li>medicações</li>
                  <li>saídas</li>
                  <li>combinados</li>
                  <li>altas</li>
                  <li>etc.</li>
                </ul>
                <p>
                  Você, como tem acesso a ele, deve ser um funcionário, por isso
                  desejamos uma ótima experiência aqui conosco e qualquer dúvida{' '}
                  <a href="#" className="descricao-link" onClick={(e) => e.preventDefault()}>
                    clique aqui
                  </a>
                  .
                </p>
                <p className="descricao-fechamento">Muito obrigado!</p>
              </div>

              <div className="descricao-ilustracao" aria-hidden="true">
                <svg viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="bgGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#eff6ff" />
                      <stop offset="100%" stopColor="#bfdbfe" />
                    </linearGradient>
                    <linearGradient id="heartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>

                  <rect width="320" height="240" rx="20" fill="url(#bgGrad)" />

                  <circle cx="40" cy="40" r="5" fill="white" opacity="0.7" />
                  <circle cx="280" cy="55" r="4" fill="white" opacity="0.65" />
                  <circle cx="60" cy="180" r="6" fill="white" opacity="0.7" />
                  <circle cx="275" cy="190" r="5" fill="white" opacity="0.6" />
                  <circle cx="290" cy="120" r="3" fill="white" opacity="0.75" />
                  <circle cx="35" cy="115" r="3" fill="white" opacity="0.75" />

                  <path
                    d="M 290 30 l 3 6 l 6 3 l -6 3 l -3 6 l -3 -6 l -6 -3 l 6 -3 z"
                    fill="white"
                    opacity="0.85"
                  />
                  <path
                    d="M 28 200 l 2.5 5 l 5 2.5 l -5 2.5 l -2.5 5 l -2.5 -5 l -5 -2.5 l 5 -2.5 z"
                    fill="white"
                    opacity="0.75"
                  />

                  <g transform="translate(160 132)">
                    <path
                      d="M 0 32 C -52 0 -78 -30 -52 -56 C -32 -72 -12 -56 0 -40 C 12 -56 32 -72 52 -56 C 78 -30 52 0 0 32 Z"
                      fill="url(#heartGrad)"
                    />
                    <rect x="-6" y="-50" width="12" height="36" rx="2.5" fill="white" />
                    <rect x="-18" y="-38" width="36" height="12" rx="2.5" fill="white" />
                  </g>

                  <path
                    d="M 100 205 Q 160 222, 220 205"
                    stroke="white"
                    strokeWidth="3"
                    fill="none"
                    strokeLinecap="round"
                    opacity="0.7"
                  />
                </svg>
              </div>
            </div>
          </section>
        )}

        {mostrarForm && (
          <PacienteForm
            pacienteEditando={pacienteEditando}
            onSalvar={handleSalvar}
            onCancelar={handleCancelar}
            salvando={salvando}
          />
        )}

        {mostrarLista && (
          <PacienteList
            pacientes={pacientes}
            carregando={carregando}
            onExibir={handleExibir}
            onEditar={handleEditar}
            onExcluir={handleExcluir}
          />
        )}
      </main>

      <DetalhesPacienteModal
        paciente={pacienteSelecionado}
        onFechar={handleFecharDetalhes}
      />

      <ModalConfirmacao
        aberto={Boolean(pacienteParaExcluir)}
        titulo="Excluir paciente"
        mensagem={
          pacienteParaExcluir
            ? `Deseja realmente excluir o paciente "${pacienteParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindo ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusao}
        onCancelar={cancelarExclusao}
      />
    </div>
  );
}
