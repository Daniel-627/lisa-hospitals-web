import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("accessToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          window.location.href = "/login";
          return Promise.reject(error);
        }

        const { data } = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });

        localStorage.setItem("accessToken",  data.data.accessToken);
        localStorage.setItem("refreshToken", data.data.refreshToken);

        original.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  register: (data: any)  => api.post("/api/auth/register", data),
  login:    (data: any)  => api.post("/api/auth/login", data),
  refresh:  (data: any)  => api.post("/api/auth/refresh", data),
  logout:   (data: any)  => api.post("/api/auth/logout", data),
  me:       ()           => api.get("/api/auth/me"),
};

// Departments
export const departmentsApi = {
  getAll:    ()           => api.get("/api/departments"),
  getBySlug: (slug: string) => api.get(`/api/departments/${slug}`),
  getDoctors:(slug: string) => api.get(`/api/departments/${slug}/doctors`),
};

// Doctors
export const doctorsApi = {
  getAll:           ()         => api.get("/api/doctors"),
  getById:          (id: string) => api.get(`/api/doctors/${id}`),
  getAvailability:  (id: string) => api.get(`/api/doctors/${id}/availability`),
};

// Appointments
export const appointmentsApi = {
  create:       (data: any)   => api.post("/api/appointments", data),
  getMine:      ()            => api.get("/api/appointments/mine"),
  getById:      (id: string)  => api.get(`/api/appointments/${id}`),
  cancel:       (id: string)  => api.patch(`/api/appointments/${id}/cancel`),
  updateStatus: (id: string, status: string) => api.patch(`/api/appointments/${id}/status`, { status }),
};

// Patients
export const patientsApi = {
  getProfile:    ()          => api.get("/api/patients/me"),
  updateProfile: (data: any) => api.patch("/api/patients/me", data),
  getDocuments:  ()          => api.get("/api/patients/me/documents"),
  getVisits:     ()          => api.get("/api/patients/me/visits"),
};

// Staff
export const staffApi = {
  getDashboard:   ()         => api.get("/api/staff/dashboard"),
  getPatients:    ()         => api.get("/api/staff/patients"),
  getPatientById: (id: string) => api.get(`/api/staff/patients/${id}`),
  uploadDocument: (data: any) => api.post("/api/staff/documents", data),
};

// Billing
export const billingApi = {
  getMyInvoices:     ()           => api.get("/api/billing/mine"),
  getById:           (id: string) => api.get(`/api/billing/${id}`),
  createInvoice:     (data: any)  => api.post("/api/billing", data),
  recordPayment:     (id: string, data: any) => api.post(`/api/billing/${id}/payment`, data),
  getPatientInvoices:(id: string) => api.get(`/api/billing/patient/${id}`),
};

// Sync
export const syncApi = {
  push: (data: any) => api.post("/api/sync/push", data),
  pull: (since?: string) => api.get(`/api/sync/pull${since ? `?since=${since}` : ""}`),
};