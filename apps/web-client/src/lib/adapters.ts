/**
 * Unified response & error adapters.
 *
 * Backend (AllExceptionsFilter) returns errors as:
 *   { statusCode, message, error, path, timestamp }
 *
 * Backend success responses are raw JSON (no wrapper).
 * api.ts interceptor wraps them as { data: ... }.
 *
 * These helpers normalise both shapes so call-sites don't repeat logic.
 */

// ── Success extraction ──────────────────────────────────────

/**
 * Extract payload from an Axios response that has already been through
 * the api.ts response interceptor (which wraps raw bodies in `{ data }`).
 *
 * Usage:
 *   const res = await api.get('/users/me');
 *   const user = extractData<User>(res);
 */
export function extractData<T = any>(res: { data: any }): T {
  const body = res.data;
  if (body && typeof body === 'object' && 'data' in body) {
    return body.data as T;
  }
  return body as T;
}

/**
 * Extract a list payload, tolerating both bare arrays and `{ items: [] }`
 * / `{ posts: [] }` wrappers.
 */
export function extractList<T = any>(res: { data: any }, field?: string): T[] {
  const payload = extractData<any>(res);
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    if (field && Array.isArray(payload[field])) return payload[field];
    // common field names
    for (const key of ['items', 'posts', 'results', 'data', 'list', 'records']) {
      if (Array.isArray(payload[key])) return payload[key];
    }
  }
  return [];
}

/**
 * Extract pagination metadata if present.
 */
export function extractMeta(res: { data: any }): {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
} | null {
  const body = res.data;
  if (body && typeof body === 'object') {
    const meta = body.meta ?? body.data?.meta;
    if (meta && typeof meta === 'object' && 'total' in meta) {
      return meta;
    }
  }
  return null;
}

// ── Error normalisation ─────────────────────────────────────

export interface NormalisedError {
  status: number;
  message: string;
  code: string;
  details?: any[];
  raw: unknown;
}

/**
 * Convert any rejected value from api calls into a predictable shape.
 *
 * The api.ts interceptor rejects with `error.response?.data || error`,
 * so the rejected value is usually the AllExceptionsFilter body:
 *   { statusCode, message, error, path, timestamp }
 */
export function normaliseError(err: unknown): NormalisedError {
  // Already normalised
  if (err && typeof err === 'object' && 'code' in err && 'status' in err) {
    return err as NormalisedError;
  }

  const body = err as Record<string, any> | undefined;

  const status =
    body?.statusCode ??
    body?.status ??
    (body?.response?.status as number | undefined) ??
    0;

  const message =
    body?.message ??
    (Array.isArray(body?.message) ? body.message.join('; ') : body?.response?.data?.message) ??
    (err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định');

  const code =
    body?.error ??
    body?.code ??
    (status ? `HTTP_${status}` : 'UNKNOWN');

  const details = body?.details ?? body?.response?.data?.details;

  return { status, message, code, details, raw: err };
}

/**
 * Human-readable message for common error codes.
 */
export function errorMessage(err: unknown): string {
  const { status, message } = normaliseError(err);
  if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
  if (status === 403) return 'Bạn không có quyền thực hiện hành động này.';
  if (status === 404) return 'Không tìm thấy dữ liệu.';
  if (status === 409) return 'Dữ liệu đã tồn tại hoặc đang bị xung đột.';
  if (status === 429) return 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
  if (status >= 500) return 'Lỗi máy chủ. Vui lòng thử lại sau.';
  return message;
}