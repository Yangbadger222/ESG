const API_BASE = "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

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
  }) => request("/auth/register", { method: "POST", body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request<{ access_token: string; user: unknown }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  me: () => request("/auth/me"),
};

// Suppliers
export const supplierApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<unknown[]>(`/suppliers${qs}`);
  },
  get: (id: number) => request(`/suppliers/${id}`),
  create: (data: unknown) =>
    request("/suppliers", { method: "POST", body: JSON.stringify(data) }),
  update: (id: number, data: unknown) =>
    request(`/suppliers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  delete: (id: number) =>
    request(`/suppliers/${id}`, { method: "DELETE" }),
  getSupplyChain: (id: number) => request(`/suppliers/${id}/supply-chain`),
  addEsgRecord: (id: number, data: unknown) =>
    request(`/suppliers/${id}/esg-records`, { method: "POST", body: JSON.stringify(data) }),
  addCertification: (id: number, data: unknown) =>
    request(`/suppliers/${id}/certifications`, { method: "POST", body: JSON.stringify(data) }),
};

// Audits
export const auditApi = {
  list: () => request<unknown[]>("/audits"),
  create: (data: unknown) =>
    request("/audits", { method: "POST", body: JSON.stringify(data) }),
  get: (id: number) => request(`/audits/${id}`),
  run: (id: number) =>
    request(`/audits/${id}/run`, { method: "POST" }),
};

// Reports
export const reportApi = {
  generate: (auditId: number, reportType = "csrd") =>
    request(`/reports/${auditId}/generate?report_type=${reportType}`, { method: "POST" }),
  list: () => request<unknown[]>("/reports"),
  downloadUrl: (reportId: number) => `${API_BASE}/reports/${reportId}/download`,
};

// Alerts
export const alertApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return request<unknown[]>(`/alerts${qs}`);
  },
  scan: () => request<{ new_alerts: number }>("/alerts/scan", { method: "POST" }),
  resolve: (id: number) =>
    request(`/alerts/${id}/resolve`, { method: "PUT" }),
};
