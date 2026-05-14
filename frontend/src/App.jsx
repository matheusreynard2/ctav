import { useEffect, useState } from 'react';
import { acolhidoService, remedioService } from './api';
import DetalhesAcolhidoModal from './components/DetalhesAcolhidoModal.jsx';
import Header from './components/Header.jsx';
import ModalConfirmacao from './components/ModalConfirmacao.jsx';
import AcolhidoForm from './components/AcolhidoForm.jsx';
import AcolhidoList from './components/AcolhidoList.jsx';
import RemedioForm from './components/RemedioForm.jsx';
import RemedioList from './components/RemedioList.jsx';

export default function App() {
  const [pagina, setPagina] = useState('inicio');

  const [acolhidos, setAcolhidos] = useState([]);
  const [carregandoAcolhidos, setCarregandoAcolhidos] = useState(false);
  const [salvandoAcolhido, setSalvandoAcolhido] = useState(false);
  const [acolhidoEditando, setAcolhidoEditando] = useState(null);
  const [acolhidoSelecionado, setAcolhidoSelecionado] = useState(null);
  const [acolhidoParaExcluir, setAcolhidoParaExcluir] = useState(null);
  const [excluindoAcolhido, setExcluindoAcolhido] = useState(false);

  const [remedios, setRemedios] = useState([]);
  const [carregandoRemedios, setCarregandoRemedios] = useState(false);
  const [salvandoRemedio, setSalvandoRemedio] = useState(false);
  const [remedioEditando, setRemedioEditando] = useState(null);
  const [remedioParaExcluir, setRemedioParaExcluir] = useState(null);
  const [excluindoRemedio, setExcluindoRemedio] = useState(false);

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

  const carregarAcolhidos = async () => {
    setCarregandoAcolhidos(true);
    try {
      const dados = await acolhidoService.listar();
      setAcolhidos(dados);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar acolhidos.'));
    } finally {
      setCarregandoAcolhidos(false);
    }
  };

  const carregarRemedios = async () => {
    setCarregandoRemedios(true);
    try {
      const dados = await remedioService.listar();
      setRemedios(dados);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar remédios.'));
    } finally {
      setCarregandoRemedios(false);
    }
  };

  useEffect(() => {
    carregarAcolhidos();
    carregarRemedios();
  }, []);

  const handleNavegar = (novaPagina) => {
    setPagina(novaPagina);
    setAcolhidoEditando(null);
    setRemedioEditando(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSalvarAcolhido = async (dados) => {
    setSalvandoAcolhido(true);
    try {
      if (acolhidoEditando) {
        await acolhidoService.atualizar(acolhidoEditando.id, dados);
        mostrarMensagem('sucesso', 'Acolhido atualizado com sucesso.');
      } else {
        await acolhidoService.criar(dados);
        mostrarMensagem('sucesso', 'Acolhido cadastrado com sucesso.');
      }
      setAcolhidoEditando(null);
      await carregarAcolhidos();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar acolhido.'));
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

  const handleEditarAcolhido = (acolhido) => {
    setAcolhidoEditando(acolhido);
    setPagina('cadastro-acolhido');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoAcolhido = () => {
    setAcolhidoEditando(null);
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
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir acolhido.'));
    } finally {
      setExcluindoAcolhido(false);
    }
  };

  const handleSalvarRemedio = async (dados) => {
    setSalvandoRemedio(true);
    try {
      if (remedioEditando) {
        await remedioService.atualizar(remedioEditando.id, dados);
        mostrarMensagem('sucesso', 'Remédio atualizado com sucesso.');
      } else {
        await remedioService.criar(dados);
        mostrarMensagem('sucesso', 'Remédio cadastrado com sucesso.');
      }
      setRemedioEditando(null);
      await carregarRemedios();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar remédio.'));
    } finally {
      setSalvandoRemedio(false);
    }
  };

  const handleEditarRemedio = (remedio) => {
    setRemedioEditando(remedio);
    setPagina('cadastro-remedio');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoRemedio = () => {
    setRemedioEditando(null);
  };

  const handleExcluirRemedio = (remedio) => {
    setRemedioParaExcluir(remedio);
  };

  const cancelarExclusaoRemedio = () => {
    if (excluindoRemedio) return;
    setRemedioParaExcluir(null);
  };

  const confirmarExclusaoRemedio = async () => {
    if (!remedioParaExcluir) return;
    setExcluindoRemedio(true);
    try {
      await remedioService.deletar(remedioParaExcluir.id);
      mostrarMensagem('sucesso', 'Remédio excluído com sucesso.');
      if (remedioEditando?.id === remedioParaExcluir.id) {
        setRemedioEditando(null);
      }
      setRemedioParaExcluir(null);
      await carregarRemedios();
      await carregarAcolhidos();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir remédio.'));
    } finally {
      setExcluindoRemedio(false);
    }
  };

  const mostrarDescricao = pagina === 'inicio';
  const mostrarFormAcolhido = pagina === 'cadastro-acolhido';
  const mostrarListaAcolhidos = pagina === 'acolhidos';
  const mostrarFormRemedio = pagina === 'cadastro-remedio';
  const mostrarListaRemedios = pagina === 'remedios';

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
            remediosDisponiveis={remedios}
            onSalvar={handleSalvarAcolhido}
            onCancelar={handleCancelarEdicaoAcolhido}
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
          />
        )}

        {mostrarFormRemedio && (
          <RemedioForm
            remedioEditando={remedioEditando}
            onSalvar={handleSalvarRemedio}
            onCancelar={handleCancelarEdicaoRemedio}
            salvando={salvandoRemedio}
          />
        )}

        {mostrarListaRemedios && (
          <RemedioList
            remedios={remedios}
            carregando={carregandoRemedios}
            onEditar={handleEditarRemedio}
            onExcluir={handleExcluirRemedio}
          />
        )}
      </main>

      <DetalhesAcolhidoModal
        acolhido={acolhidoSelecionado}
        onFechar={handleFecharDetalhesAcolhido}
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
        aberto={Boolean(remedioParaExcluir)}
        titulo="Excluir remédio"
        mensagem={
          remedioParaExcluir
            ? `Deseja realmente excluir o remédio "${remedioParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoRemedio ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoRemedio}
        onCancelar={cancelarExclusaoRemedio}
      />
    </div>
  );
}
