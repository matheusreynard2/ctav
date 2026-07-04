import { useEffect, useState } from 'react';
import {
  acolhidoService,
  anexoService,
  authService,
  combinadoService,
  medicamentoService,
} from './api';
import Login from './components/Login.jsx';
import DetalhesAcolhidoModal from './components/DetalhesAcolhidoModal.jsx';
import DetalhesCombinadoModal from './components/DetalhesCombinadoModal.jsx';
import GerenciarAnexosModal from './components/GerenciarAnexosModal.jsx';
import Header from './components/Header.jsx';
import ModalConfirmacao from './components/ModalConfirmacao.jsx';
import ModalMensagem from './components/ModalMensagem.jsx';
import AcolhidoForm from './components/AcolhidoForm.jsx';
import AcolhidoList from './components/AcolhidoList.jsx';
import MedicamentoForm from './components/MedicamentoForm.jsx';
import MedicamentoList from './components/MedicamentoList.jsx';
import CombinadoForm from './components/CombinadoForm.jsx';
import CombinadoList from './components/CombinadoList.jsx';
import Relatorios from './components/Relatorios.jsx';
import ControleMedicamentos from './components/ControleMedicamentos.jsx';

export default function App() {
  const [pagina, setPagina] = useState('inicio');

  const [usuario, setUsuario] = useState(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  const [acolhidos, setAcolhidos] = useState([]);
  const [carregandoAcolhidos, setCarregandoAcolhidos] = useState(false);
  const [salvandoAcolhido, setSalvandoAcolhido] = useState(false);
  const [acolhidoEditando, setAcolhidoEditando] = useState(null);
  const [acolhidoSelecionado, setAcolhidoSelecionado] = useState(null);
  const [acolhidoAnexos, setAcolhidoAnexos] = useState(null);
  const [acolhidoParaExcluir, setAcolhidoParaExcluir] = useState(null);
  const [excluindoAcolhido, setExcluindoAcolhido] = useState(false);

  const [medicamentos, setMedicamentos] = useState([]);
  const [carregandoMedicamentos, setCarregandoMedicamentos] = useState(false);
  const [salvandoMedicamento, setSalvandoMedicamento] = useState(false);
  const [medicamentoEditando, setMedicamentoEditando] = useState(null);
  const [medicamentoParaExcluir, setMedicamentoParaExcluir] = useState(null);
  const [excluindoMedicamento, setExcluindoMedicamento] = useState(false);

  const [combinados, setCombinados] = useState([]);
  const [carregandoCombinados, setCarregandoCombinados] = useState(false);
  const [salvandoCombinado, setSalvandoCombinado] = useState(false);
  const [combinadoEditando, setCombinadoEditando] = useState(null);
  const [combinadoSelecionado, setCombinadoSelecionado] = useState(null);
  const [combinadoParaExcluir, setCombinadoParaExcluir] = useState(null);
  const [excluindoCombinado, setExcluindoCombinado] = useState(false);

  // Modal unico para todas as mensagens (sucesso, erro, atualizacoes, etc.).
  const [modal, setModal] = useState(null); // { id, tipo, texto, paginaDestino }

  // Exclusao em massa (selecao por checkbox nas listagens).
  const [exclusaoEmMassa, setExclusaoEmMassa] = useState(null); // { tipo, registros }
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);

  const mostrarMensagem = (tipo, texto, paginaDestino = null) => {
    setModal({ id: Date.now() + Math.random(), tipo, texto, paginaDestino });
  };

  const extrairErroApi = (err, padrao) => {
    const data = err?.response?.data;
    if (data?.message) return data.message;
    if (data?.fields) {
      return Object.entries(data.fields)
        .map(([campo, msg]) => `${campo}: ${msg}`)
        .join(' | ');
    }
    if (!err?.response && err?.message) return err.message;
    return padrao;
  };

  const carregarAcolhidos = async () => {
    setCarregandoAcolhidos(true);
    try {
      const dados = await acolhidoService.listar();
      setAcolhidos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar acolhidos.'));
    } finally {
      setCarregandoAcolhidos(false);
    }
  };

  const carregarMedicamentos = async () => {
    setCarregandoMedicamentos(true);
    try {
      const dados = await medicamentoService.listar();
      setMedicamentos(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar medicamentos.'));
    } finally {
      setCarregandoMedicamentos(false);
    }
  };

  const carregarCombinados = async () => {
    setCarregandoCombinados(true);
    try {
      const dados = await combinadoService.listar();
      setCombinados(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar combinados.'));
    } finally {
      setCarregandoCombinados(false);
    }
  };

  // Verifica a sessao ao abrir o app (cookie HttpOnly enviado automaticamente).
  useEffect(() => {
    let ativo = true;
    authService
      .me()
      .then((u) => {
        if (ativo) setUsuario(u);
      })
      .catch(() => {
        if (ativo) setUsuario(null);
      })
      .finally(() => {
        if (ativo) setVerificandoAuth(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  // Sessao expirada (401 em qualquer rota protegida) -> volta ao login.
  useEffect(() => {
    const aoExpirar = () => setUsuario(null);
    window.addEventListener('auth:expirado', aoExpirar);
    return () => window.removeEventListener('auth:expirado', aoExpirar);
  }, []);

  // Carrega os dados somente quando ha um usuario autenticado.
  useEffect(() => {
    if (!usuario) return;
    carregarAcolhidos();
    carregarMedicamentos();
    carregarCombinados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario]);

  const handleNavegar = (novaPagina) => {
    setPagina(novaPagina);
    setAcolhidoEditando(null);
    setMedicamentoEditando(null);
    setCombinadoEditando(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModalSucesso = (texto, paginaDestino) => {
    setModal({ id: Date.now() + Math.random(), tipo: 'sucesso', texto, paginaDestino });
  };

  const fecharModal = () => {
    const destino = modal?.paginaDestino;
    setModal(null);
    if (destino === 'acolhidos') {
      setAcolhidoEditando(null);
      setPagina('acolhidos');
    } else if (destino === 'medicamentos') {
      setMedicamentoEditando(null);
      setPagina('medicamentos');
    } else if (destino === 'combinados') {
      setCombinadoEditando(null);
      setPagina('combinados');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvarAcolhido = async (dados, anexosPendentes = [], foto = {}) => {
    setSalvandoAcolhido(true);
    try {
      if (acolhidoEditando) {
        await acolhidoService.atualizar(acolhidoEditando.id, dados);
        try {
          if (foto.file) {
            await acolhidoService.enviarFoto(acolhidoEditando.id, foto.file);
          } else if (foto.remover) {
            await acolhidoService.removerFoto(acolhidoEditando.id);
          }
        } catch {
          mostrarMensagem('erro', 'Acolhido atualizado, mas a foto não pôde ser salva.');
        }
        await carregarAcolhidos();
        abrirModalSucesso('Acolhido atualizado com sucesso.', 'acolhidos');
        return true;
      }

      const criado = await acolhidoService.criar(dados);

      let falhas = 0;
      for (const anexo of anexosPendentes) {
        try {
          await anexoService.enviar(criado.id, anexo.file, anexo.tipo, anexo.nomeArquivo);
        } catch {
          falhas += 1;
        }
      }

      let falhaFoto = false;
      if (foto.file) {
        try {
          await acolhidoService.enviarFoto(criado.id, foto.file);
        } catch {
          falhaFoto = true;
        }
      }

      await carregarAcolhidos();

      if (falhas > 0 || falhaFoto) {
        const partes = [];
        if (falhas > 0) partes.push(`${falhas} anexo(s)`);
        if (falhaFoto) partes.push('a foto');
        mostrarMensagem(
          'erro',
          `Acolhido cadastrado, mas ${partes.join(' e ')} não puderam ser enviados.`
        );
      } else {
        abrirModalSucesso('Acolhido cadastrado com sucesso.', 'acolhidos');
      }

      return criado;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar acolhido.'));
      return null;
    } finally {
      setSalvandoAcolhido(false);
    }
  };

  const handleExibirAcolhido = (acolhido) => {
    setAcolhidoSelecionado(acolhido);
  };

  const handleFecharDetalhesAcolhido = () => {
    setAcolhidoSelecionado(null);
  };

  const handleAnexosAcolhido = (acolhido) => {
    setAcolhidoAnexos(acolhido);
  };

  const handleFecharAnexosAcolhido = () => {
    setAcolhidoAnexos(null);
  };

  const handleEditarAcolhido = (acolhido) => {
    setAcolhidoEditando(acolhido);
    setPagina('cadastro-acolhido');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoAcolhido = () => {
    setAcolhidoEditando(null);
    setPagina('acolhidos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirAcolhido = (acolhido) => {
    setAcolhidoParaExcluir(acolhido);
  };

  const cancelarExclusaoAcolhido = () => {
    if (excluindoAcolhido) return;
    setAcolhidoParaExcluir(null);
  };

  const confirmarExclusaoAcolhido = async () => {
    if (!acolhidoParaExcluir) return;
    setExcluindoAcolhido(true);
    try {
      await acolhidoService.deletar(acolhidoParaExcluir.id);
      mostrarMensagem('sucesso', 'Acolhido excluído com sucesso.');
      if (acolhidoEditando?.id === acolhidoParaExcluir.id) {
        setAcolhidoEditando(null);
      }
      setAcolhidoParaExcluir(null);
      await carregarAcolhidos();
      await carregarCombinados();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir acolhido.'));
    } finally {
      setExcluindoAcolhido(false);
    }
  };

  const handleSalvarMedicamento = async (dados) => {
    setSalvandoMedicamento(true);
    try {
      if (medicamentoEditando) {
        await medicamentoService.atualizar(medicamentoEditando.id, dados);
        await carregarMedicamentos();
        abrirModalSucesso('Medicamento atualizado com sucesso.', 'medicamentos');
      } else {
        await medicamentoService.criar(dados);
        setMedicamentoEditando(null);
        await carregarMedicamentos();
        abrirModalSucesso('Medicamento cadastrado com sucesso.', 'medicamentos');
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar medicamento.'));
    } finally {
      setSalvandoMedicamento(false);
    }
  };

  const handleEditarMedicamento = (medicamento) => {
    setMedicamentoEditando(medicamento);
    setPagina('cadastro-medicamento');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoMedicamento = () => {
    setMedicamentoEditando(null);
    setPagina('medicamentos');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirMedicamento = (medicamento) => {
    setMedicamentoParaExcluir(medicamento);
  };

  const cancelarExclusaoMedicamento = () => {
    if (excluindoMedicamento) return;
    setMedicamentoParaExcluir(null);
  };

  const confirmarExclusaoMedicamento = async () => {
    if (!medicamentoParaExcluir) return;
    setExcluindoMedicamento(true);
    try {
      await medicamentoService.deletar(medicamentoParaExcluir.id);
      mostrarMensagem('sucesso', 'Medicamento excluído com sucesso.');
      if (medicamentoEditando?.id === medicamentoParaExcluir.id) {
        setMedicamentoEditando(null);
      }
      setMedicamentoParaExcluir(null);
      await carregarMedicamentos();
      await carregarAcolhidos();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir medicamento.'));
    } finally {
      setExcluindoMedicamento(false);
    }
  };

  const handleSalvarCombinado = async (dados) => {
    setSalvandoCombinado(true);
    try {
      if (combinadoEditando) {
        await combinadoService.atualizar(combinadoEditando.id, dados);
        await carregarCombinados();
        abrirModalSucesso('Combinado atualizado com sucesso.', 'combinados');
      } else {
        await combinadoService.criar(dados);
        setCombinadoEditando(null);
        await carregarCombinados();
        abrirModalSucesso('Combinado cadastrado com sucesso.', 'combinados');
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar combinado.'));
    } finally {
      setSalvandoCombinado(false);
    }
  };

  const handleExibirCombinado = (combinado) => {
    setCombinadoSelecionado(combinado);
  };

  const handleFecharDetalhesCombinado = () => {
    setCombinadoSelecionado(null);
  };

  const handleEditarCombinado = (combinado) => {
    setCombinadoEditando(combinado);
    setPagina('cadastro-combinado');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoCombinado = () => {
    setCombinadoEditando(null);
    setPagina('combinados');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirCombinado = (combinado) => {
    setCombinadoParaExcluir(combinado);
  };

  const cancelarExclusaoCombinado = () => {
    if (excluindoCombinado) return;
    setCombinadoParaExcluir(null);
  };

  const confirmarExclusaoCombinado = async () => {
    if (!combinadoParaExcluir) return;
    setExcluindoCombinado(true);
    try {
      await combinadoService.deletar(combinadoParaExcluir.id);
      mostrarMensagem('sucesso', 'Combinado excluído com sucesso.');
      if (combinadoEditando?.id === combinadoParaExcluir.id) {
        setCombinadoEditando(null);
      }
      setCombinadoParaExcluir(null);
      await carregarCombinados();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir combinado.'));
    } finally {
      setExcluindoCombinado(false);
    }
  };

  const handleExcluirSelecionados = (tipo, registros) => {
    if (!registros?.length) return;
    setExclusaoEmMassa({ tipo, registros });
  };

  const cancelarExclusaoEmMassa = () => {
    if (excluindoEmMassa) return;
    setExclusaoEmMassa(null);
  };

  const confirmarExclusaoEmMassa = async () => {
    if (!exclusaoEmMassa) return;
    const { tipo, registros } = exclusaoEmMassa;
    const service =
      tipo === 'acolhido'
        ? acolhidoService
        : tipo === 'medicamento'
          ? medicamentoService
          : combinadoService;

    setExcluindoEmMassa(true);
    let sucesso = 0;
    let falhas = 0;
    for (const r of registros) {
      try {
        await service.deletar(r.id);
        sucesso += 1;
      } catch {
        falhas += 1;
      }
    }

    if (tipo === 'acolhido') {
      await carregarAcolhidos();
      await carregarCombinados();
    } else if (tipo === 'medicamento') {
      await carregarMedicamentos();
    } else {
      await carregarCombinados();
    }

    setExclusaoEmMassa(null);
    setExcluindoEmMassa(false);

    if (falhas === 0) {
      mostrarMensagem('sucesso', `${sucesso} registro(s) excluído(s) com sucesso.`);
    } else if (sucesso === 0) {
      mostrarMensagem('erro', 'Não foi possível excluir os registros selecionados.');
    } else {
      mostrarMensagem(
        'erro',
        `${sucesso} registro(s) excluído(s); ${falhas} não puderam ser excluídos.`
      );
    }
  };

  const handleAutenticado = (u) => {
    setUsuario(u);
    setPagina('inicio');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignora erros de logout; limpa o estado local de qualquer forma
    }
    setUsuario(null);
    setPagina('inicio');
    setAcolhidos([]);
    setMedicamentos([]);
    setCombinados([]);
  };

  const mostrarDescricao = pagina === 'inicio';
  const mostrarFormAcolhido = pagina === 'cadastro-acolhido';
  const mostrarListaAcolhidos = pagina === 'acolhidos';
  const mostrarFormMedicamento = pagina === 'cadastro-medicamento';
  const mostrarListaMedicamentos = pagina === 'medicamentos';
  const mostrarFormCombinado = pagina === 'cadastro-combinado';
  const mostrarListaCombinados = pagina === 'combinados';
  const mostrarRelatorios = pagina === 'relatorios';
  const mostrarControleMedicamentos = pagina === 'controle-medicamentos';

  if (verificandoAuth) {
    return (
      <div className="app">
        <div className="auth-carregando">Carregando...</div>
      </div>
    );
  }

  if (!usuario) {
    return <Login onAutenticado={handleAutenticado} />;
  }

  return (
    <div className="app">
      <Header
        pagina={pagina}
        onNavegar={handleNavegar}
        usuario={usuario}
        onLogout={handleLogout}
      />

      <main className="container conteudo">
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
                  ou seja, seus acolhidos e tudo que envolve eles, como:
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

        {mostrarFormAcolhido && (
          <AcolhidoForm
            acolhidoEditando={acolhidoEditando}
            medicamentosDisponiveis={medicamentos}
            onSalvar={handleSalvarAcolhido}
            onCancelar={handleCancelarEdicaoAcolhido}
            onVerLista={() => handleNavegar('acolhidos')}
            salvando={salvandoAcolhido}
          />
        )}

        {mostrarListaAcolhidos && (
          <AcolhidoList
            acolhidos={acolhidos}
            carregando={carregandoAcolhidos}
            onExibir={handleExibirAcolhido}
            onEditar={handleEditarAcolhido}
            onExcluir={handleExcluirAcolhido}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('acolhido', registros)
            }
            onAnexos={handleAnexosAcolhido}
            onNovo={() => handleNavegar('cadastro-acolhido')}
          />
        )}

        {mostrarFormMedicamento && (
          <MedicamentoForm
            medicamentoEditando={medicamentoEditando}
            onSalvar={handleSalvarMedicamento}
            onCancelar={handleCancelarEdicaoMedicamento}
            onVerLista={() => handleNavegar('medicamentos')}
            salvando={salvandoMedicamento}
          />
        )}

        {mostrarListaMedicamentos && (
          <MedicamentoList
            medicamentos={medicamentos}
            carregando={carregandoMedicamentos}
            onEditar={handleEditarMedicamento}
            onExcluir={handleExcluirMedicamento}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('medicamento', registros)
            }
            onNovo={() => handleNavegar('cadastro-medicamento')}
          />
        )}

        {mostrarFormCombinado && (
          <CombinadoForm
            combinadoEditando={combinadoEditando}
            acolhidosDisponiveis={acolhidos}
            onSalvar={handleSalvarCombinado}
            onCancelar={handleCancelarEdicaoCombinado}
            onVerLista={() => handleNavegar('combinados')}
            salvando={salvandoCombinado}
          />
        )}

        {mostrarListaCombinados && (
          <CombinadoList
            combinados={combinados}
            carregando={carregandoCombinados}
            onExibir={handleExibirCombinado}
            onEditar={handleEditarCombinado}
            onExcluir={handleExcluirCombinado}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('combinado', registros)
            }
            onNovo={() => handleNavegar('cadastro-combinado')}
          />
        )}

        {mostrarRelatorios && (
          <Relatorios
            acolhidos={acolhidos}
            carregando={carregandoAcolhidos}
            onErro={(msg) => mostrarMensagem('erro', msg)}
          />
        )}

        {mostrarControleMedicamentos && (
          <ControleMedicamentos
            acolhidos={acolhidos}
            carregando={carregandoAcolhidos}
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onSucesso={(msg) => mostrarMensagem('sucesso', msg)}
            onRecarregarAcolhidos={carregarAcolhidos}
          />
        )}
      </main>

      <DetalhesAcolhidoModal
        acolhido={acolhidoSelecionado}
        onFechar={handleFecharDetalhesAcolhido}
      />

      <DetalhesCombinadoModal
        combinado={combinadoSelecionado}
        onFechar={handleFecharDetalhesCombinado}
      />

      <GerenciarAnexosModal
        acolhido={acolhidoAnexos}
        onFechar={handleFecharAnexosAcolhido}
      />

      <ModalConfirmacao
        aberto={Boolean(acolhidoParaExcluir)}
        titulo="Excluir acolhido"
        mensagem={
          acolhidoParaExcluir
            ? `Deseja realmente excluir o acolhido "${acolhidoParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoAcolhido ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoAcolhido}
        onCancelar={cancelarExclusaoAcolhido}
      />

      <ModalConfirmacao
        aberto={Boolean(medicamentoParaExcluir)}
        titulo="Excluir medicamento"
        mensagem={
          medicamentoParaExcluir
            ? `Deseja realmente excluir o medicamento "${medicamentoParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoMedicamento ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoMedicamento}
        onCancelar={cancelarExclusaoMedicamento}
      />

      <ModalConfirmacao
        aberto={Boolean(combinadoParaExcluir)}
        titulo="Excluir combinado"
        mensagem={
          combinadoParaExcluir
            ? `Deseja realmente excluir este combinado de "${combinadoParaExcluir.acolhidoNome ?? 'acolhido'}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoCombinado ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoCombinado}
        onCancelar={cancelarExclusaoCombinado}
      />

      <ModalConfirmacao
        aberto={Boolean(exclusaoEmMassa)}
        titulo="Excluir selecionados"
        mensagem={
          exclusaoEmMassa
            ? `Deseja realmente excluir os ${exclusaoEmMassa.registros.length} registro(s) selecionado(s)? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoEmMassa ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoEmMassa}
        onCancelar={cancelarExclusaoEmMassa}
      />

      <ModalMensagem
        key={modal?.id}
        aberto={Boolean(modal)}
        tipo={modal?.tipo ?? 'sucesso'}
        mensagem={modal?.texto ?? ''}
        duracao={modal?.tipo === 'erro' ? 7000 : 4000}
        onFechar={fecharModal}
      />
    </div>
  );
}
