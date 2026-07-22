import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const api = axios.create({
  baseURL,
  // Necessario para o navegador enviar/receber o cookie HttpOnly de autenticacao.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Quando a sessao expira ou o usuario nao esta autenticado (401), avisa o app
// para voltar a tela de login. Ignora as proprias rotas de autenticacao.
api.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    const url = erro?.config?.url ?? '';
    const ehRotaAuth = url.includes('/auth/');
    if (erro?.response?.status === 401 && !ehRotaAuth) {
      window.dispatchEvent(new CustomEvent('auth:expirado'));
    }
    return Promise.reject(erro);
  }
);

const erroFormato = () =>
  new Error(
    'A API retornou um formato inesperado. Verifique se VITE_API_BASE_URL aponta ' +
      'para o backend e se a rota /api é encaminhada para a API (e não para o frontend).'
  );

const extrairLista = (resposta) => {
  const dados = resposta?.data;
  if (Array.isArray(dados)) return dados;
  throw erroFormato();
};

const extrairRegistro = (resposta) => {
  const dados = resposta?.data;
  if (dados && typeof dados === 'object' && !Array.isArray(dados) && dados.id != null) {
    return dados;
  }
  throw erroFormato();
};

export const authService = {
  login: (username, senha) =>
    api.post('/auth/login', { username, senha }).then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
  me: () => api.get('/auth/me').then((r) => r.data),
};

export const usuarioService = {
  // Perfil completo do usuario logado (id somente leitura, username, nome, criadoEm).
  perfil: () => api.get('/auth/perfil').then((r) => r.data),
  // Atualiza username e nome; o backend regera o cookie de sessao.
  atualizarPerfil: (dados) =>
    api.put('/auth/perfil', dados).then((r) => r.data),
  // Troca de senha (senha atual + nova).
  alterarSenha: (dados) => api.put('/auth/senha', dados).then((r) => r.data),
  // CRUD de usuários da conta (somente administrador).
  listarUsuarios: () => api.get('/usuarios').then(extrairLista),
  criarUsuario: (dados) => api.post('/usuarios', dados).then((r) => r.data),
  atualizarUsuario: (id, dados) =>
    api.put(`/usuarios/${id}`, dados).then((r) => r.data),
  excluirUsuario: (id) => api.delete(`/usuarios/${id}`).then((r) => r.data),
  alterarPermissao: (id, permissaoId) =>
    api.put(`/usuarios/${id}/permissao`, { permissaoId }).then((r) => r.data),
};

export const acolhidoService = {
  listar: () => api.get('/acolhidos').then(extrairLista),
  listarHistorico: () => api.get('/acolhidos/historico').then(extrairLista),
  buscarPorId: (id) => api.get(`/acolhidos/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/acolhidos', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/acolhidos/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/acolhidos/${id}`),
  // Envia um ou mais acolhidos ao arquivo morto (recebe um array de ids).
  arquivar: (ids) => api.post('/acolhidos/historico', ids).then((r) => r.data),
  // Restaura um acolhido do arquivo morto de volta para a lista.
  restaurar: (id) => api.post(`/acolhidos/${id}/restaurar`).then(extrairRegistro),
  enviarFoto: (id, arquivo) => {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return api
      .post(`/acolhidos/${id}/foto`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(extrairRegistro);
  },
  removerFoto: (id) =>
    api.delete(`/acolhidos/${id}/foto`).then(extrairRegistro),
  // Atualiza somente as assinaturas do termo (data URL base64 ou null).
  atualizarAssinaturas: (id, dados) =>
    api.put(`/acolhidos/${id}/assinaturas`, dados).then(extrairRegistro),
};

export const medicamentoService = {
  listar: () => api.get('/medicamentos').then(extrairLista),
  buscarPorId: (id) => api.get(`/medicamentos/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/medicamentos', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/medicamentos/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/medicamentos/${id}`),
};

export const motivoService = {
  // categoria: 'ADESAO' ou 'DESISTENCIA'.
  listar: (categoria) =>
    api.get('/motivos', { params: { categoria } }).then(extrairLista),
  criar: (dados) => api.post('/motivos', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/motivos/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/motivos/${id}`),
};

export const responsavelService = {
  listar: () => api.get('/responsaveis').then(extrairLista),
  buscarPorId: (id) => api.get(`/responsaveis/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/responsaveis', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/responsaveis/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/responsaveis/${id}`),
};

export const prescricaoService = {
  atualizarDoses: (acolhidoId, prescricoes) =>
    api
      .put(`/acolhidos/${acolhidoId}/prescricoes/doses`, prescricoes)
      .then(extrairLista),
  atualizarEstoqueReservado: (acolhidoId, medicamentoId, totalComprimidos) =>
    api
      .put(`/acolhidos/${acolhidoId}/prescricoes/${medicamentoId}/estoque`, {
        totalComprimidos,
      })
      .then(extrairRegistro),
  sincronizar: (acolhidoId, prescricoes) =>
    api.put(`/acolhidos/${acolhidoId}/prescricoes`, prescricoes).then(extrairLista),
};

export const administracaoService = {
  listar: (acolhidoId, data) =>
    api
      .get(`/acolhidos/${acolhidoId}/administracoes`, { params: { data } })
      .then(extrairLista),
  listarMes: (acolhidoId, ano, mes) =>
    api
      .get(`/acolhidos/${acolhidoId}/administracoes`, { params: { ano, mes } })
      .then(extrairLista),
  marcar: (acolhidoId, dados) =>
    api
      .put(`/acolhidos/${acolhidoId}/administracoes`, dados)
      .then((r) => r.data),
};

export const relatorioService = {
  // Envia o payload ja calculado e recebe o PDF (gerado na Lambda) como Blob.
  gerarPdf: async (tipo, dados) => {
    try {
      const resposta = await api.post(
        '/relatorios/pdf',
        { tipo, dados },
        { responseType: 'blob' }
      );
      return resposta.data;
    } catch (erro) {
      const blob = erro?.response?.data;
      if (blob instanceof Blob) {
        const texto = (await blob.text().catch(() => '')).trim();
        if (texto) {
          // Extrai a mensagem de erro do backend. Idealmente o corpo é JSON
          // ({ message }); mas se vier em outro formato, tenta achar "message"
          // no texto — sem vazar erros internos de JSON.parse para o usuário.
          let mensagem = '';
          try {
            mensagem = JSON.parse(texto)?.message || '';
          } catch {
            mensagem =
              texto.match(/message[=:]\s*"?([^",}]+)"?/i)?.[1]?.trim() || '';
          }
          throw new Error(
            mensagem ||
              'Não foi possível gerar o PDF. Tente novamente mais tarde.'
          );
        }
      }
      throw erro;
    }
  },
};

export const combinadoService = {
  listar: () => api.get('/combinados').then(extrairLista),
  buscarPorId: (id) => api.get(`/combinados/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/combinados', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/combinados/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/combinados/${id}`),
};

export const consultaService = {
  listar: () => api.get('/consultas').then(extrairLista),
  buscarPorId: (id) => api.get(`/consultas/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/consultas', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/consultas/${id}`, dados).then(extrairRegistro),
  concluir: (id, resumo) =>
    api.put(`/consultas/${id}/concluir`, { resumo }).then(extrairRegistro),
  deletar: (id) => api.delete(`/consultas/${id}`),
};

export const ocorrenciaService = {
  listar: () => api.get('/ocorrencias').then(extrairLista),
  buscarPorId: (id) => api.get(`/ocorrencias/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/ocorrencias', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/ocorrencias/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/ocorrencias/${id}`),
};

export const anexoService = {
  listar: (acolhidoId) =>
    api.get(`/acolhidos/${acolhidoId}/anexos`).then(extrairLista),
  enviar: (acolhidoId, arquivo, tipo, nomeArquivo) => {
    const form = new FormData();
    form.append('arquivo', arquivo);
    form.append('tipo', tipo);
    form.append('nomeArquivo', nomeArquivo);
    return api
      .post(`/acolhidos/${acolhidoId}/anexos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(extrairRegistro);
  },
  atualizar: (acolhidoId, anexoId, dados) =>
    api.put(`/acolhidos/${acolhidoId}/anexos/${anexoId}`, dados).then(extrairRegistro),
  linkDownload: (acolhidoId, anexoId) =>
    api
      .get(`/acolhidos/${acolhidoId}/anexos/${anexoId}/download`)
      .then((resposta) => {
        const url = resposta?.data?.url;
        if (typeof url === 'string' && url) return url;
        throw erroFormato();
      }),
  deletar: (acolhidoId, anexoId) =>
    api.delete(`/acolhidos/${acolhidoId}/anexos/${anexoId}`),
};

export const pertenceService = {
  // Lista todos os pertences de todos os acolhidos do usuário (CRUD geral).
  listarTodos: () => api.get('/pertences').then(extrairLista),
  listar: (acolhidoId) =>
    api.get(`/acolhidos/${acolhidoId}/pertences`).then(extrairLista),
  criar: (acolhidoId, dados) =>
    api.post(`/acolhidos/${acolhidoId}/pertences`, dados).then(extrairRegistro),
  atualizar: (acolhidoId, pertenceId, dados) =>
    api
      .put(`/acolhidos/${acolhidoId}/pertences/${pertenceId}`, dados)
      .then(extrairRegistro),
  deletar: (acolhidoId, pertenceId) =>
    api.delete(`/acolhidos/${acolhidoId}/pertences/${pertenceId}`),
  adicionarFoto: (acolhidoId, pertenceId, arquivo) => {
    const form = new FormData();
    form.append('arquivo', arquivo);
    return api
      .post(`/acolhidos/${acolhidoId}/pertences/${pertenceId}/fotos`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then(extrairRegistro);
  },
  deletarFoto: (acolhidoId, pertenceId, fotoId) =>
    api.delete(`/acolhidos/${acolhidoId}/pertences/${pertenceId}/fotos/${fotoId}`),
};

export default api;
