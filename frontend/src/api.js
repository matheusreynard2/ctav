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

export const acolhidoService = {
  listar: () => api.get('/acolhidos').then(extrairLista),
  buscarPorId: (id) => api.get(`/acolhidos/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/acolhidos', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/acolhidos/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/acolhidos/${id}`),
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
};

export const medicamentoService = {
  listar: () => api.get('/medicamentos').then(extrairLista),
  buscarPorId: (id) => api.get(`/medicamentos/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/medicamentos', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/medicamentos/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/medicamentos/${id}`),
};

export const prescricaoService = {
  atualizarDoses: (acolhidoId, prescricoes) =>
    api
      .put(`/acolhidos/${acolhidoId}/prescricoes/doses`, prescricoes)
      .then(extrairLista),
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

export const combinadoService = {
  listar: () => api.get('/combinados').then(extrairLista),
  buscarPorId: (id) => api.get(`/combinados/${id}`).then(extrairRegistro),
  criar: (dados) => api.post('/combinados', dados).then(extrairRegistro),
  atualizar: (id, dados) => api.put(`/combinados/${id}`, dados).then(extrairRegistro),
  deletar: (id) => api.delete(`/combinados/${id}`),
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

export default api;
