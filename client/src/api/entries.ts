import useSWR, { mutate } from 'swr';
import { Entry } from '../types';
import { api } from '../lib/api';

const ENTRIES_KEY = '/entries';

const fetcher = async (url: string) => {
  const res = await api.get<Entry[]>(url);
  return res.data;
};

// Custom hook for fetching entries with filters
export function useEntries(filters?: {
  from?: string;
  to?: string;
  mood?: string;
  city?: string;
}) {
  let url = ENTRIES_KEY;

  // Add query parameters if filters are provided
  if (filters) {
    const params = new URLSearchParams();
    
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.mood) params.append('mood', filters.mood);
    if (filters.city) params.append('city', filters.city);
    
    const queryString = params.toString();
    if (queryString) url += `?${queryString}`;
  }

  const { data, error, isLoading } = useSWR<Entry[]>(url, fetcher);

  return {
    entries: data || [],
    isLoading,
    isError: error,
  };
}

// CRUD operations for entries
export const entriesApi = {
  // Create a new entry
  async create(entry: Omit<Entry, '_id'>) {
    try {
      const res = await api.post<Entry>(ENTRIES_KEY, entry);
      await mutate((key) => typeof key === 'string' && key.startsWith(ENTRIES_KEY));
      return res.data;
    } catch (error) {
      console.error('Error creating entry:', error);
      throw error;
    }
  },

  // Update an entry
  async update(id: string, updates: Partial<Entry>) {
    try {
      const res = await api.put<Entry>(`${ENTRIES_KEY}/${id}`, updates);
      await mutate((key) => typeof key === 'string' && key.startsWith(ENTRIES_KEY));
      return res.data;
    } catch (error) {
      console.error('Error updating entry:', error);
      throw error;
    }
  },

  // Delete an entry
  async delete(id: string) {
    try {
      await api.delete(`${ENTRIES_KEY}/${id}`);
      await mutate((key) => typeof key === 'string' && key.startsWith(ENTRIES_KEY));
      return true;
    } catch (error) {
      console.error('Error deleting entry:', error);
      throw error;
    }
  },
};