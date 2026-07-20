
'use client';

import { useAuthStore } from './store';


export const getSession = () => useAuthStore.getState().auth;


export const getJwt = () => useAuthStore.getState().auth?.jwt ?? null;


export const authFetch: typeof fetch = (input, init) => {
  const jwt = getJwt();
  const headers = new Headers(init?.headers);
  if (jwt && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${jwt}`);
  }
  return fetch(input, { ...init, headers });
};
