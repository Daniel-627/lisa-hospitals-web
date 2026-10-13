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
  getAdmissions: ()          => api.get("/api/patients/me/admissions"),
  getResults:    ()          => api.get("/api/patients/me/results"),
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
  placeOrders:     (visitId: string, data: any) => api.post(`/api/staff/visits/${visitId}/orders`, data),
  cancelOrder:     (kind: string, id: string) => api.post(`/api/staff/orders/${kind}/${id}/cancel`),
  releaseOrder:    (kind: string, id: string) => api.post(`/api/staff/orders/${kind}/${id}/release`),
  myOrders:        (params?: { released?: boolean }) => api.get("/api/staff/my-orders", { params }),
  labWorklist:     (params?: { done?: boolean }) => api.get("/api/staff/lab/worklist", { params }),
  labCollect:      (id: string) => api.post(`/api/staff/lab/orders/${id}/collect`),
  labResult:       (id: string, data: any) => api.post(`/api/staff/lab/orders/${id}/result`, data),
  radiologyWorklist: (params?: { done?: boolean }) => api.get("/api/staff/radiology/worklist", { params }),
  radiologyResult: (id: string, data: any) => api.post(`/api/staff/radiology/orders/${id}/result`, data),
  pharmacyWorklist: (params?: { done?: boolean }) => api.get("/api/staff/pharmacy/worklist", { params }),
  dispense:        (id: string) => api.post(`/api/staff/pharmacy/prescriptions/${id}/dispense`),
  requestAccess:   (patientId: string, message?: string) => api.post(`/api/staff/patients/${patientId}/access-request`, { message }),
  accessRequests:  () => api.get("/api/staff/access-requests"),
  decideAccess:    (id: string, approve: boolean) => api.post(`/api/staff/access-requests/${id}/decide`, { approve }),
  shareRecord:     (patientId: string, doctorId: string) => api.post(`/api/staff/patients/${patientId}/share`, { doctorId }),
  revokeShare:     (id: string) => api.post(`/api/staff/shares/${id}/revoke`),
  requestEmergencyAccess: (id: string, reason: string) => api.post(`/api/staff/patients/${id}/emergency-access`, { reason }),
  // Admissions and discharge
  admit:           (data: { visitId: string; ward: string; bedNumber?: string }) => api.post("/api/staff/admissions", data),
  admissions:      (params?: { status?: "admitted" | "discharged" }) => api.get("/api/staff/admissions", { params }),
  admission:       (id: string) => api.get(`/api/staff/admissions/${id}`),
  updateBed:       (id: string, data: { ward: string; bedNumber?: string }) => api.patch(`/api/staff/admissions/${id}/bed`, data),
  discharge:       (id: string, data: any) => api.post(`/api/staff/admissions/${id}/discharge`, data),
};

// Billing
export const billingApi = {
  getMyInvoices:      ()           => api.get("/api/billing/mine"),
  getById:            (id: string) => api.get(`/api/billing/${id}`),
  list:               (params?: { status?: string; q?: string; limit?: number; offset?: number }) => api.get("/api/billing", { params }),
  summary:            ()           => api.get("/api/billing/summary"),
  suggest:            (visitId: string) => api.get("/api/billing/suggest", { params: { visitId } }),
  createInvoice:      (data: any)  => api.post("/api/billing", data),
  recordPayment:      (id: string, data: any) => api.post(`/api/billing/${id}/payment`, data),
  addItems:           (id: string, items: any[]) => api.post(`/api/billing/${id}/items`, { items }),
  waive:              (id: string, reason: string) => api.post(`/api/billing/${id}/waive`, { reason }),
  getPatientInvoices: (id: string) => api.get(`/api/billing/patient/${id}`),
  createClaim:        (id: string, data: any) => api.post(`/api/billing/${id}/claims`, data),
  claims:             (status?: string) => api.get("/api/billing/claims", { params: status ? { status } : undefined }),
  resolveClaim:       (id: string, data: any) => api.post(`/api/billing/claims/${id}/resolve`, data),
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
