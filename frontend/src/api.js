import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const pacienteService = {
  listar: () => api.get('/pacientes').then((r) => r.data),
  buscarPorId: (id) => api.get(`/pacientes/${id}`).then((r) => r.data),
  criar: (dados) => api.post('/pacientes', dados).then((r) => r.data),
  atualizar: (id, dados) => api.put(`/pacientes/${id}`, dados).then((r) => r.data),
  deletar: (id) => api.delete(`/pacientes/${id}`),
};

export default api;
