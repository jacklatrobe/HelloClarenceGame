import { API_ROUTES, type HealthResponse } from '../../shared/types';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
  ) {
    super(`GET ${url} failed with status ${status}`);
    this.name = 'ApiError';
  }
}

async function getJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, {
    signal: signal ?? null,
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new ApiError(response.status, url);
  }

  return (await response.json()) as T;
}

export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return getJson<HealthResponse>(API_ROUTES.health, signal);
}
