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
// Asks the server for permission to upload one file (see components/FileUpload.tsx).
export const uploadsApi = {
  sign: (purpose: string) => api.post("/api/uploads/sign", { purpose }),
};

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
  // Names from the price list (no prices) so what is ordered matches what is billed.
  catalog:         () => api.get("/api/staff/catalog"),
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
  prices:             (params?: { q?: string; category?: string; all?: boolean }) => api.get("/api/billing/prices", { params }),
  createPrice:        (data: { category: string; name: string; unitPrice: number }) => api.post("/api/billing/prices", data),
  updatePrice:        (id: string, data: { unitPrice?: number; isActive?: boolean }) => api.patch(`/api/billing/prices/${id}`, data),
  createInvoice:      (data: any)  => api.post("/api/billing", data),
  // `key` makes the payment safe to send twice: the server records a given key once and returns the same payment on a repeat.
  recordPayment:      (id: string, data: any, key?: string) => api.post(`/api/billing/${id}/payment`, data, key ? { headers: { "Idempotency-Key": key } } : undefined),
  // Charges that arrive on their own (orders, medicines, ward days): refresh them, or price a line that had no match.
  refreshCharges:     (visitId: string) => api.post(`/api/billing/visits/${visitId}/sync`),
  priceLine:          (id: string, itemId: string, data: { unitPrice: number; remember?: boolean }) => api.patch(`/api/billing/${id}/items/${itemId}`, data),
  addItems:           (id: string, items: any[]) => api.post(`/api/billing/${id}/items`, { items }),
  waive:              (id: string, reason: string) => api.post(`/api/billing/${id}/waive`, { reason }),
  getPatientInvoices: (id: string) => api.get(`/api/billing/patient/${id}`),
  createClaim:        (id: string, data: any) => api.post(`/api/billing/${id}/claims`, data),
  claims:             (status?: string) => api.get("/api/billing/claims", { params: status ? { status } : undefined }),
  resolveClaim:       (id: string, data: any) => api.post(`/api/billing/claims/${id}/resolve`, data),
  // Paystack (card / M-Pesa). `pay` returns the Paystack checkout address to send the payer to.
  pay:                (id: string, amount?: number) => api.post(`/api/billing/${id}/pay`, amount === undefined ? {} : { amount }),
  verifyPayment:      (reference: string) => api.get("/api/billing/pay/verify", { params: { reference } }),
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

// Booking (public: no sign-in needed; staff: reception / doctor / admin)
export type BookingProof = { reference: string; token?: string; phone?: string };
export const bookingApi = {
  config:       ()                      => api.get("/api/booking/config"),
  doctors:      (departmentId?: string) => api.get("/api/booking/doctors", { params: { departmentId } }),
  services:     (departmentId?: string) => api.get("/api/booking/services", { params: { departmentId } }),
  closedDays:   ()                      => api.get("/api/booking/closed-days"),
  availability: (p: { departmentId: string; doctorId?: string; serviceId?: string; from?: string; to?: string }) => api.get("/api/booking/availability", { params: p }),
  slots:        (p: { departmentId: string; doctorId?: string; serviceId?: string; date: string }) => api.get("/api/booking/slots", { params: p }),
  staffSlots:   (p: { departmentId: string; doctorId?: string; serviceId?: string; date: string }) => api.get("/api/booking/staff/slots", { params: p }),
  requestOtp:   (phone: string, lang?: string) => api.post("/api/booking/otp", { phone, lang }),
  joinWaitlist: (data: any)             => api.post("/api/booking/waitlist", data),
  create:       (data: any)             => api.post("/api/booking/bookings", data),
  lookup:       (p: BookingProof)       => api.post("/api/booking/manage/lookup", p),
  cancel:       (p: BookingProof)       => api.post("/api/booking/manage/cancel", p),
  reschedule:   (p: BookingProof & { date: string; time: string }) => api.post("/api/booking/manage/reschedule", p),
  // staff
  staffList:    (params: Record<string, any>) => api.get("/api/booking/staff/bookings", { params }),
  staffCreate:  (data: any)             => api.post("/api/booking/staff/bookings", data),
  staffStatus:  (id: string, status: string, reason?: string) => api.patch(`/api/booking/staff/bookings/${id}/status`, { status, reason }),
  staffMove:    (id: string, data: { date: string; time: string; doctorId?: string }) => api.post(`/api/booking/staff/bookings/${id}/reschedule`, data),
  worklist:     ()                      => api.get("/api/booking/staff/worklist"),
  checkIn:      (id: string)            => api.post(`/api/booking/staff/bookings/${id}/check-in`),
  logCall:      (id: string, outcome: "coming" | "no_answer" | "resolved" | "other", note?: string) => api.post(`/api/booking/staff/bookings/${id}/calls`, { outcome, note }),
  callHistory:  (id: string)            => api.get(`/api/booking/staff/bookings/${id}/calls`),
  requestChange:(id: string, reason: string, suggestion?: string) => api.post(`/api/booking/staff/bookings/${id}/request-change`, { reason, suggestion }),
  requestDayOff:(date: string, reason: string) => api.post("/api/booking/staff/request-day-off", { date, reason }),
  noShowReport: (days = 90)             => api.get("/api/booking/staff/reports/no-shows", { params: { days } }),
  // waiting list
  waitlist:     ()                      => api.get("/api/booking/staff/waitlist"),
  waitlistCall: (id: string)            => api.post(`/api/booking/staff/waitlist/${id}/call`, { outcome: "no_answer" }),
  waitlistBook: (id: string, data: { date: string; time: string; doctorId?: string }) => api.post(`/api/booking/staff/waitlist/${id}/book`, data),
  waitlistRemove: (id: string)          => api.post(`/api/booking/staff/waitlist/${id}/remove`),
  // closed days, services, export
  addClosedDay: (data: { date: string; name: string }) => api.post("/api/booking/staff/closed-days", data),
  removeClosedDay: (id: string)         => api.delete(`/api/booking/staff/closed-days/${id}`),
  adminServices: ()                     => api.get("/api/booking/staff/services"),
  saveService:  (data: any, id?: string) => id ? api.put(`/api/booking/staff/services/${id}`, data) : api.post("/api/booking/staff/services", data),
  deleteService:(id: string)            => api.delete(`/api/booking/staff/services/${id}`),
  exportBookings: (from: string, to: string) => api.get("/api/booking/staff/export/bookings", { params: { from, to }, responseType: "blob" }),
  // a doctor's own calendar
  myCalendar:   (month: string)         => api.get("/api/booking/staff/my/calendar", { params: { month } }),
  mySaveHours:  (slots: any[])          => api.put("/api/booking/staff/my/hours", { slots }),
  myAddTimeOff: (data: any)             => api.post("/api/booking/staff/my/time-off", data),
  myDeleteTimeOff: (id: string)         => api.delete(`/api/booking/staff/my/time-off/${id}`),
  timeOff:      (doctorId?: string)     => api.get("/api/booking/staff/time-off", { params: { doctorId } }),
  addTimeOff:   (data: any)             => api.post("/api/booking/staff/time-off", data),
  deleteTimeOff:(id: string)            => api.delete(`/api/booking/staff/time-off/${id}`),
  settings:     ()                      => api.get("/api/booking/staff/settings"),
  saveSettings: (data: any)             => api.put("/api/booking/staff/settings", data),
};
