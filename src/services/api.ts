import { Hospital, Doctor, Appointment, AuditLog, ReportSummary, SymptomMatch, User, AuthorizedAdmin, SmartBookingResult } from '../types';

const BASE_URL = '/api';

export const api = {
  // Users & Auth
  async getUsers(): Promise<User[]> {
    const res = await fetch(`${BASE_URL}/users`);
    const data = await res.json();
    return data.users || [];
  },

  async registerUser(userData: Partial<User>): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Registration failed');
    return data.user;
  },

  async loginUser(credentials: { email?: string; phone?: string; role?: string; password?: string; id?: string }): Promise<User> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Login failed');
    return data.user;
  },

  // Hospitals
  async getHospitals(city?: string): Promise<Hospital[]> {
    const query = city && city !== 'All' ? `?city=${encodeURIComponent(city)}` : '';
    const res = await fetch(`${BASE_URL}/hospitals${query}`);
    const data = await res.json();
    return data.hospitals || [];
  },

  async searchOsmHospitals(city: string): Promise<{ hospitals: Hospital[]; source: string }> {
    const res = await fetch(`${BASE_URL}/osm/search?city=${encodeURIComponent(city)}`);
    const data = await res.json();
    return {
      hospitals: data.hospitals || [],
      source: data.source || 'local'
    };
  },

  async createHospital(hospital: Partial<Hospital>): Promise<Hospital> {
    const res = await fetch(`${BASE_URL}/hospitals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(hospital),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to create hospital');
    return data.hospital;
  },

  async updateHospital(id: string, updates: Partial<Hospital>): Promise<Hospital> {
    const res = await fetch(`${BASE_URL}/hospitals/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to update hospital');
    return data.hospital;
  },

  async deleteHospital(id: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/hospitals/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Doctors
  async getDoctors(params?: { hospitalId?: string; speciality?: string; city?: string }): Promise<Doctor[]> {
    const q = new URLSearchParams();
    if (params?.hospitalId) q.append('hospitalId', params.hospitalId);
    if (params?.speciality && params.speciality !== 'All') q.append('speciality', params.speciality);
    if (params?.city && params.city !== 'All') q.append('city', params.city);

    const res = await fetch(`${BASE_URL}/doctors?${q.toString()}`);
    const data = await res.json();
    return data.doctors || [];
  },

  async createDoctor(doc: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch(`${BASE_URL}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to add doctor');
    return data.doctor;
  },

  async updateDoctor(id: string, doc: Partial<Doctor>): Promise<Doctor> {
    const res = await fetch(`${BASE_URL}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to update doctor');
    return data.doctor;
  },

  async deleteDoctor(id: string): Promise<boolean> {
    const res = await fetch(`${BASE_URL}/doctors/${id}`, { method: 'DELETE' });
    const data = await res.json();
    return data.success;
  },

  // Symptom Analyzer
  async analyzeSymptoms(symptoms: string): Promise<{ primarySpeciality: string; matches: SymptomMatch[] }> {
    const res = await fetch(`${BASE_URL}/symptoms/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms }),
    });
    const data = await res.json();
    return {
      primarySpeciality: data.primarySpeciality || 'General Medicine',
      matches: data.matches || []
    };
  },

  // Smart Booking AI Triage
  async smartBookingTriage(params: {
    symptoms: string;
    preferredDate?: string;
    preferredTime?: string;
    city?: string;
    patientId?: string;
  }): Promise<SmartBookingResult> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), 10000);

    try {
      const res = await fetch(`${BASE_URL}/triage/smart-booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
        signal: controller.signal,
      });
      clearTimeout(timeoutHandle);

      let data: any;
      try {
        data = await res.json();
      } catch (jsonErr) {
        throw new Error(`Server returned non-JSON response (HTTP ${res.status}). Please try again.`);
      }

      if (!res.ok || !data.success) {
        throw new Error(data?.message || `Request failed with status ${res.status}`);
      }
      return data;
    } catch (err: any) {
      clearTimeout(timeoutHandle);
      if (err.name === 'AbortError') {
        throw new Error('Smart Booking request timed out. Please click Retry.');
      }
      throw err;
    }
  },

  // Appointments
  async getAppointments(filters?: {
    patientId?: string;
    doctorId?: string;
    hospitalId?: string;
    status?: string;
    date?: string;
  }): Promise<Appointment[]> {
    const q = new URLSearchParams();
    if (filters?.patientId) q.append('patientId', filters.patientId);
    if (filters?.doctorId) q.append('doctorId', filters.doctorId);
    if (filters?.hospitalId) q.append('hospitalId', filters.hospitalId);
    if (filters?.status) q.append('status', filters.status);
    if (filters?.date) q.append('date', filters.date);

    const res = await fetch(`${BASE_URL}/appointments?${q.toString()}`);
    const data = await res.json();
    return data.appointments || [];
  },

  async bookAppointment(bookingData: any): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    const data = await res.json();
    if (!data.success) {
      const err: any = new Error(data.message || 'Booking failed');
      err.code = data.code;
      throw err;
    }
    return data.appointment;
  },

  async rateDoctor(id: string, rating: number, review?: string, appointmentId?: string) {
    const res = await fetch(`${BASE_URL}/doctors/${id}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating, review, appointmentId }),
    });
    const data = await res.json();
    return data;
  },

  async blockDoctorSlot(id: string, date: string, slot: string, reason?: string) {
    const res = await fetch(`${BASE_URL}/doctors/${id}/block-slot`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date, slot, reason }),
    });
    const data = await res.json();
    return data;
  },

  async updateAppointmentStatus(
    id: string,
    status: string,
    options?: {
      doctorNotes?: string;
      user?: string;
      paymentStatus?: string;
      vitals?: any;
      prescriptions?: any[];
      rating?: number;
      reviewFeedback?: string;
      roomNumber?: string;
    }
  ): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/appointments/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...options }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Status update failed');
    return data.appointment;
  },

  async rescheduleAppointment(id: string, newDate: string, newTime: string, reason?: string): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/appointments/${id}/reschedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newDate, newTime, reason }),
    });
    const data = await res.json();
    if (!data.success) {
      const err: any = new Error(data.message || 'Rescheduling failed');
      err.code = data.code;
      throw err;
    }
    return data.appointment;
  },

  async cancelAppointment(id: string, reason?: string): Promise<Appointment> {
    const res = await fetch(`${BASE_URL}/appointments/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Cancellation failed');
    return data.appointment;
  },

  // Reports
  async getReportSummary(): Promise<ReportSummary> {
    const res = await fetch(`${BASE_URL}/reports/summary`);
    const data = await res.json();
    return data.summary;
  },

  // Audit Logs
  async getAuditLogs(): Promise<AuditLog[]> {
    const res = await fetch(`${BASE_URL}/audit-logs`);
    const data = await res.json();
    return data.logs || [];
  },

  // Administrator RBAC Access Management
  async getAuthorizedAdmins(): Promise<{ rootAdmin: string; authorizedAdmins: AuthorizedAdmin[] }> {
    const res = await fetch(`${BASE_URL}/admin/authorized-users`);
    const data = await res.json();
    return {
      rootAdmin: data.rootAdmin || 'bhavsarvaibhav001@gmail.com',
      authorizedAdmins: data.authorizedAdmins || []
    };
  },

  async grantAdminAccess(
    requesterEmail: string,
    newAdminEmail: string,
    newAdminName: string,
    notes?: string
  ): Promise<{ success: boolean; message: string; authorizedAdmins: AuthorizedAdmin[] }> {
    const res = await fetch(`${BASE_URL}/admin/grant-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail, newAdminEmail, newAdminName, notes }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to grant admin access');
    return data;
  },

  async revokeAdminAccess(
    requesterEmail: string,
    emailToRevoke: string
  ): Promise<{ success: boolean; message: string; authorizedAdmins: AuthorizedAdmin[] }> {
    const res = await fetch(`${BASE_URL}/admin/revoke-access`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requesterEmail, emailToRevoke }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || 'Failed to revoke admin access');
    return data;
  }
};

