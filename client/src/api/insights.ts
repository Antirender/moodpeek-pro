// src/api/insights.ts
import useSWR from 'swr';
import { api } from '../lib/api';

const INSIGHTS_KEY = '/insights';

const fetcher = async (url: string) => {
  const res = await api.get(url);
  return res.data;
};

/**
 * Fetch weekly insights for a given start date
 */
export function useWeeklyInsights(startDate?: string) {
  const url = startDate 
    ? `${INSIGHTS_KEY}/weekly?start=${startDate}`
    : `${INSIGHTS_KEY}/weekly`;
    
  const { data, error, isLoading, mutate } = useSWR(url, fetcher);
  
  return {
    data,
    error,
    isLoading,
    mutate
  };
}

/**
 * Format date string to YYYY-MM-DD
 */
export function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}