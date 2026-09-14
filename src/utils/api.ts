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
      return {
        ok: false,
        status: res.status,
        error: json.error || `Error_${res.status}`,
        message: json.message || json.error || 'Ocurrió un error en la solicitud.'
      };
    }

    return {
      ok: true,
      status: res.status,
      data: json as T,
      message: json.message
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
      message: err?.message || 'Error de conexión. Verifica tu conexión a internet o el estado del servidor.'
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
