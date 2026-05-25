const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiError extends Error {
  status: number;
  details?: string;

  constructor(message: string, status: number, details?: string) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
  });

  // Handle blob/binary responses (e.g., Excel reports)
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    if (!response.ok) {
      try {
        const errData = await response.json();
        throw new ApiError(errData.message || 'Failed to download report', response.status, errData.details);
      } catch (e) {
        throw new ApiError('Failed to download report', response.status);
      }
    }
    return response.blob();
  }

  const data = await response.json();

  if (!response.ok) {
    throw new ApiError(data.message || 'An error occurred', response.status, data.details);
  }

  return data;
}

// User & Auth API
export const api = {
  auth: {
    login: (data: any) => fetchWithAuth('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    register: (data: any) => fetchWithAuth('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    me: () => fetchWithAuth('/auth/me'),
    updateProfile: (data: any) => fetchWithAuth('/auth/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
  categories: {
    list: () => fetchWithAuth('/categories'),
    create: (data: any) => fetchWithAuth('/categories', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithAuth(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/categories/${id}`, { method: 'DELETE' })
  },
  income: {
    list: (params?: Record<string, any>) => {
      const urlParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            urlParams.append(key, params[key]);
          }
        });
      }
      return fetchWithAuth(`/income?${urlParams.toString()}`);
    },
    create: (data: any) => fetchWithAuth('/income', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithAuth(`/income/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/income/${id}`, { method: 'DELETE' })
  },
  expenses: {
    list: (params?: Record<string, any>) => {
      const urlParams = new URLSearchParams();
      if (params) {
        Object.keys(params).forEach(key => {
          if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
            urlParams.append(key, params[key]);
          }
        });
      }
      return fetchWithAuth(`/expenses?${urlParams.toString()}`);
    },
    create: (data: any) => fetchWithAuth('/expenses', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchWithAuth(`/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    delete: (id: string) => fetchWithAuth(`/expenses/${id}`, { method: 'DELETE' })
  },
  monthlySummary: {
    get: (month: string) => fetchWithAuth(`/monthly-summary/${month}`),
    upsert: (data: any) => fetchWithAuth('/monthly-summary', { method: 'POST', body: JSON.stringify(data) })
  },
  analytics: {
    dashboard: (month?: string) => {
      const qs = month ? `?month=${month}` : '';
      return fetchWithAuth(`/analytics/dashboard${qs}`);
    },
    analyze: (month: string) => fetchWithAuth('/analytics/analyze', { method: 'POST', body: JSON.stringify({ month }) }),
    history: () => fetchWithAuth('/analytics/history')
  },
  // Note: Excel report download is handled directly in app/reports/page.tsx
  // using a raw fetch call with proper binary/ArrayBuffer handling.
  admin: {
    overview: () => fetchWithAuth('/admin/overview'),
    segments: () => fetchWithAuth('/admin/segments'),
    overspending: () => fetchWithAuth('/admin/overspending'),
    users: () => fetchWithAuth('/admin/users'),
    dbTables: () => fetchWithAuth('/admin/db/tables'),
    dbData: (tableName: string) => fetchWithAuth(`/admin/db/data?table=${tableName}`)
  }
};
