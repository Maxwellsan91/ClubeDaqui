import { supabase } from './supabase';

export const apiUrl = process.env.EXPO_PUBLIC_API_URL;

export async function apiFetch<T>(path: string, init: RequestInit = {}) {
  if (!apiUrl) throw new Error('API mobile não configurada.');
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (data.session?.access_token) {
    headers.set('Authorization', `Bearer ${data.session.access_token}`);
  }
  const response = await fetch(`${apiUrl}${path}`, { ...init, headers });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  return (await response.json()) as T;
}
