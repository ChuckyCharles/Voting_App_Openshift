import axios from 'axios';
import { Poll, PollOption, AuthResponse } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add token to requests if it exists
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const authService = {
    login: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/login', { username, password });
        localStorage.setItem('token', response.data.access_token);
        return response.data;
    },
    register: async (username: string, password: string): Promise<AuthResponse> => {
        const response = await api.post<AuthResponse>('/auth/register', { username, password });
        localStorage.setItem('token', response.data.access_token);
        return response.data;
    },
    logout: () => {
        localStorage.removeItem('token');
    },
};

export const pollService = {
    getPolls: async (): Promise<Poll[]> => {
        const response = await api.get<Poll[]>('/polls');
        return response.data;
    },
    getPoll: async (id: number): Promise<Poll> => {
        const response = await api.get<Poll>(`/polls/${id}`);
        return response.data;
    },
    createPoll: async (poll: { title: string; description: string; end_date: string; options: { text: string }[] }): Promise<Poll> => {
        const response = await api.post<Poll>('/polls', poll);
        return response.data;
    },
    vote: async (pollId: number, optionId: number): Promise<void> => {
        await api.post(`/polls/${pollId}/vote`, { option_id: optionId });
    },
    getResults: async (pollId: number): Promise<PollOption[]> => {
        const response = await api.get<PollOption[]>(`/polls/${pollId}/results`);
        return response.data;
    },
}; 