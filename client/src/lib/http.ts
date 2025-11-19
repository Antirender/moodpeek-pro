// src/lib/http.ts
import axios from 'axios';
import { api } from './api';

export const fetchJSON = async (url: string) => {
  try {
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Fetch error:', error);
    if (axios.isAxiosError(error)) {
      const normalized = new Error(error.response?.data?.error || error.message);
      (normalized as any).status = error.response?.status;
      throw normalized;
    }
    throw error;
  }
};