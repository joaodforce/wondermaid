export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
  }
}

/** `fetch` wrapper for the JSON API; throws `ApiError` with the server's `{ error }` payload on non-2xx. */
export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = body?.error;
    throw new ApiError(error?.message ?? 'Something went wrong', response.status, error?.code);
  }
  return body as T;
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong';
}
