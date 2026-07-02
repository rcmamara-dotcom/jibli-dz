const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class GoRequest<T> {
  private promise: Promise<T>;

  constructor(promise: Promise<T>) {
    this.promise = promise;
  }

  then(fn: (data: T) => void): this {
    this.promise = this.promise.then((data) => {
      fn(data);
      return data;
    }) as unknown as Promise<T>;
    return this;
  }

  catch(fn: (err: unknown) => void): this {
    this.promise = this.promise.catch((err) => {
      fn(err);
      throw err;
    }) as Promise<T>;
    return this;
  }

  finally(fn: () => void): this {
    this.promise = this.promise.finally(fn) as Promise<T>;
    return this;
  }
}

function getToken(): string | null {
  return localStorage.getItem('jibli_token');
}

function buildHeaders(withBody: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (withBody) headers['Content-Type'] = 'application/json';
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request<T>(method: Method, url: string, data?: unknown): Promise<T> {
  const hasBody = data !== undefined;
  const res = await fetch(`${BASE_URL}${url}`, {
    method,
    headers: buildHeaders(hasBody),
    body: hasBody ? JSON.stringify(data) : undefined,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: res.statusText }));
    throw error;
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const GoService = {
  get:    <T>(url: string)                   => new GoRequest(request<T>('GET',    url)),
  post:   <T>(url: string, data: unknown)    => new GoRequest(request<T>('POST',   url, data)),
  put:    <T>(url: string, data: unknown)    => new GoRequest(request<T>('PUT',    url, data)),
  patch:  <T>(url: string, data: unknown)    => new GoRequest(request<T>('PATCH',  url, data)),
  delete: <T>(url: string)                   => new GoRequest(request<T>('DELETE', url)),

  setToken: (token: string) => localStorage.setItem('jibli_token', token),
  clearToken: ()            => localStorage.removeItem('jibli_token'),
  getToken,
};
