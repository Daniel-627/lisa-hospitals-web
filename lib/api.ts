import axios from "axios";
import { getAuthToken } from "@/lib/tokenStore";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Clerk session tokens are short-lived (~60s). Ask Clerk for one on every request —
// it caches and refreshes them itself, so this is cheap.
api.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On a 401, retry once with a forced-fresh token. Pages decide where to redirect after that.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      const token = await getAuthToken({ skipCache: true });
      if (token) {
        original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  me:              ()          => api.get("/api/auth/me"),
  completeProfile: (data: any) => api.post("/api/auth/complete-profile", data),
};

// Departments
export const departmentsApi = {
  getAll:     ()             => api.get("/api/departments"),
  getBySlug:  (slug: string) => api.get(`/api/departments/${slug}`),
  getDoctors: (slug: string) => api.get(`/api/departments/${slug}/doctors`),
};

// Doctors
export const doctorsApi = {
  getAll:          ()           => api.get("/api/doctors"),
  getById:         (id: string) => api.get(`/api/doctors/${id}`),
  getAvailability: (id: string) => api.get(`/api/doctors/${id}/availability`),
};

// Appointments
export const appointmentsApi = {
  create:       (data: any)  => api.post("/api/appointments", data),
  getMine:      ()           => api.get("/api/appointments/mine"),
  getAll:       (params?: { status?: string; date?: string; limit?: number; offset?: number }) => api.get("/api/appointments/all", { params }),
  getById:      (id: string) => api.get(`/api/appointments/${id}`),
  cancel:       (id: string) => api.patch(`/api/appointments/${id}/cancel`),
  updateStatus: (id: string, status: string) => api.patch(`/api/appointments/${id}/status`, { status }),
};

// Patients
export const patientsApi = {
  getProfile:    ()          => api.get("/api/patients/me"),
  updateProfile: (data: any) => api.patch("/api/patients/me", data),
  getDocuments:  ()          => api.get("/api/patients/me/documents"),
  getVisits:     ()          => api.get("/api/patients/me/visits"),
  enroll:        ()          => api.post("/api/patients/me/enroll"),
};

// Staff
export const staffApi = {
  getDashboard:   ()           => api.get("/api/staff/dashboard"),
  getPatients:    (params?: { q?: string; limit?: number; offset?: number }) => api.get("/api/staff/patients", { params }),
  getPatientById: (id: string) => api.get(`/api/staff/patients/${id}`),
  uploadDocument: (data: any)  => api.post("/api/staff/documents", data),
  checkIn:         (data: any) => api.post("/api/staff/visits", data),
  queue:           (params?: { departmentId?: string; done?: boolean }) => api.get("/api/staff/queue", { params }),
  visit:           (id: string) => api.get(`/api/staff/visits/${id}`),
  consultation:    (id: string) => api.get(`/api/staff/visits/${id}/consultation`),
  saveConsultation:(id: string, data: any) => api.put(`/api/staff/visits/${id}/consultation`, data),
  startTriage:     (id: string) => api.post(`/api/staff/visits/${id}/triage/start`),
  cancelTriage:    (id: string) => api.post(`/api/staff/visits/${id}/triage/cancel`),
  recordTriage:    (id: string, data: any) => api.post(`/api/staff/visits/${id}/triage`, data),
  pickUp:          (id: string) => api.post(`/api/staff/visits/${id}/pickup`),
  releaseVisit:    (id: string) => api.post(`/api/staff/visits/${id}/release`),
  completeVisit:   (id: string) => api.post(`/api/staff/visits/${id}/complete`),
  markLeft:        (id: string) => api.post(`/api/staff/visits/${id}/left`),
  registerPatient: (data: any) => api.post("/api/staff/patients", data),
  updatePatient:   (id: string, data: any) => api.patch(`/api/staff/patients/${id}`, data),
  requestEmergencyAccess: (id: string, reason: string) => api.post(`/api/staff/patients/${id}/emergency-access`, { reason }),
};

// Billing (future phase — endpoints already exist)
export const billingApi = {
  getMyInvoices:      ()           => api.get("/api/billing/mine"),
  getById:            (id: string) => api.get(`/api/billing/${id}`),
  createInvoice:      (data: any)  => api.post("/api/billing", data),
  recordPayment:      (id: string, data: any) => api.post(`/api/billing/${id}/payment`, data),
  getPatientInvoices: (id: string) => api.get(`/api/billing/patient/${id}`),
};

// Sync (future phase — offline queue)
export const syncApi = {
  push: (data: any) => api.post("/api/sync/push", data),
  pull: (since?: string) => api.get("/api/sync/pull", { params: since ? { since } : undefined }),
};

// Admin (all endpoints are admin-only on the server)
type Page = { limit?: number; offset?: number };
export const adminApi = {
  stats:               ()                                  => api.get("/api/admin/stats"),
  users:               (params?: Page & { q?: string; role?: string }) => api.get("/api/admin/users", { params }),
  user:                (id: string)                        => api.get(`/api/admin/users/${id}`),
  updateUser:          (id: string, data: { role?: string; isActive?: boolean }) => api.patch(`/api/admin/users/${id}`, data),
  createStaffProfile:  (userId: string, data: any)         => api.post(`/api/admin/users/${userId}/staff-profile`, data),
  updateStaffProfile:  (userId: string, data: any)         => api.patch(`/api/admin/users/${userId}/staff-profile`, data),
  createDoctorProfile: (userId: string, data: any)         => api.post(`/api/admin/users/${userId}/doctor-profile`, data),
  updateDoctor:        (doctorId: string, data: any)       => api.patch(`/api/admin/doctors/${doctorId}`, data),
  setAvailability:     (doctorId: string, slots: any[])    => api.put(`/api/admin/doctors/${doctorId}/availability`, { slots }),
  enquiries:           (params?: Page & { unread?: boolean }) => api.get("/api/admin/enquiries", { params }),
  setEnquiryRead:      (id: string, isRead: boolean)       => api.patch(`/api/admin/enquiries/${id}`, { isRead }),
  deleteEnquiry:       (id: string)                        => api.delete(`/api/admin/enquiries/${id}`),
  newsList:            (params?: Page)                     => api.get("/api/admin/news", { params }),
  newsGet:             (id: string)                        => api.get(`/api/admin/news/${id}`),
  newsCreate:          (data: any)                         => api.post("/api/admin/news", data),
  newsUpdate:          (id: string, data: any)             => api.put(`/api/admin/news/${id}`, data),
  newsDelete:          (id: string)                        => api.delete(`/api/admin/news/${id}`),
  audit:               (params?: Page & { action?: string }) => api.get("/api/admin/audit", { params }),
};
