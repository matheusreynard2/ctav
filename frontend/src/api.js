import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const acolhidoService = {
  listar: () => api.get('/acolhidos').then((r) => r.data),
  buscarPorId: (id) => api.get(`/acolhidos/${id}`).then((r) => r.data),
  criar: (dados) => api.post('/acolhidos', dados).then((r) => r.data),
  atualizar: (id, dados) => api.put(`/acolhidos/${id}`, dados).then((r) => r.data),
  deletar: (id) => api.delete(`/acolhidos/${id}`),
};

export const remedioService = {
  listar: () => api.get('/remedios').then((r) => r.data),
  buscarPorId: (id) => api.get(`/remedios/${id}`).then((r) => r.data),
  criar: (dados) => api.post('/remedios', dados).then((r) => r.data),
  atualizar: (id, dados) => api.put(`/remedios/${id}`, dados).then((r) => r.data),
  deletar: (id) => api.delete(`/remedios/${id}`),
};

export default api;
