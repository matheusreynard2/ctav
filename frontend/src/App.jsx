import { useEffect, useMemo, useRef, useState } from 'react';
import {
  acolhidoService,
  anexoService,
  authService,
  combinadoService,
  consultaService,
  medicamentoService,
  motivoService,
  ocorrenciaService,
  pertenceService,
  prescricaoService,
  responsavelService,
} from './api';
import Login from './components/Login.jsx';
import DetalhesAcolhidoModal from './components/DetalhesAcolhidoModal.jsx';
import DetalhesCombinadoModal from './components/DetalhesCombinadoModal.jsx';
import DetalhesConsultaModal from './components/DetalhesConsultaModal.jsx';
import DetalhesOcorrenciaModal from './components/DetalhesOcorrenciaModal.jsx';
import DetalhesResponsavelModal from './components/DetalhesResponsavelModal.jsx';
import GerenciarAnexosModal from './components/GerenciarAnexosModal.jsx';
import AssinaturasModal from './components/AssinaturasModal.jsx';
import Header from './components/Header.jsx';
import ModalConfirmacao from './components/ModalConfirmacao.jsx';
import ModalAlertaEstoque from './components/ModalAlertaEstoque.jsx';
import ModalAlertaConsultas from './components/ModalAlertaConsultas.jsx';
import ConcluirConsultaModal from './components/ConcluirConsultaModal.jsx';
import ModalMensagem from './components/ModalMensagem.jsx';
import AcolhidoForm from './components/AcolhidoForm.jsx';
import AcolhidoList from './components/AcolhidoList.jsx';
import HistoricoList from './components/HistoricoList.jsx';
import MedicamentoForm from './components/MedicamentoForm.jsx';
import MedicamentoList from './components/MedicamentoList.jsx';
import MotivoForm from './components/MotivoForm.jsx';
import MotivoList from './components/MotivoList.jsx';
import CombinadoForm from './components/CombinadoForm.jsx';
import CombinadoList from './components/CombinadoList.jsx';
import ConsultaForm from './components/ConsultaForm.jsx';
import ConsultaList from './components/ConsultaList.jsx';
import PertenceForm from './components/PertenceForm.jsx';
import PertenceList from './components/PertenceList.jsx';
import DetalhesPertenceModal from './components/DetalhesPertenceModal.jsx';
import OcorrenciaForm from './components/OcorrenciaForm.jsx';
import OcorrenciaList from './components/OcorrenciaList.jsx';
import ResponsavelForm from './components/ResponsavelForm.jsx';
import ResponsavelList from './components/ResponsavelList.jsx';
import Relatorios from './components/Relatorios.jsx';
import Documentos from './components/Documentos.jsx';
import ConfiguracoesUsuario from './components/ConfiguracoesUsuario.jsx';
import ControleMedicamentos from './components/ControleMedicamentos.jsx';
import GestaoMedicacao from './components/GestaoMedicacao.jsx';
import LogoBetesda from './components/LogoBetesda.jsx';
import { exportTutorialPdf } from './utils/exportarRelatoriosPdf';
import { filtrarAlertasEstoquePorAcolhido } from './utils/estoqueMedicamentos';
import { filtrarConsultasProximas } from './utils/consultas';

// Paginas acessiveis aos perfis nao administradores (psicologo/advogado/
// financeiro): pagina inicial, relatorios e as configuracoes da propria conta.
const PAGINAS_PERMITIDAS_NAO_ADMIN = ['inicio', 'relatorios', 'configuracoes'];

// Paginas de agendamento de consultas, liberadas somente para psicologo (2)
// (o administrador ja tem acesso total).
const PAGINAS_CONSULTAS = ['consultas', 'cadastro-consulta'];

// Paginas liberadas para um perfil nao administrador conforme a permissao.
const paginasPermitidasNaoAdmin = (permissaoId) =>
  permissaoId === 2
    ? [...PAGINAS_PERMITIDAS_NAO_ADMIN, ...PAGINAS_CONSULTAS]
    : PAGINAS_PERMITIDAS_NAO_ADMIN;

export default function App() {
  const [pagina, setPagina] = useState('inicio');

  const [usuario, setUsuario] = useState(null);
  const [verificandoAuth, setVerificandoAuth] = useState(true);

  const [acolhidos, setAcolhidos] = useState([]);
  const [carregandoAcolhidos, setCarregandoAcolhidos] = useState(false);
  const [salvandoAcolhido, setSalvandoAcolhido] = useState(false);
  const [acolhidoEditando, setAcolhidoEditando] = useState(null);
  // Rascunho do formulário de acolhido preservado ao ir cadastrar um novo
  // responsável e voltar (para não perder os dados já digitados).
  const [acolhidoRascunho, setAcolhidoRascunho] = useState(null);
  const [acolhidoSelecionado, setAcolhidoSelecionado] = useState(null);
  const [acolhidoAnexos, setAcolhidoAnexos] = useState(null);
  const [acolhidoAssinaturas, setAcolhidoAssinaturas] = useState(null);
  const [acolhidoParaExcluir, setAcolhidoParaExcluir] = useState(null);
  const [excluindoAcolhido, setExcluindoAcolhido] = useState(false);

  // Arquivo morto / histórico de acolhidos.
  const [historico, setHistorico] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);
  // Envio ao histórico (arquivamento) — guarda os registros selecionados.
  const [arquivamento, setArquivamento] = useState(null); // { registros }
  const [arquivando, setArquivando] = useState(false);
  // Restauração de volta para a lista de acolhidos.
  const [restauracao, setRestauracao] = useState(null); // { registros }
  const [restaurando, setRestaurando] = useState(false);

  const [medicamentos, setMedicamentos] = useState([]);
  const [carregandoMedicamentos, setCarregandoMedicamentos] = useState(false);
  const [salvandoMedicamento, setSalvandoMedicamento] = useState(false);
  const [medicamentoEditando, setMedicamentoEditando] = useState(null);
  const [medicamentoParaExcluir, setMedicamentoParaExcluir] = useState(null);
  const [excluindoMedicamento, setExcluindoMedicamento] = useState(false);
  const [alertaEstoqueMedicamentos, setAlertaEstoqueMedicamentos] = useState(null);
  const alertaEstoqueExibidoRef = useRef(false);

  // Motivos de adesao e desistencia (CRUD e uso no cadastro de acolhido).
  const [motivosAdesao, setMotivosAdesao] = useState([]);
  const [motivosDesistencia, setMotivosDesistencia] = useState([]);
  const [carregandoMotivos, setCarregandoMotivos] = useState(false);
  const [salvandoMotivo, setSalvandoMotivo] = useState(false);
  const [motivoEditando, setMotivoEditando] = useState(null);
  const [motivoParaExcluir, setMotivoParaExcluir] = useState(null);
  const [excluindoMotivo, setExcluindoMotivo] = useState(false);

  const [combinados, setCombinados] = useState([]);
  const [carregandoCombinados, setCarregandoCombinados] = useState(false);
  const [salvandoCombinado, setSalvandoCombinado] = useState(false);
  const [combinadoEditando, setCombinadoEditando] = useState(null);
  const [combinadoSelecionado, setCombinadoSelecionado] = useState(null);
  const [combinadoParaExcluir, setCombinadoParaExcluir] = useState(null);
  const [excluindoCombinado, setExcluindoCombinado] = useState(false);

  const [pertencesGerais, setPertencesGerais] = useState([]);
  const [carregandoPertencesGerais, setCarregandoPertencesGerais] = useState(false);
  const [salvandoPertence, setSalvandoPertence] = useState(false);
  const [pertenceEditando, setPertenceEditando] = useState(null);
  const [pertenceSelecionado, setPertenceSelecionado] = useState(null);
  const [pertenceParaExcluir, setPertenceParaExcluir] = useState(null);
  const [excluindoPertence, setExcluindoPertence] = useState(false);

  const [consultas, setConsultas] = useState([]);
  const [carregandoConsultas, setCarregandoConsultas] = useState(false);
  const [salvandoConsulta, setSalvandoConsulta] = useState(false);
  const [consultaEditando, setConsultaEditando] = useState(null);
  const [consultaSelecionada, setConsultaSelecionada] = useState(null);
  const [consultaParaExcluir, setConsultaParaExcluir] = useState(null);
  const [excluindoConsulta, setExcluindoConsulta] = useState(false);
  const [consultaParaConcluir, setConsultaParaConcluir] = useState(null);
  const [concluindoConsulta, setConcluindoConsulta] = useState(false);
  const [alertaConsultas, setAlertaConsultas] = useState(null);
  const alertaConsultasExibidoRef = useRef(false);

  const [ocorrencias, setOcorrencias] = useState([]);
  const [carregandoOcorrencias, setCarregandoOcorrencias] = useState(false);
  const [salvandoOcorrencia, setSalvandoOcorrencia] = useState(false);
  const [ocorrenciaEditando, setOcorrenciaEditando] = useState(null);
  const [ocorrenciaSelecionada, setOcorrenciaSelecionada] = useState(null);
  const [ocorrenciaParaExcluir, setOcorrenciaParaExcluir] = useState(null);
  const [excluindoOcorrencia, setExcluindoOcorrencia] = useState(false);
  const [salvandoOcorrenciaInline, setSalvandoOcorrenciaInline] = useState(false);

  const [responsaveis, setResponsaveis] = useState([]);
  const [carregandoResponsaveis, setCarregandoResponsaveis] = useState(false);
  const [salvandoResponsavel, setSalvandoResponsavel] = useState(false);
  const [responsavelEditando, setResponsavelEditando] = useState(null);
  const [responsavelSelecionado, setResponsavelSelecionado] = useState(null);
  const [responsavelParaExcluir, setResponsavelParaExcluir] = useState(null);
  const [excluindoResponsavel, setExcluindoResponsavel] = useState(false);

  // Modal unico para todas as mensagens (sucesso, erro, atualizacoes, etc.).
  const [modal, setModal] = useState(null); // { id, tipo, texto, paginaDestino }

  // Exclusao em massa (selecao por checkbox nas listagens).
  const [exclusaoEmMassa, setExclusaoEmMassa] = useState(null); // { tipo, registros }
  const [excluindoEmMassa, setExcluindoEmMassa] = useState(false);

  const mostrarMensagem = (tipo, texto, paginaDestino = null) => {
    setModal({ id: Date.now() + Math.random(), tipo, texto, paginaDestino });
  };

  const [gerandoTutorial, setGerandoTutorial] = useState(false);

  const handleTutorial = async () => {
    if (gerandoTutorial) return;
    setGerandoTutorial(true);
    try {
      await exportTutorialPdf();
    } catch (e) {
      mostrarMensagem(
        'erro',
        e?.message || 'Não foi possível gerar o tutorial em PDF. Tente novamente.'
      );
    } finally {
      setGerandoTutorial(false);
    }
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

  const carregarHistorico = async () => {
    setCarregandoHistorico(true);
    try {
      const dados = await acolhidoService.listarHistorico();
      setHistorico(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar o histórico.'));
    } finally {
      setCarregandoHistorico(false);
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

  const carregarMotivos = async () => {
    setCarregandoMotivos(true);
    try {
      const [adesao, desistencia] = await Promise.all([
        motivoService.listar('ADESAO'),
        motivoService.listar('DESISTENCIA'),
      ]);
      setMotivosAdesao(Array.isArray(adesao) ? adesao : []);
      setMotivosDesistencia(Array.isArray(desistencia) ? desistencia : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar os motivos.'));
    } finally {
      setCarregandoMotivos(false);
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

  const carregarPertencesGerais = async () => {
    setCarregandoPertencesGerais(true);
    try {
      const dados = await pertenceService.listarTodos();
      setPertencesGerais(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar pertences.'));
    } finally {
      setCarregandoPertencesGerais(false);
    }
  };

  const carregarConsultas = async () => {
    setCarregandoConsultas(true);
    try {
      const dados = await consultaService.listar();
      setConsultas(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar consultas.'));
    } finally {
      setCarregandoConsultas(false);
    }
  };

  const carregarOcorrencias = async () => {
    setCarregandoOcorrencias(true);
    try {
      const dados = await ocorrenciaService.listar();
      setOcorrencias(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar ocorrências.'));
    } finally {
      setCarregandoOcorrencias(false);
    }
  };

  const carregarResponsaveis = async () => {
    setCarregandoResponsaveis(true);
    try {
      const dados = await responsavelService.listar();
      setResponsaveis(Array.isArray(dados) ? dados : []);
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao carregar responsáveis.'));
    } finally {
      setCarregandoResponsaveis(false);
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
    const aoExpirar = () => {
      alertaEstoqueExibidoRef.current = false;
      setAlertaEstoqueMedicamentos(null);
      alertaConsultasExibidoRef.current = false;
      setAlertaConsultas(null);
      setUsuario(null);
    };
    window.addEventListener('auth:expirado', aoExpirar);
    return () => window.removeEventListener('auth:expirado', aoExpirar);
  }, []);

  // Permissao de acesso: 1 = administrador (tudo), 2 = psicologo, 3 = advogado
  // (somente inicio e relatorios). Token/sessao legada sem permissao => admin.
  const permissaoId = usuario?.permissaoId ?? 1;
  const ehAdmin = permissaoId === 1;
  // Agendamento de consultas: administrador (1) e psicologo (2).
  const podeConsultas = ehAdmin || permissaoId === 2;

  // Reforca no cliente a restricao de paginas para perfis nao administradores.
  useEffect(() => {
    if (!usuario || ehAdmin) return;
    if (!paginasPermitidasNaoAdmin(permissaoId).includes(pagina)) {
      setPagina('inicio');
    }
  }, [usuario, ehAdmin, permissaoId, pagina]);

  // Carrega os dados somente quando ha um usuario autenticado. Perfis sem acesso
  // total carregam apenas o necessario para a pagina de relatorios (acolhidos e
  // historico); os demais endpoints ficam bloqueados por permissao no backend.
  useEffect(() => {
    if (!usuario) return;
    carregarAcolhidos();
    carregarHistorico();
    // Consultas: liberadas para psicologo e administrador.
    if (podeConsultas) carregarConsultas();
    if (!ehAdmin) return;
    carregarMedicamentos();
    carregarMotivos();
    carregarCombinados();
    carregarOcorrencias();
    carregarResponsaveis();
    carregarPertencesGerais();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario, ehAdmin, podeConsultas]);

  // Alerta de estoque baixo ao entrar (login ou sessao restaurada). O estoque
  // agora e reservado por acolhido; o alerta lista o acolhido e o medicamento
  // cujo estoque reservado esta acabando.
  useEffect(() => {
    if (!usuario || !ehAdmin || carregandoAcolhidos || alertaEstoqueExibidoRef.current) {
      return;
    }
    const baixo = filtrarAlertasEstoquePorAcolhido(acolhidos);
    if (baixo.length > 0) {
      setAlertaEstoqueMedicamentos(baixo);
      alertaEstoqueExibidoRef.current = true;
    }
  }, [usuario, ehAdmin, acolhidos, carregandoAcolhidos]);

  // Aviso de consultas proximas ao entrar (login ou sessao restaurada), para
  // psicologo e administrador. Lista as consultas agendadas para as proximas
  // 24 horas, destacando as mais urgentes (3h, 2h, 1h e 15 min).
  useEffect(() => {
    if (!usuario || !podeConsultas || carregandoConsultas || alertaConsultasExibidoRef.current) {
      return;
    }
    const proximas = filtrarConsultasProximas(consultas);
    if (proximas.length > 0) {
      setAlertaConsultas(proximas);
      alertaConsultasExibidoRef.current = true;
    }
  }, [usuario, podeConsultas, consultas, carregandoConsultas]);

  const handleNavegar = (novaPagina) => {
    setPagina(novaPagina);
    setAcolhidoEditando(null);
    setAcolhidoRascunho(null);
    setMedicamentoEditando(null);
    setMotivoEditando(null);
    setCombinadoEditando(null);
    setConsultaEditando(null);
    setOcorrenciaEditando(null);
    setResponsavelEditando(null);
    setPertenceEditando(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Vai cadastrar um responsável a partir do formulário de acolhido, guardando
  // o rascunho para retornar e continuar o cadastro depois de salvar.
  const handleCadastrarResponsavelDeAcolhido = (rascunho) => {
    setAcolhidoRascunho(rascunho);
    setResponsavelEditando(null);
    setPagina('cadastro-responsavel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Volta do cadastro de responsável para o formulário de acolhido, sem salvar,
  // preservando o rascunho (dados já preenchidos) do acolhido.
  const handleVoltarParaAcolhidoDoResponsavel = () => {
    if (!acolhidoRascunho) return;
    setResponsavelEditando(null);
    setPagina(
      acolhidoRascunho.modoHistorico ? 'cadastro-historico' : 'cadastro-acolhido'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const abrirModalSucesso = (texto, paginaDestino) => {
    setModal({ id: Date.now() + Math.random(), tipo: 'sucesso', texto, paginaDestino });
  };

  const fecharModal = () => {
    const destino = modal?.paginaDestino;
    setModal(null);
    setAcolhidoRascunho(null);
    if (destino === 'acolhidos') {
      setAcolhidoEditando(null);
      setPagina('acolhidos');
    } else if (destino === 'historico') {
      setAcolhidoEditando(null);
      setPagina('historico');
    } else if (destino === 'medicamentos') {
      setMedicamentoEditando(null);
      setPagina('medicamentos');
    } else if (destino === 'combinados') {
      setCombinadoEditando(null);
      setPagina('combinados');
    } else if (destino === 'consultas') {
      setConsultaEditando(null);
      setPagina('consultas');
    } else if (destino === 'ocorrencias') {
      setOcorrenciaEditando(null);
      setPagina('ocorrencias');
    } else if (destino === 'pertences') {
      setPertenceEditando(null);
      // Recarrega para garantir dados atualizados (acolhido e fotos) ao listar/editar.
      carregarPertencesGerais();
      setPagina('pertences');
    } else if (destino === 'responsaveis') {
      setResponsavelEditando(null);
      setPagina('responsaveis');
    } else if (destino === 'motivos-adesao') {
      setMotivoEditando(null);
      setPagina('motivos-adesao');
    } else if (destino === 'motivos-desistencia') {
      setMotivoEditando(null);
      setPagina('motivos-desistencia');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cria os pertences pendentes (do cadastro novo) e faz upload das fotos de
  // cada um. Retorna a quantidade de falhas para compor a mensagem final.
  const criarPertencesPendentes = async (acolhidoId, pertences = []) => {
    let falhas = 0;
    for (const p of pertences) {
      try {
        const criado = await pertenceService.criar(acolhidoId, {
          quantidade: p.quantidade,
          item: p.item,
        });
        for (const f of p.fotos || []) {
          try {
            await pertenceService.adicionarFoto(acolhidoId, criado.id, f.file);
          } catch {
            falhas += 1;
          }
        }
      } catch {
        falhas += 1;
      }
    }
    return falhas;
  };

  const salvarAcolhido = async (
    dados,
    anexosPendentes = [],
    foto = {},
    combinadosPendentes = [],
    pertencesPendentes = [],
    contexto = 'acolhidos'
  ) => {
    const noHistorico = contexto === 'historico';
    setSalvandoAcolhido(true);
    try {
      if (acolhidoEditando) {
        const idEditado = acolhidoEditando.id;
        await acolhidoService.atualizar(idEditado, dados);

        let falhaFotoEdit = false;
        try {
          if (foto.file) {
            await acolhidoService.enviarFoto(idEditado, foto.file);
          } else if (foto.remover) {
            await acolhidoService.removerFoto(idEditado);
          }
        } catch {
          falhaFotoEdit = true;
        }

        let falhasAnexosEdit = 0;
        for (const anexo of anexosPendentes) {
          try {
            await anexoService.enviar(idEditado, anexo.file, anexo.tipo, anexo.nomeArquivo);
          } catch {
            falhasAnexosEdit += 1;
          }
        }

        let falhasCombinadosEdit = 0;
        for (const combinado of combinadosPendentes) {
          try {
            await combinadoService.criar({ acolhidoId: idEditado, ...combinado });
          } catch {
            falhasCombinadosEdit += 1;
          }
        }

        await carregarAcolhidos();
        await carregarHistorico();
        await carregarCombinados();
        // Recarrega os medicamentos: ao salvar o acolhido, as prescrições
        // reservam/liberam estoque livre dos medicamentos; sem isso, o estoque
        // exibido nas páginas de medicamentos ficaria desatualizado até um F5.
        await carregarMedicamentos();
        // Atualiza os responsáveis para refletir o vínculo com o acolhido
        // (quantidade e nomes dos acolhidos vinculados) e a assinatura.
        await carregarResponsaveis();
        // Mantém a lista geral de pertences sincronizada após a edição.
        await carregarPertencesGerais();

        const problemas = [];
        if (falhaFotoEdit) problemas.push('a foto');
        if (falhasAnexosEdit > 0) problemas.push(`${falhasAnexosEdit} anexo(s)`);
        if (falhasCombinadosEdit > 0) problemas.push(`${falhasCombinadosEdit} combinado(s)`);
        if (problemas.length > 0) {
          mostrarMensagem(
            'erro',
            `Acolhido atualizado, mas ${problemas.join(' e ')} não puderam ser salvos.`
          );
        } else {
          abrirModalSucesso('Acolhido atualizado com sucesso.', contexto);
        }
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

      let falhasCombinados = 0;
      for (const combinado of combinadosPendentes) {
        try {
          await combinadoService.criar({ acolhidoId: criado.id, ...combinado });
        } catch {
          falhasCombinados += 1;
        }
      }

      const falhasPertences = await criarPertencesPendentes(
        criado.id,
        pertencesPendentes
      );

      await carregarAcolhidos();
      await carregarHistorico();
      await carregarCombinados();
      // Recarrega os medicamentos: ao cadastrar o acolhido, as prescrições
      // reservam estoque livre dos medicamentos; sem isso, o estoque exibido
      // nas páginas de medicamentos ficaria desatualizado até um F5.
      await carregarMedicamentos();
      // Atualiza os responsáveis para refletir o vínculo recém-criado e a
      // assinatura eventualmente coletada no termo.
      await carregarResponsaveis();
      // Reflete na lista geral os pertences criados junto com o novo acolhido.
      await carregarPertencesGerais();

      const ondeCadastrado = noHistorico ? ' no histórico' : '';
      if (falhas > 0 || falhaFoto || falhasCombinados > 0 || falhasPertences > 0) {
        const partes = [];
        if (falhas > 0) partes.push(`${falhas} anexo(s)`);
        if (falhaFoto) partes.push('a foto');
        if (falhasCombinados > 0) partes.push(`${falhasCombinados} combinado(s)`);
        if (falhasPertences > 0) partes.push(`${falhasPertences} pertence(s)/foto(s)`);
        mostrarMensagem(
          'erro',
          `Acolhido cadastrado${ondeCadastrado}, mas ${partes.join(' e ')} não puderam ser enviados.`
        );
      } else {
        abrirModalSucesso(`Acolhido cadastrado${ondeCadastrado} com sucesso.`, contexto);
      }

      return criado;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar acolhido.'));
      return null;
    } finally {
      setSalvandoAcolhido(false);
    }
  };

  const handleSalvarAcolhido = (
    dados,
    anexosPendentes = [],
    foto = {},
    combinadosPendentes = [],
    pertencesPendentes = []
  ) =>
    salvarAcolhido(
      dados,
      anexosPendentes,
      foto,
      combinadosPendentes,
      pertencesPendentes,
      'acolhidos'
    );

  const handleSalvarHistorico = (
    dados,
    anexosPendentes = [],
    foto = {},
    combinadosPendentes = [],
    pertencesPendentes = []
  ) =>
    salvarAcolhido(
      dados,
      anexosPendentes,
      foto,
      combinadosPendentes,
      pertencesPendentes,
      'historico'
    );

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

  const handleAssinaturasAcolhido = (acolhido) => {
    setAcolhidoAssinaturas(acolhido);
  };

  const handleFecharAssinaturas = () => {
    setAcolhidoAssinaturas(null);
  };

  const handleAssinaturasSalvas = async () => {
    setAcolhidoAssinaturas(null);
    // Recarrega as listas para refletir as novas assinaturas nos detalhes.
    await carregarAcolhidos();
    await carregarHistorico();
    mostrarMensagem('sucesso', 'Assinaturas atualizadas com sucesso.');
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
      await carregarHistorico();
      await carregarCombinados();
      await carregarOcorrencias();
      // Excluir o acolhido devolve ao estoque livre o que estava reservado a
      // ele; recarrega os medicamentos para refletir o estoque atualizado.
      await carregarMedicamentos();
      // O responsável vinculado pode ter sido excluído junto; atualiza a lista.
      await carregarResponsaveis();
      // Os pertences do acolhido foram excluídos junto; atualiza a lista geral.
      await carregarPertencesGerais();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir acolhido.'));
    } finally {
      setExcluindoAcolhido(false);
    }
  };

  const handleEditarHistorico = (acolhido) => {
    setAcolhidoEditando(acolhido);
    setPagina('cadastro-historico');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Envio ao arquivo morto (um ou vários acolhidos ao mesmo tempo).
  const handleArquivar = (registros) => {
    const lista = Array.isArray(registros) ? registros : [registros];
    if (!lista.length) return;
    // Só é permitido enviar ao histórico acolhidos que tiveram alta.
    const semAlta = lista.filter((r) => !r.alta);
    if (semAlta.length) {
      mostrarMensagem(
        'erro',
        semAlta.length === lista.length
          ? 'Só é possível enviar ao histórico acolhidos que tiveram alta. Dê alta antes de enviar.'
          : `${semAlta.length} acolhido(s) selecionado(s) não tiveram alta e não podem ir ao histórico. Dê alta antes de enviar.`
      );
      return;
    }
    setArquivamento({ registros: lista });
  };

  const cancelarArquivamento = () => {
    if (arquivando) return;
    setArquivamento(null);
  };

  const confirmarArquivamento = async () => {
    if (!arquivamento) return;
    const ids = arquivamento.registros.map((r) => r.id);
    setArquivando(true);
    try {
      const resposta = await acolhidoService.arquivar(ids);
      const total = resposta?.arquivados ?? ids.length;
      setArquivamento(null);
      await carregarAcolhidos();
      await carregarHistorico();
      await carregarCombinados();
      mostrarMensagem(
        'sucesso',
        `${total} acolhido(s) enviado(s) ao histórico com sucesso.`
      );
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao enviar ao histórico.'));
    } finally {
      setArquivando(false);
    }
  };

  // Restauração do histórico de volta para a lista de acolhidos.
  const handleRestaurar = (registros) => {
    const lista = Array.isArray(registros) ? registros : [registros];
    if (!lista.length) return;
    setRestauracao({ registros: lista });
  };

  const cancelarRestauracao = () => {
    if (restaurando) return;
    setRestauracao(null);
  };

  const confirmarRestauracao = async () => {
    if (!restauracao) return;
    const { registros } = restauracao;
    setRestaurando(true);
    let sucesso = 0;
    let falhas = 0;
    for (const r of registros) {
      try {
        await acolhidoService.restaurar(r.id);
        sucesso += 1;
      } catch {
        falhas += 1;
      }
    }
    setRestauracao(null);
    await carregarAcolhidos();
    await carregarHistorico();
    if (falhas === 0) {
      mostrarMensagem('sucesso', `${sucesso} acolhido(s) restaurado(s) com sucesso.`);
    } else if (sucesso === 0) {
      mostrarMensagem('erro', 'Não foi possível restaurar os acolhidos selecionados.');
    } else {
      mostrarMensagem(
        'erro',
        `${sucesso} restaurado(s); ${falhas} não puderam ser restaurados.`
      );
    }
    setRestaurando(false);
  };

  const handleSalvarMedicamento = async (dados) => {
    // `reservas` (opcional) traz as reservas por acolhido definidas no próprio
    // formulário do medicamento; são aplicadas após criar/atualizar o registro.
    const { reservas, ...med } = dados;
    const editando = Boolean(medicamentoEditando);
    setSalvandoMedicamento(true);
    try {
      let medId;
      if (editando) {
        await medicamentoService.atualizar(medicamentoEditando.id, med);
        medId = medicamentoEditando.id;
      } else {
        const criado = await medicamentoService.criar(med);
        medId = criado?.id;
        setMedicamentoEditando(null);
      }

      if (medId != null && Array.isArray(reservas)) {
        for (const r of reservas) {
          await prescricaoService.atualizarEstoqueReservado(
            r.acolhidoId,
            medId,
            r.totalComprimidos
          );
        }
      }

      await carregarMedicamentos();
      await carregarAcolhidos();
      abrirModalSucesso(
        editando
          ? 'Medicamento atualizado com sucesso.'
          : 'Medicamento cadastrado com sucesso.',
        'medicamentos'
      );
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

  // Cadastro rápido de medicamento a partir da aba "Medicações" do acolhido.
  // Cria o medicamento, recarrega a lista disponível e devolve o registro criado
  // para que o formulário do acolhido possa incluí-lo automaticamente.
  const handleCriarMedicamentoInline = async (dados) => {
    try {
      const novo = await medicamentoService.criar(dados);
      await carregarMedicamentos();
      mostrarMensagem('sucesso', 'Medicamento cadastrado e adicionado à prescrição.');
      return novo;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao cadastrar medicamento.'));
      throw err;
    }
  };

  // Edição inline dos campos de estoque diretamente na lista de medicamentos.
  // Reenvia nome/descrição inalterados e o backend recalcula as caixas.
  const handleAtualizarCamposMedicamento = async (medicamento, campos) => {
    try {
      await medicamentoService.atualizar(medicamento.id, {
        nome: medicamento.nome,
        descricao: medicamento.descricao,
        quantidade_por_caixa: campos.quantidade_por_caixa,
        total_comprimidos: campos.total_comprimidos,
      });
      await carregarMedicamentos();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao atualizar o medicamento.'));
      throw err;
    }
  };

  // Edição inline do estoque reservado de um medicamento para um acolhido,
  // direto na listagem de medicamentos. Recarrega medicamentos (estoque livre)
  // e acolhidos (reservas) para refletir a movimentação.
  const handleAtualizarEstoqueReservado = async (
    acolhidoId,
    medicamentoId,
    novoTotal
  ) => {
    try {
      await prescricaoService.atualizarEstoqueReservado(
        acolhidoId,
        medicamentoId,
        novoTotal
      );
      await carregarMedicamentos();
      await carregarAcolhidos();
    } catch (err) {
      mostrarMensagem(
        'erro',
        extrairErroApi(err, 'Erro ao atualizar o estoque reservado.')
      );
      throw err;
    }
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

  const paginaListaMotivo = (categoria) =>
    categoria === 'DESISTENCIA' ? 'motivos-desistencia' : 'motivos-adesao';

  const handleSalvarMotivo = async (dados) => {
    setSalvandoMotivo(true);
    try {
      const destino = paginaListaMotivo(dados.categoria);
      if (motivoEditando) {
        await motivoService.atualizar(motivoEditando.id, dados);
        await carregarMotivos();
        // O nome do motivo é derivado do relacionamento; recarregamos os
        // acolhidos (ativos e do histórico) para refletir a alteração nas
        // listas, detalhes e relatórios sem precisar recarregar a página.
        await carregarAcolhidos();
        await carregarHistorico();
        abrirModalSucesso('Motivo atualizado com sucesso.', destino);
      } else {
        await motivoService.criar(dados);
        setMotivoEditando(null);
        await carregarMotivos();
        abrirModalSucesso('Motivo cadastrado com sucesso.', destino);
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar motivo.'));
    } finally {
      setSalvandoMotivo(false);
    }
  };

  const handleEditarMotivo = (motivo) => {
    setMotivoEditando(motivo);
    setPagina(
      motivo.categoria === 'DESISTENCIA'
        ? 'cadastro-motivo-desistencia'
        : 'cadastro-motivo-adesao'
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoMotivo = (categoria) => {
    setMotivoEditando(null);
    setPagina(paginaListaMotivo(categoria));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirMotivo = (motivo) => {
    setMotivoParaExcluir(motivo);
  };

  const cancelarExclusaoMotivo = () => {
    if (excluindoMotivo) return;
    setMotivoParaExcluir(null);
  };

  const confirmarExclusaoMotivo = async () => {
    if (!motivoParaExcluir) return;
    setExcluindoMotivo(true);
    try {
      await motivoService.deletar(motivoParaExcluir.id);
      mostrarMensagem('sucesso', 'Motivo excluído com sucesso.');
      if (motivoEditando?.id === motivoParaExcluir.id) {
        setMotivoEditando(null);
      }
      setMotivoParaExcluir(null);
      await carregarMotivos();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir motivo.'));
    } finally {
      setExcluindoMotivo(false);
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

  const handleSalvarConsulta = async (dados) => {
    setSalvandoConsulta(true);
    try {
      if (consultaEditando) {
        await consultaService.atualizar(consultaEditando.id, dados);
        await carregarConsultas();
        abrirModalSucesso('Consulta atualizada com sucesso.', 'consultas');
      } else {
        await consultaService.criar(dados);
        setConsultaEditando(null);
        await carregarConsultas();
        abrirModalSucesso('Consulta agendada com sucesso.', 'consultas');
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar consulta.'));
    } finally {
      setSalvandoConsulta(false);
    }
  };

  const handleExibirConsulta = (consulta) => {
    setConsultaSelecionada(consulta);
  };

  const handleFecharDetalhesConsulta = () => {
    setConsultaSelecionada(null);
  };

  const handleEditarConsulta = (consulta) => {
    setConsultaEditando(consulta);
    setPagina('cadastro-consulta');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConcluirConsulta = (consulta) => {
    if (!consulta?.id) return;
    setConsultaParaConcluir(consulta);
  };

  const cancelarConclusaoConsulta = () => {
    if (concluindoConsulta) return;
    setConsultaParaConcluir(null);
  };

  const confirmarConclusaoConsulta = async (resumo) => {
    if (!consultaParaConcluir?.id) return;
    setConcluindoConsulta(true);
    try {
      await consultaService.concluir(consultaParaConcluir.id, resumo);
      setConsultaParaConcluir(null);
      await carregarConsultas();
      mostrarMensagem('sucesso', 'Consulta marcada como realizada.');
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao concluir consulta.'));
    } finally {
      setConcluindoConsulta(false);
    }
  };

  const handleCancelarEdicaoConsulta = () => {
    setConsultaEditando(null);
    setPagina('consultas');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirConsulta = (consulta) => {
    setConsultaParaExcluir(consulta);
  };

  const cancelarExclusaoConsulta = () => {
    if (excluindoConsulta) return;
    setConsultaParaExcluir(null);
  };

  const confirmarExclusaoConsulta = async () => {
    if (!consultaParaExcluir) return;
    setExcluindoConsulta(true);
    try {
      await consultaService.deletar(consultaParaExcluir.id);
      mostrarMensagem('sucesso', 'Consulta excluída com sucesso.');
      if (consultaEditando?.id === consultaParaExcluir.id) {
        setConsultaEditando(null);
      }
      setConsultaParaExcluir(null);
      await carregarConsultas();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir consulta.'));
    } finally {
      setExcluindoConsulta(false);
    }
  };

  // ===== Pertences (CRUD separado) =====
  const handleSalvarPertence = async (payload, fotosPendentes = []) => {
    setSalvandoPertence(true);
    try {
      if (pertenceEditando) {
        await pertenceService.atualizar(pertenceEditando.acolhidoId, pertenceEditando.id, {
          quantidade: payload.quantidade,
          item: payload.item,
        });
        await carregarPertencesGerais();
        abrirModalSucesso('Pertence atualizado com sucesso.', 'pertences');
      } else {
        const criado = await pertenceService.criar(payload.acolhidoId, {
          quantidade: payload.quantidade,
          item: payload.item,
        });
        let falhasFotos = 0;
        for (const f of fotosPendentes) {
          try {
            await pertenceService.adicionarFoto(payload.acolhidoId, criado.id, f.file);
          } catch {
            falhasFotos += 1;
          }
        }
        setPertenceEditando(null);
        await carregarPertencesGerais();
        if (falhasFotos > 0) {
          mostrarMensagem(
            'erro',
            `Pertence cadastrado, mas ${falhasFotos} foto(s) não puderam ser enviadas.`
          );
        } else {
          abrirModalSucesso('Pertence cadastrado com sucesso.', 'pertences');
        }
      }
      return true;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar pertence.'));
      return null;
    } finally {
      setSalvandoPertence(false);
    }
  };

  const handleEditarPertence = (pertence) => {
    setPertenceEditando(pertence);
    setPagina('cadastro-pertence');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoPertence = () => {
    setPertenceEditando(null);
    setPagina('pertences');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExibirPertence = (pertence) => {
    setPertenceSelecionado(pertence);
  };

  const handleFecharDetalhesPertence = () => {
    setPertenceSelecionado(null);
  };

  const handleExcluirPertence = (pertence) => {
    setPertenceParaExcluir(pertence);
  };

  const cancelarExclusaoPertence = () => {
    if (excluindoPertence) return;
    setPertenceParaExcluir(null);
  };

  const confirmarExclusaoPertence = async () => {
    if (!pertenceParaExcluir) return;
    setExcluindoPertence(true);
    try {
      await pertenceService.deletar(
        pertenceParaExcluir.acolhidoId,
        pertenceParaExcluir.id
      );
      mostrarMensagem('sucesso', 'Pertence excluído com sucesso.');
      if (pertenceEditando?.id === pertenceParaExcluir.id) {
        setPertenceEditando(null);
      }
      setPertenceParaExcluir(null);
      await carregarPertencesGerais();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir pertence.'));
    } finally {
      setExcluindoPertence(false);
    }
  };

  const handleSalvarOcorrencia = async (dados) => {
    setSalvandoOcorrencia(true);
    try {
      if (ocorrenciaEditando) {
        await ocorrenciaService.atualizar(ocorrenciaEditando.id, dados);
        await carregarOcorrencias();
        abrirModalSucesso('Ocorrência atualizada com sucesso.', 'ocorrencias');
      } else {
        await ocorrenciaService.criar(dados);
        setOcorrenciaEditando(null);
        await carregarOcorrencias();
        abrirModalSucesso('Ocorrência cadastrada com sucesso.', 'ocorrencias');
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar ocorrência.'));
    } finally {
      setSalvandoOcorrencia(false);
    }
  };

  const handleExibirOcorrencia = (ocorrencia) => {
    setOcorrenciaSelecionada(ocorrencia);
  };

  const handleFecharDetalhesOcorrencia = () => {
    setOcorrenciaSelecionada(null);
  };

  const handleEditarOcorrencia = (ocorrencia) => {
    setOcorrenciaEditando(ocorrencia);
    setPagina('cadastro-ocorrencia');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoOcorrencia = () => {
    setOcorrenciaEditando(null);
    setPagina('ocorrencias');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirOcorrencia = (ocorrencia) => {
    setOcorrenciaParaExcluir(ocorrencia);
  };

  const cancelarExclusaoOcorrencia = () => {
    if (excluindoOcorrencia) return;
    setOcorrenciaParaExcluir(null);
  };

  const confirmarExclusaoOcorrencia = async () => {
    if (!ocorrenciaParaExcluir) return;
    setExcluindoOcorrencia(true);
    try {
      await ocorrenciaService.deletar(ocorrenciaParaExcluir.id);
      mostrarMensagem('sucesso', 'Ocorrência excluída com sucesso.');
      if (ocorrenciaEditando?.id === ocorrenciaParaExcluir.id) {
        setOcorrenciaEditando(null);
      }
      setOcorrenciaParaExcluir(null);
      await carregarOcorrencias();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir ocorrência.'));
    } finally {
      setExcluindoOcorrencia(false);
    }
  };

  // Callbacks para a gestão inline de ocorrências dentro da edição do acolhido.
  const handleCriarOcorrenciaInline = async (dados) => {
    setSalvandoOcorrenciaInline(true);
    try {
      await ocorrenciaService.criar(dados);
      await carregarOcorrencias();
      mostrarMensagem('sucesso', 'Ocorrência adicionada com sucesso.');
      return true;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao adicionar ocorrência.'));
      return false;
    } finally {
      setSalvandoOcorrenciaInline(false);
    }
  };

  const handleAtualizarOcorrenciaInline = async (id, dados) => {
    setSalvandoOcorrenciaInline(true);
    try {
      await ocorrenciaService.atualizar(id, dados);
      await carregarOcorrencias();
      mostrarMensagem('sucesso', 'Ocorrência atualizada com sucesso.');
      return true;
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao atualizar ocorrência.'));
      return false;
    } finally {
      setSalvandoOcorrenciaInline(false);
    }
  };

  const handleSalvarResponsavel = async (dados) => {
    setSalvandoResponsavel(true);
    try {
      if (responsavelEditando) {
        await responsavelService.atualizar(responsavelEditando.id, dados);
        await carregarResponsaveis();
        // O nome do responsável é derivado do relacionamento; recarrega os
        // acolhidos (ativos e do histórico) para refletir a alteração.
        await carregarAcolhidos();
        await carregarHistorico();
        abrirModalSucesso('Responsável atualizado com sucesso.', 'responsaveis');
      } else {
        const criado = await responsavelService.criar(dados);
        setResponsavelEditando(null);
        await carregarResponsaveis();
        if (acolhidoRascunho) {
          // Veio do formulário de acolhido: volta para lá preservando os dados
          // e já selecionando o responsável recém-criado.
          setAcolhidoRascunho((r) => ({
            ...r,
            form: { ...r.form, responsavelId: String(criado.id) },
          }));
          setPagina(
            acolhidoRascunho.modoHistorico
              ? 'cadastro-historico'
              : 'cadastro-acolhido'
          );
          mostrarMensagem(
            'sucesso',
            'Responsável cadastrado. Continue o cadastro do acolhido.'
          );
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          abrirModalSucesso('Responsável cadastrado com sucesso.', 'responsaveis');
        }
      }
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao salvar responsável.'));
    } finally {
      setSalvandoResponsavel(false);
    }
  };

  const handleExibirResponsavel = (responsavel) => {
    setResponsavelSelecionado(responsavel);
  };

  const handleFecharDetalhesResponsavel = () => {
    setResponsavelSelecionado(null);
  };

  const handleEditarResponsavel = (responsavel) => {
    setResponsavelEditando(responsavel);
    setPagina('cadastro-responsavel');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelarEdicaoResponsavel = () => {
    setResponsavelEditando(null);
    setAcolhidoRascunho(null);
    setPagina('responsaveis');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluirResponsavel = (responsavel) => {
    setResponsavelParaExcluir(responsavel);
  };

  const cancelarExclusaoResponsavel = () => {
    if (excluindoResponsavel) return;
    setResponsavelParaExcluir(null);
  };

  const confirmarExclusaoResponsavel = async () => {
    if (!responsavelParaExcluir) return;
    setExcluindoResponsavel(true);
    try {
      await responsavelService.deletar(responsavelParaExcluir.id);
      mostrarMensagem('sucesso', 'Responsável excluído com sucesso.');
      if (responsavelEditando?.id === responsavelParaExcluir.id) {
        setResponsavelEditando(null);
      }
      setResponsavelParaExcluir(null);
      await carregarResponsaveis();
    } catch (err) {
      mostrarMensagem('erro', extrairErroApi(err, 'Erro ao excluir responsável.'));
    } finally {
      setExcluindoResponsavel(false);
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
          : tipo === 'motivo'
            ? motivoService
            : tipo === 'ocorrencia'
              ? ocorrenciaService
              : tipo === 'responsavel'
                ? responsavelService
                : tipo === 'consulta'
                  ? consultaService
                  : combinadoService;

    setExcluindoEmMassa(true);
    let sucesso = 0;
    let falhas = 0;
    for (const r of registros) {
      try {
        if (tipo === 'pertence') {
          await pertenceService.deletar(r.acolhidoId, r.id);
        } else {
          await service.deletar(r.id);
        }
        sucesso += 1;
      } catch {
        falhas += 1;
      }
    }

    if (tipo === 'acolhido') {
      await carregarAcolhidos();
      await carregarHistorico();
      await carregarCombinados();
      await carregarOcorrencias();
      // Excluir acolhidos devolve ao estoque livre o que estava reservado a
      // eles; recarrega os medicamentos para refletir o estoque atualizado.
      await carregarMedicamentos();
      // Responsáveis vinculados podem ter sido excluídos junto.
      await carregarResponsaveis();
      // Pertences dos acolhidos foram excluídos junto; atualiza a lista geral.
      await carregarPertencesGerais();
    } else if (tipo === 'medicamento') {
      await carregarMedicamentos();
    } else if (tipo === 'motivo') {
      await carregarMotivos();
    } else if (tipo === 'ocorrencia') {
      await carregarOcorrencias();
    } else if (tipo === 'responsavel') {
      await carregarResponsaveis();
    } else if (tipo === 'consulta') {
      await carregarConsultas();
    } else if (tipo === 'pertence') {
      await carregarPertencesGerais();
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
    alertaEstoqueExibidoRef.current = false;
    setAlertaEstoqueMedicamentos(null);
    alertaConsultasExibidoRef.current = false;
    setAlertaConsultas(null);
    setUsuario(u);
    setPagina('inicio');
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch {
      // ignora erros de logout; limpa o estado local de qualquer forma
    }
    alertaEstoqueExibidoRef.current = false;
    setAlertaEstoqueMedicamentos(null);
    alertaConsultasExibidoRef.current = false;
    setAlertaConsultas(null);
    setUsuario(null);
    setPagina('inicio');
    setAcolhidos([]);
    setMedicamentos([]);
    setMotivosAdesao([]);
    setMotivosDesistencia([]);
    setCombinados([]);
    setConsultas([]);
    setOcorrencias([]);
    setResponsaveis([]);
  };

  const mostrarDescricao = pagina === 'inicio';
  const mostrarFormAcolhido = pagina === 'cadastro-acolhido';
  const mostrarListaAcolhidos = pagina === 'acolhidos';
  const mostrarHistorico = pagina === 'historico';
  const mostrarFormHistorico = pagina === 'cadastro-historico';
  const mostrarFormMedicamento = pagina === 'cadastro-medicamento';
  const mostrarListaMedicamentos = pagina === 'medicamentos';
  const mostrarFormCombinado = pagina === 'cadastro-combinado';
  const mostrarListaCombinados = pagina === 'combinados';
  const mostrarFormConsulta = pagina === 'cadastro-consulta';
  const mostrarListaConsultas = pagina === 'consultas';
  const mostrarFormOcorrencia = pagina === 'cadastro-ocorrencia';
  const mostrarListaOcorrencias = pagina === 'ocorrencias';
  const mostrarFormPertence = pagina === 'cadastro-pertence';
  const mostrarListaPertences = pagina === 'pertences';
  const mostrarFormResponsavel = pagina === 'cadastro-responsavel';
  const mostrarListaResponsaveis = pagina === 'responsaveis';
  const mostrarRelatorios = pagina === 'relatorios';
  const mostrarDocumentos = pagina === 'documentos';
  const mostrarConfiguracoes = pagina === 'configuracoes';
  const mostrarControleMedicamentos = pagina === 'controle-medicamentos';
  const mostrarGestaoMedicacao = pagina === 'gestao-medicacao';
  const mostrarListaMotivosAdesao = pagina === 'motivos-adesao';
  const mostrarFormMotivoAdesao = pagina === 'cadastro-motivo-adesao';
  const mostrarListaMotivosDesistencia = pagina === 'motivos-desistencia';
  const mostrarFormMotivoDesistencia = pagina === 'cadastro-motivo-desistencia';

  // Relatórios consideram tanto os acolhidos ativos quanto os que foram
  // enviados ao histórico (arquivo morto).
  const acolhidosParaRelatorios = useMemo(
    () => [...acolhidos, ...historico],
    [acolhidos, historico]
  );

  // Ocorrências vinculadas ao acolhido em edição (usadas na aba Ocorrências do
  // formulário de edição, tanto de acolhidos ativos quanto do histórico).
  const ocorrenciasDoAcolhidoEditando = useMemo(() => {
    if (!acolhidoEditando?.id) return [];
    return ocorrencias.filter((o) =>
      (o.acolhidoIds ?? []).includes(acolhidoEditando.id)
    );
  }, [ocorrencias, acolhidoEditando]);

  // Atalhos exibidos na página inicial. Cada card leva para a página do
  // respectivo conteúdo gerenciado pelo sistema.
  const atalhosInicio = [
    {
      id: 'acolhidos',
      titulo: 'Acolhidos',
      descricao: 'Cadastre e acompanhe os acolhidos da comunidade.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'medicamentos',
      titulo: 'Medicações',
      descricao: 'Gerencie os medicamentos e as prescrições.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7Z" />
          <path d="m8.5 8.5 7 7" />
        </svg>
      ),
    },
    {
      id: 'controle-medicamentos',
      titulo: 'Controle de administração',
      descricao: 'Registre, dia a dia, as doses administradas.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </svg>
      ),
    },
    {
      id: 'combinados',
      titulo: 'Combinados (saídas)',
      descricao: 'Agende saídas e compromissos dos acolhidos.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M9 11 3 5l6-2 6 2 6-2v14l-6 2-6-2-6 2V11" />
          <path d="M9 3v16M15 5v16" />
        </svg>
      ),
    },
    {
      id: 'consultas',
      titulo: 'Consultas',
      descricao: 'Agende e acompanhe as consultas dos acolhidos.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
          <circle cx="12" cy="16" r="2" />
        </svg>
      ),
    },
    {
      id: 'ocorrencias',
      titulo: 'Ocorrências',
      descricao: 'Registre e acompanhe ocorrências dos acolhidos.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      id: 'responsaveis',
      titulo: 'Responsáveis',
      descricao: 'Cadastre os responsáveis legais dos acolhidos.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
    {
      id: 'historico',
      titulo: 'Histórico',
      descricao: 'Consulte o arquivo morto e cadastre nele.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 8a9 9 0 1 0 2.6-4.4L3 6" />
          <path d="M3 3v3h3" />
          <path d="M12 8v4l3 2" />
        </svg>
      ),
    },
    {
      id: 'relatorios',
      titulo: 'Relatórios',
      descricao: 'Indicadores, altas e exportação em PDF.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M3 3v18h18" />
          <rect x="7" y="12" width="3" height="6" rx="0.5" />
          <rect x="12" y="8" width="3" height="10" rx="0.5" />
          <rect x="17" y="5" width="3" height="13" rx="0.5" />
        </svg>
      ),
    },
    {
      id: 'documentos',
      titulo: 'Documentos',
      descricao: 'Modelos dos termos em branco para gerar em ODF ou PDF.',
      icone: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <line x1="10" y1="9" x2="8" y2="9" />
        </svg>
      ),
    },
  ];

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
        ehAdmin={ehAdmin}
        permissaoId={permissaoId}
      />

      <main className="container conteudo">
        {mostrarDescricao && (
          <section className="card descricao-sistema">
            <div className="descricao-conteudo">
              <div className="descricao-texto">
                <span className="descricao-etiqueta">Bem-vindo</span>
                <h2 className="descricao-saudacao">
                  Olá! Este é o sistema da <strong>CTAV</strong>
                </h2>
                <p>
                  Aqui você gerencia o{' '}
                  <strong>Centro Terapêutico Águas Vivas</strong>: os acolhidos e
                  tudo que envolve o dia a dia da comunidade — dos cadastros e
                  medicações até os relatórios. Use os atalhos abaixo para navegar.
                </p>

                <div className="descricao-tutorial">
                  <button
                    type="button"
                    className="btn btn-primario descricao-tutorial-btn"
                    onClick={handleTutorial}
                    disabled={gerandoTutorial}
                    aria-busy={gerandoTutorial}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    {gerandoTutorial
                      ? 'Gerando tutorial...'
                      : 'Ver tutorial completo (PDF)'}
                  </button>
                  <span className="descricao-tutorial-dica">
                    Novo por aqui? Baixe o guia passo a passo de todas as funções.
                  </span>
                </div>
              </div>

            <div className="descricao-ilustracao" aria-hidden="true">
              <LogoBetesda className="descricao-logo-img" />
            </div>
            </div>

            <div className="inicio-atalhos">
              <h3 className="inicio-atalhos-titulo">O que você pode fazer</h3>
              <div className="inicio-atalhos-grade">
                {(ehAdmin
                  ? atalhosInicio
                  : atalhosInicio.filter((item) =>
                      paginasPermitidasNaoAdmin(permissaoId).includes(item.id)
                    )
                ).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="inicio-atalho-card"
                    onClick={() => handleNavegar(item.id)}
                  >
                    <span className="inicio-atalho-icone" aria-hidden="true">
                      {item.icone}
                    </span>
                    <span className="inicio-atalho-texto">
                      <span className="inicio-atalho-titulo">{item.titulo}</span>
                      <span className="inicio-atalho-descricao">
                        {item.descricao}
                      </span>
                    </span>
                    <span className="inicio-atalho-seta" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {mostrarFormAcolhido && (
          <AcolhidoForm
            acolhidoEditando={acolhidoEditando}
            medicamentosDisponiveis={medicamentos}
            motivosAdesao={motivosAdesao}
            motivosDesistencia={motivosDesistencia}
            responsaveisDisponiveis={responsaveis}
            acolhidosDisponiveis={acolhidosParaRelatorios}
            ocorrenciasDoAcolhido={ocorrenciasDoAcolhidoEditando}
            onCriarOcorrencia={handleCriarOcorrenciaInline}
            onAtualizarOcorrencia={handleAtualizarOcorrenciaInline}
            onExcluirOcorrencia={handleExcluirOcorrencia}
            salvandoOcorrencia={salvandoOcorrenciaInline}
            onSalvar={handleSalvarAcolhido}
            onCancelar={handleCancelarEdicaoAcolhido}
            onVerLista={() => handleNavegar('acolhidos')}
            onNavegar={handleNavegar}
            onCadastrarResponsavel={handleCadastrarResponsavelDeAcolhido}
            onCriarMedicamento={handleCriarMedicamentoInline}
            rascunhoInicial={acolhidoRascunho}
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onMensagem={(tipo, msg) => mostrarMensagem(tipo, msg)}
            onPertencesAlterados={carregarPertencesGerais}
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
            onArquivar={handleArquivar}
            onArquivarSelecionados={handleArquivar}
            onAnexos={handleAnexosAcolhido}
            onNovo={() => handleNavegar('cadastro-acolhido')}
          />
        )}

        {mostrarFormHistorico && (
          <AcolhidoForm
            acolhidoEditando={acolhidoEditando}
            medicamentosDisponiveis={medicamentos}
            motivosAdesao={motivosAdesao}
            motivosDesistencia={motivosDesistencia}
            responsaveisDisponiveis={responsaveis}
            modoHistorico
            acolhidosDisponiveis={acolhidosParaRelatorios}
            ocorrenciasDoAcolhido={ocorrenciasDoAcolhidoEditando}
            onCriarOcorrencia={handleCriarOcorrenciaInline}
            onAtualizarOcorrencia={handleAtualizarOcorrenciaInline}
            onExcluirOcorrencia={handleExcluirOcorrencia}
            salvandoOcorrencia={salvandoOcorrenciaInline}
            onSalvar={handleSalvarHistorico}
            onCancelar={() => handleNavegar('historico')}
            onVerLista={() => handleNavegar('historico')}
            onNavegar={handleNavegar}
            onCadastrarResponsavel={handleCadastrarResponsavelDeAcolhido}
            onCriarMedicamento={handleCriarMedicamentoInline}
            rascunhoInicial={acolhidoRascunho}
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onMensagem={(tipo, msg) => mostrarMensagem(tipo, msg)}
            onPertencesAlterados={carregarPertencesGerais}
            salvando={salvandoAcolhido}
          />
        )}

        {mostrarHistorico && (
          <HistoricoList
            acolhidos={historico}
            carregando={carregandoHistorico}
            onExibir={handleExibirAcolhido}
            onEditar={handleEditarHistorico}
            onExcluir={handleExcluirAcolhido}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('acolhido', registros)
            }
            onRestaurar={handleRestaurar}
            onRestaurarSelecionados={handleRestaurar}
            onAnexos={handleAnexosAcolhido}
            onAssinaturas={handleAssinaturasAcolhido}
            onNovo={() => handleNavegar('cadastro-historico')}
          />
        )}

        {mostrarFormMedicamento && (
          <MedicamentoForm
            medicamentoEditando={medicamentoEditando}
            acolhidos={acolhidos}
            onSalvar={handleSalvarMedicamento}
            onCancelar={handleCancelarEdicaoMedicamento}
            onVerLista={() => handleNavegar('medicamentos')}
            salvando={salvandoMedicamento}
          />
        )}

        {mostrarListaMedicamentos && (
          <MedicamentoList
            medicamentos={medicamentos}
            acolhidos={acolhidos}
            carregando={carregandoMedicamentos}
            onEditar={handleEditarMedicamento}
            onExcluir={handleExcluirMedicamento}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('medicamento', registros)
            }
            onSalvarCampos={handleAtualizarCamposMedicamento}
            onSalvarEstoqueReservado={handleAtualizarEstoqueReservado}
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

        {mostrarFormConsulta && (
          <ConsultaForm
            consultaEditando={consultaEditando}
            acolhidosDisponiveis={acolhidos}
            onSalvar={handleSalvarConsulta}
            onCancelar={handleCancelarEdicaoConsulta}
            onVerLista={() => handleNavegar('consultas')}
            salvando={salvandoConsulta}
          />
        )}

        {mostrarListaConsultas && (
          <ConsultaList
            consultas={consultas}
            carregando={carregandoConsultas}
            onExibir={handleExibirConsulta}
            onEditar={handleEditarConsulta}
            onConcluir={handleConcluirConsulta}
            onExcluir={handleExcluirConsulta}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('consulta', registros)
            }
            onNovo={() => handleNavegar('cadastro-consulta')}
          />
        )}

        {mostrarFormPertence && (
          <PertenceForm
            pertenceEditando={pertenceEditando}
            acolhidosDisponiveis={acolhidos}
            onSalvar={handleSalvarPertence}
            onCancelar={handleCancelarEdicaoPertence}
            onVerLista={() => handleNavegar('pertences')}
            onMensagem={(tipo, msg) => mostrarMensagem(tipo, msg)}
            salvando={salvandoPertence}
          />
        )}

        {mostrarListaPertences && (
          <PertenceList
            pertences={pertencesGerais}
            carregando={carregandoPertencesGerais}
            onExibir={handleExibirPertence}
            onEditar={handleEditarPertence}
            onExcluir={handleExcluirPertence}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('pertence', registros)
            }
            onNovo={() => handleNavegar('cadastro-pertence')}
          />
        )}

        {mostrarFormOcorrencia && (
          <OcorrenciaForm
            ocorrenciaEditando={ocorrenciaEditando}
            acolhidosDisponiveis={acolhidosParaRelatorios}
            onSalvar={handleSalvarOcorrencia}
            onCancelar={handleCancelarEdicaoOcorrencia}
            onVerLista={() => handleNavegar('ocorrencias')}
            salvando={salvandoOcorrencia}
          />
        )}

        {mostrarListaOcorrencias && (
          <OcorrenciaList
            ocorrencias={ocorrencias}
            carregando={carregandoOcorrencias}
            onExibir={handleExibirOcorrencia}
            onEditar={handleEditarOcorrencia}
            onExcluir={handleExcluirOcorrencia}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('ocorrencia', registros)
            }
            onNovo={() => handleNavegar('cadastro-ocorrencia')}
          />
        )}

        {mostrarFormResponsavel && (
          <ResponsavelForm
            responsavelEditando={responsavelEditando}
            onSalvar={handleSalvarResponsavel}
            onCancelar={handleCancelarEdicaoResponsavel}
            onVerLista={() => handleNavegar('responsaveis')}
            onVoltarParaAcolhido={
              acolhidoRascunho ? handleVoltarParaAcolhidoDoResponsavel : null
            }
            salvando={salvandoResponsavel}
          />
        )}

        {mostrarListaResponsaveis && (
          <ResponsavelList
            responsaveis={responsaveis}
            carregando={carregandoResponsaveis}
            onExibir={handleExibirResponsavel}
            onEditar={handleEditarResponsavel}
            onExcluir={handleExcluirResponsavel}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('responsavel', registros)
            }
            onNovo={() => handleNavegar('cadastro-responsavel')}
          />
        )}

        {mostrarRelatorios && (
          <Relatorios
            acolhidos={acolhidosParaRelatorios}
            consultas={consultas}
            podeConsultas={podeConsultas}
            carregando={carregandoAcolhidos || carregandoHistorico}
            onErro={(msg) => mostrarMensagem('erro', msg)}
          />
        )}

        {mostrarDocumentos && (
          <Documentos
            acolhidos={acolhidosParaRelatorios}
            responsaveis={responsaveis}
            onErro={(msg) => mostrarMensagem('erro', msg)}
          />
        )}

        {mostrarConfiguracoes && (
          <ConfiguracoesUsuario
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onSucesso={(msg) => mostrarMensagem('sucesso', msg)}
            onPerfilAtualizado={(perfil) =>
              setUsuario((atual) => ({
                ...atual,
                username: perfil.username,
                nome: perfil.nome,
              }))
            }
          />
        )}

        {mostrarControleMedicamentos && (
          <ControleMedicamentos
            acolhidos={acolhidos}
            medicamentos={medicamentos}
            carregando={carregandoAcolhidos}
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onSucesso={(msg) => mostrarMensagem('sucesso', msg)}
            onRecarregarAcolhidos={carregarAcolhidos}
            onRecarregarMedicamentos={carregarMedicamentos}
          />
        )}

        {mostrarGestaoMedicacao && (
          <GestaoMedicacao
            acolhidos={acolhidos}
            medicamentos={medicamentos}
            carregando={carregandoAcolhidos || carregandoMedicamentos}
            onErro={(msg) => mostrarMensagem('erro', msg)}
            onSucesso={(msg) => mostrarMensagem('sucesso', msg)}
            onRecarregarAcolhidos={carregarAcolhidos}
            onRecarregarMedicamentos={carregarMedicamentos}
          />
        )}

        {mostrarListaMotivosAdesao && (
          <MotivoList
            motivos={motivosAdesao}
            carregando={carregandoMotivos}
            titulo="Motivos de adesão"
            rotuloSingular="motivo de adesão"
            onEditar={handleEditarMotivo}
            onExcluir={handleExcluirMotivo}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('motivo', registros)
            }
            onNovo={() => handleNavegar('cadastro-motivo-adesao')}
          />
        )}

        {mostrarFormMotivoAdesao && (
          <MotivoForm
            categoria="ADESAO"
            rotuloSingular="motivo de adesão"
            motivoEditando={motivoEditando}
            onSalvar={handleSalvarMotivo}
            onCancelar={() => handleCancelarEdicaoMotivo('ADESAO')}
            onVerLista={() => handleNavegar('motivos-adesao')}
            salvando={salvandoMotivo}
          />
        )}

        {mostrarListaMotivosDesistencia && (
          <MotivoList
            motivos={motivosDesistencia}
            carregando={carregandoMotivos}
            titulo="Motivos de desistência"
            rotuloSingular="motivo de desistência"
            onEditar={handleEditarMotivo}
            onExcluir={handleExcluirMotivo}
            onExcluirSelecionados={(registros) =>
              handleExcluirSelecionados('motivo', registros)
            }
            onNovo={() => handleNavegar('cadastro-motivo-desistencia')}
          />
        )}

        {mostrarFormMotivoDesistencia && (
          <MotivoForm
            categoria="DESISTENCIA"
            rotuloSingular="motivo de desistência"
            motivoEditando={motivoEditando}
            onSalvar={handleSalvarMotivo}
            onCancelar={() => handleCancelarEdicaoMotivo('DESISTENCIA')}
            onVerLista={() => handleNavegar('motivos-desistencia')}
            salvando={salvandoMotivo}
          />
        )}
      </main>

      <DetalhesAcolhidoModal
        acolhido={acolhidoSelecionado}
        combinados={
          acolhidoSelecionado
            ? combinados.filter((c) => c.acolhidoId === acolhidoSelecionado.id)
            : []
        }
        ocorrencias={
          acolhidoSelecionado
            ? ocorrencias.filter((o) =>
                (o.acolhidoIds ?? []).includes(acolhidoSelecionado.id)
              )
            : []
        }
        onFechar={handleFecharDetalhesAcolhido}
      />

      <DetalhesCombinadoModal
        combinado={combinadoSelecionado}
        onFechar={handleFecharDetalhesCombinado}
      />

      <DetalhesConsultaModal
        consulta={consultaSelecionada}
        onFechar={handleFecharDetalhesConsulta}
      />

      <ConcluirConsultaModal
        consulta={consultaParaConcluir}
        salvando={concluindoConsulta}
        onConfirmar={confirmarConclusaoConsulta}
        onFechar={cancelarConclusaoConsulta}
      />

      <DetalhesOcorrenciaModal
        ocorrencia={ocorrenciaSelecionada}
        onFechar={handleFecharDetalhesOcorrencia}
      />

      <DetalhesResponsavelModal
        responsavel={responsavelSelecionado}
        onFechar={handleFecharDetalhesResponsavel}
      />

      <GerenciarAnexosModal
        acolhido={acolhidoAnexos}
        onFechar={handleFecharAnexosAcolhido}
        onMensagem={(tipo, msg) => mostrarMensagem(tipo, msg)}
      />

      <AssinaturasModal
        acolhido={acolhidoAssinaturas}
        onFechar={handleFecharAssinaturas}
        onSalvo={handleAssinaturasSalvas}
        onErro={(msg) => mostrarMensagem('erro', msg)}
      />

      <ModalConfirmacao
        aberto={Boolean(acolhidoParaExcluir)}
        titulo="Excluir acolhido"
        mensagem={
          acolhidoParaExcluir
            ? `Deseja realmente excluir o acolhido "${acolhidoParaExcluir.nome}"? O responsável vinculado também será excluído (caso não esteja ligado a outro acolhido). Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoAcolhido ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoAcolhido}
        onCancelar={cancelarExclusaoAcolhido}
      />

      <ModalConfirmacao
        aberto={Boolean(arquivamento)}
        titulo="Enviar ao histórico"
        mensagem={
          arquivamento
            ? arquivamento.registros.length === 1
              ? `Deseja enviar o acolhido "${arquivamento.registros[0].nome}" ao histórico? Ele sairá da lista de acolhidos, mas todos os seus dados (medicamentos, prescrições, administrações, anexos e combinados) serão preservados.`
              : `Deseja enviar os ${arquivamento.registros.length} acolhido(s) selecionado(s) ao histórico? Eles sairão da lista de acolhidos, mas todos os seus dados serão preservados.`
            : ''
        }
        textoConfirmar={arquivando ? 'Enviando...' : 'Enviar ao histórico'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarArquivamento}
        onCancelar={cancelarArquivamento}
      />

      <ModalConfirmacao
        aberto={Boolean(restauracao)}
        titulo="Restaurar acolhido"
        mensagem={
          restauracao
            ? restauracao.registros.length === 1
              ? `Deseja restaurar o acolhido "${restauracao.registros[0].nome}" do histórico de volta para a lista de acolhidos?`
              : `Deseja restaurar os ${restauracao.registros.length} acolhido(s) selecionado(s) do histórico de volta para a lista de acolhidos?`
            : ''
        }
        textoConfirmar={restaurando ? 'Restaurando...' : 'Restaurar'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarRestauracao}
        onCancelar={cancelarRestauracao}
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
        aberto={Boolean(motivoParaExcluir)}
        titulo="Excluir motivo"
        mensagem={
          motivoParaExcluir
            ? `Deseja realmente excluir o motivo "${motivoParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoMotivo ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoMotivo}
        onCancelar={cancelarExclusaoMotivo}
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
        aberto={Boolean(consultaParaExcluir)}
        titulo="Excluir consulta"
        mensagem={
          consultaParaExcluir
            ? `Deseja realmente excluir esta consulta de "${consultaParaExcluir.acolhidoNome ?? 'acolhido'}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoConsulta ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoConsulta}
        onCancelar={cancelarExclusaoConsulta}
      />

      <DetalhesPertenceModal
        pertence={pertenceSelecionado}
        onFechar={handleFecharDetalhesPertence}
      />

      <ModalConfirmacao
        aberto={Boolean(pertenceParaExcluir)}
        titulo="Excluir pertence"
        mensagem={
          pertenceParaExcluir
            ? `Deseja realmente excluir o pertence "${pertenceParaExcluir.item ?? ''}" de "${pertenceParaExcluir.acolhidoNome ?? 'acolhido'}"? As fotos também serão removidas. Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoPertence ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoPertence}
        onCancelar={cancelarExclusaoPertence}
      />

      <ModalConfirmacao
        aberto={Boolean(ocorrenciaParaExcluir)}
        titulo="Excluir ocorrência"
        mensagem={
          ocorrenciaParaExcluir
            ? `Deseja realmente excluir a ocorrência "${ocorrenciaParaExcluir.titulo ?? ''}"${
                ocorrenciaParaExcluir.acolhidosResumo
                  ? ` (${ocorrenciaParaExcluir.acolhidosResumo})`
                  : ''
              }? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoOcorrencia ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoOcorrencia}
        onCancelar={cancelarExclusaoOcorrencia}
      />

      <ModalConfirmacao
        aberto={Boolean(responsavelParaExcluir)}
        titulo="Excluir responsável"
        mensagem={
          responsavelParaExcluir
            ? `Deseja realmente excluir o responsável "${responsavelParaExcluir.nome}"? Esta ação não pode ser desfeita.`
            : ''
        }
        textoConfirmar={excluindoResponsavel ? 'Excluindo...' : 'Excluir'}
        textoCancelar="Cancelar"
        perigo
        onConfirmar={confirmarExclusaoResponsavel}
        onCancelar={cancelarExclusaoResponsavel}
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

      <ModalAlertaConsultas
        aberto={Boolean(alertaConsultas?.length)}
        alertas={alertaConsultas ?? []}
        onFechar={() => setAlertaConsultas(null)}
        onVerConsultas={() => {
          setAlertaConsultas(null);
          handleNavegar('consultas');
        }}
      />

      <ModalAlertaEstoque
        aberto={Boolean(alertaEstoqueMedicamentos?.length)}
        alertas={alertaEstoqueMedicamentos ?? []}
        onFechar={() => setAlertaEstoqueMedicamentos(null)}
        onVerAcolhidos={() => {
          setAlertaEstoqueMedicamentos(null);
          handleNavegar('acolhidos');
        }}
      />
    </div>
  );
}
