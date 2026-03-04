const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string) {
  localStorage.setItem("token", token);
}

export function clearToken() {
  localStorage.removeItem("token");
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (!(options.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    throw new Error("Session expired");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

// Auth
export const authApi = {
  register: (data: {
    email: string;
    password: string;
    full_name: string;
    organization_name: string;
  }) => request<{ access_token: string; user: Record<string, unknown> }>("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: Record<string, unknown> }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request<Record<string, unknown>>("/auth/me"),
};

// Suppliers
export const supplierApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<Record<string, unknown>[]>(`/suppliers/${qs}`);
  },
  get: (id: number) => request<Record<string, unknown>>(`/suppliers/${id}`),
  create: (data: unknown) =>
    request<Record<string, unknown>>("/suppliers/", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request<Record<string, unknown>>(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request(`/suppliers/${id}`, { method: "DELETE" }),
  importCsv: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return request<{ imported: number }>("/suppliers/import-csv", {
      method: "POST",
      body: formData,
    });
  },
  getSupplyChain: (id: number) => request<Record<string, unknown>>(`/suppliers/${id}/supply-chain`),
  addEsgRecord: (id: number, data: unknown) =>
    request(`/suppliers/${id}/esg-records`, { method: "POST", body: JSON.stringify(data) }),
  addCertification: (id: number, data: unknown) =>
    request(`/suppliers/${id}/certifications`, { method: "POST", body: JSON.stringify(data) }),
};

// Audits
export const auditApi = {
  list: () => request<Record<string, unknown>[]>("/audits/"),
  create: (data: unknown) =>
    request<Record<string, unknown>>("/audits/", { method: "POST", body: JSON.stringify(data) }),
  get: (id: number) => request<Record<string, unknown>>(`/audits/${id}`),
  run: (id: number) =>
    request<Record<string, unknown>>(`/audits/${id}/run`, { method: "POST" }),
};

// Reports
export const reportApi = {
  generate: (auditId: number, reportType = "csrd") =>
    request<Record<string, unknown>>(`/reports/${auditId}/generate?report_type=${reportType}`, { method: "POST" }),
  list: () => request<Record<string, unknown>[]>("/reports/"),
  downloadUrl: (reportId: number) => `${API_BASE}/reports/${reportId}/download`,
};

// Alerts
export const alertApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<Record<string, unknown>[]>(`/alerts/${qs}`);
  },
  scan: () => request<{ new_alerts: number }>("/alerts/scan", { method: "POST" }),
  resolve: (id: number) =>
    request<Record<string, unknown>>(`/alerts/${id}/resolve`, { method: "PUT" }),
};

// Dashboard
export const dashboardApi = {
  stats: () => request<Record<string, unknown>>("/dashboard/stats"),
  supplyChain: () => request<Record<string, unknown>[]>("/dashboard/supply-chain"),
};

// AI Match
export const matchApi = {
  match: (requirement: string) =>
    request<Record<string, unknown>[]>("/match/", {
      method: "POST",
      body: JSON.stringify({ requirement }),
    }),
};
