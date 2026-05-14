import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

export const listTournaments = () => api.get('/tournaments').then((r) => r.data);
export const getTournament = (id) => api.get(`/tournaments/${id}`).then((r) => r.data);
export const createTournament = (payload) =>
  api.post('/tournaments', payload).then((r) => r.data);
export const updateTournament = (id, payload) =>
  api.put(`/tournaments/${id}`, payload).then((r) => r.data);
export const deleteTournament = (id) =>
  api.delete(`/tournaments/${id}`).then((r) => r.data);
