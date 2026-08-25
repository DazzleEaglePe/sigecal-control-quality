export class ApiClientError extends Error {
  public constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiClientError';
  }
}

const apiBaseUrl = (): string => {
  const value = import.meta.env.VITE_API_URL;
  if (!value) {
    throw new ApiClientError('La URL de la API no está configurada.');
  }
  return value.replace(/\/$/, '');
};

interface ApiErrorBody {
  readonly success: false;
  readonly error: { readonly code: string; readonly message: string };
}

export interface RequestOptions {
  readonly method?: 'GET' | 'POST' | 'PATCH';
  readonly body?: unknown;
  readonly accessToken?: string;
  readonly signal?: AbortSignal;
  readonly accept?: string;
}

const isApiErrorBody = (value: unknown): value is ApiErrorBody => {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Partial<ApiErrorBody>;
  return (
    candidate.success === false &&
    typeof candidate.error?.code === 'string' &&
    typeof candidate.error.message === 'string'
  );
};

const responseError = async (response: Response): Promise<ApiClientError> => {
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return new ApiClientError(
      'El servicio respondió con un error.',
      response.status,
    );
  }
  if (!isApiErrorBody(body)) {
    return new ApiClientError(
      'El servicio respondió con un error.',
      response.status,
    );
  }
  return new ApiClientError(
    body.error.message,
    response.status,
    body.error.code,
  );
};

export const requestResponse = async (
  path: string,
  options: RequestOptions = {},
): Promise<Response> => {
  let response: Response;
  const headers: Record<string, string> = {
    Accept: options.accept ?? 'application/json',
  };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  try {
    response = await fetch(`${apiBaseUrl()}${path}`, {
      method: options.method ?? 'GET',
      credentials: 'include',
      headers,
      ...(options.body === undefined
        ? {}
        : { body: JSON.stringify(options.body) }),
      ...(options.signal ? { signal: options.signal } : {}),
    });
  } catch (cause) {
    throw new ApiClientError(
      'No fue posible conectar con el servicio.',
      undefined,
      undefined,
      {
        cause,
      },
    );
  }

  if (!response.ok) {
    throw await responseError(response);
  }
  return response;
};

export const requestJson = async <Result>(
  path: string,
  options: RequestOptions = {},
): Promise<Result> => {
  const response = await requestResponse(path, options);
  if (response.status === 204) return undefined as Result;
  return response.json() as Promise<Result>;
};

export const requestText = async (
  path: string,
  options: RequestOptions = {},
): Promise<string> => (await requestResponse(path, options)).text();

export const getJson = (path: string, signal?: AbortSignal): Promise<unknown> =>
  requestJson(path, signal ? { signal } : {});
