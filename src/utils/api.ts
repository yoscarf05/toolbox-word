/**
 * Safe fetch utility that prevents "Unexpected token '<' / 'A'" errors
 * by checking content-type and safely handling HTML error fallbacks.
 */
export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  message?: string;
}

export async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit,
  timeoutMs: number = 15000
): Promise<ApiResponse<T>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: options?.signal || controller.signal,
      headers: {
        'Accept': 'application/json',
        ...(options?.body ? { 'Content-Type': 'application/json' } : {}),
        ...options?.headers
      }
    });

    const contentType = res.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      // Received HTML or plain text (e.g. 404, 502 Bad Gateway, 500 error page)
      const text = await res.text();
      let errorMsg = `Error del servidor (${res.status})`;
      if (res.status === 404) {
        errorMsg = 'El recurso solicitado no fue encontrado en el servidor.';
      } else if (res.status >= 500) {
        errorMsg = 'El servidor experimentó un problema temporal. Por favor intenta más tarde.';
      }

      return {
        ok: false,
        status: res.status,
        error: `Http_${res.status}`,
        message: errorMsg
      };
    }

    const json = await res.json();

    if (!res.ok) {
      // Bulletproof string extraction to prevent non-string objects (like { code, message }) from crashing React with Minified Error #31
      let extractedMessage = 'Ocurrió un error en la solicitud.';
      if (typeof json?.message === 'string' && json.message.trim()) {
        extractedMessage = json.message;
      } else if (typeof json?.error === 'string' && json.error.trim()) {
        extractedMessage = json.error;
      } else if (json?.error && typeof json.error === 'object') {
        if (typeof json.error.message === 'string' && json.error.message.trim()) {
          extractedMessage = json.error.message;
        } else if (typeof json.error.code === 'string' && json.error.code.trim()) {
          extractedMessage = `Error: ${json.error.code}`;
        }
      } else if (typeof json?.code === 'string') {
        extractedMessage = `Error del servidor (${json.code})`;
      }

      let extractedError = `Error_${res.status}`;
      if (typeof json?.error === 'string' && json.error.trim()) {
        extractedError = json.error;
      } else if (json?.error && typeof json.error.code === 'string') {
        extractedError = json.error.code;
      } else if (typeof json?.code === 'string') {
        extractedError = json.code;
      }

      return {
        ok: false,
        status: res.status,
        error: String(extractedError),
        message: String(extractedMessage)
      };
    }

    let successMessage: string | undefined = undefined;
    if (typeof json?.message === 'string') {
      successMessage = json.message;
    }

    return {
      ok: true,
      status: res.status,
      data: json as T,
      message: successMessage
    };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      return {
        ok: false,
        status: 408,
        error: 'TimeoutError',
        message: 'La solicitud tardó demasiado tiempo en responder (tiempo límite agotado).'
      };
    }
    console.error('[API-CLIENT] Fetch failure:', err);
    return {
      ok: false,
      status: 0,
      error: 'NetworkError',
      message: typeof err?.message === 'string' ? err.message : 'Error de conexión. Verifica tu conexión a internet o el estado del servidor.'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
