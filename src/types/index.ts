export type UserRole = 'patient' | 'doctor' | 'receptionist' | 'admin';
export type Language = 'en' | 'hi' | 'mr';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  bloodGroup?: string;
  age?: number;
  gender?: 'Male' | 'Female' | 'Other';
  city?: string;
  speciality?: string;
  hospitalId?: string;
}

export interface BedAvailability {
  generalTotal: number;
  generalAvailable: number;
  icuTotal: number;
  icuAvailable: number;
  ventilatorsTotal: number;
  ventilatorsAvailable: number;
  oxygenAvailable: boolean;
  ambulanceAvailable: boolean;
}

export interface Hospital {
  id: string;
  name: string;
  city: string;
  state: string;
  address: string;
  phone: string;
  emergencyPhone: string;
  email?: string;
  departments: string[];
  rating: number;
  beds: number;
  bedDetails?: BedAvailability;
  lat: number;
  lng: number;
  isOpen24x7: boolean;
  image?: string;
  osmSource?: boolean;
}

export interface BlockedSlot {
  date: string;
  slot: string;
  reason: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  speciality: string;
  department: string;
  qualification: string;
  experience: number;
  hospitalId: string;
  hospitalName: string;
  city: string;
  fee: number;
  rating: number;
  reviewCount?: number;
  phone: string;
  availableDays: string[];
  availableSlots: string[];
  blockedSlots?: BlockedSlot[];
  avatar?: string;
  gender?: 'male' | 'female' | 'Male' | 'Female';
  bio?: string;
  roomNumber?: string;
}

export type AppointmentStatus =
  | 'scheduled'
  | 'checked_in'
  | 'in_consultation'
  | 'completed'
  | 'cancelled'
  | 'rescheduled'
  | 'no_show';

export type PaymentMethod = 'cash' | 'demo_online';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface PrescriptionItem {
  id: string;
  medicine: string;
  dosage: string; // e.g., '1-0-1' or '1 Tablet'
  duration: string; // e.g., '5 Days'
  timing: 'After Food' | 'Before Food' | 'As Needed';
  instructions?: string;
}

export interface PatientVitals {
  bp?: string; // e.g. '120/80 mmHg'
  pulse?: number; // e.g. 76 bpm
  temp?: number; // e.g. 98.6 °F
  spo2?: number; // e.g. 99%
  sugar?: string; // e.g. '105 mg/dL'
  allergies?: string; // e.g. 'Penicillin, Dust'
  recordedAt?: string;
}

export interface Appointment {
  id: string;
  tokenNumber: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail: string;
  patientAge: number;
  patientGender: string;
  doctorId: string;
  doctorName: string;
  doctorSpeciality: string;
  hospitalId: string;
  hospitalName: string;
  city: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // e.g. "10:00 AM"
  roomNumber?: string; // e.g. "OPD Room 204"
  symptoms: string;
  fee: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionId?: string;
  paymentModeDetail?: string;
  status: AppointmentStatus;
  doctorNotes?: string;
  cancelReason?: string;
  createdAt: string;
  vitals?: PatientVitals;
  prescriptions?: PrescriptionItem[];
  rating?: number;
  reviewFeedback?: string;
  checkedInAt?: string;
  consultationStartedAt?: string;
  completedAt?: string;
}

export interface SymptomMatch {
  speciality: string;
  department: string;
  matchedKeywords: string[];
  score: number;
  urgency: 'Low' | 'Medium' | 'High';
  recommendation: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  user: string;
  details: string;
  targetId?: string;
}

export interface NotificationAlert {
  id: string;
  patientId?: string;
  type: 'sms' | 'whatsapp' | 'email';
  recipient: string;
  patientName: string;
  title: string;
  message: string;
  timestamp: string;
  status: 'delivered' | 'sent';
  tokenNumber?: string;
}

export interface ReportSummary {
  totalHospitals: number;
  totalDoctors: number;
  totalBookings: number;
  todayBookings: number;
  statusCounts: {
    completed: number;
    checkedIn: number;
    scheduled: number;
    cancelled: number;
    noShow: number;
  };
  revenue: {
    totalRevenue: number;
    cashRevenue: number;
    onlineRevenue: number;
  };
  departmentCounts: Record<string, number>;
  cityCounts: Record<string, number>;
}

export interface AuthorizedAdmin {
  email: string;
  name: string;
  grantedBy: string;
  grantedAt: string;
  isRoot: boolean;
  status: 'active' | 'revoked';
  notes?: string;
}

export interface SmartBookingOption {
  doctor: Doctor;
  hospital: Hospital;
  availableSlots: string[];
  pastSlots?: string[];
  recommendedSlot: string;
  isPrimaryMatch?: boolean;
  explanation: string;
}

export interface SmartBookingTriage {
  primarySpeciality: string;
  departments: string[];
  urgency: 'Routine' | 'Medium' | 'High' | 'Emergency';
  isEmergency?: boolean;
  urgentCareGuidance?: string | null;
  clinicalExplanation: string;
}

export interface SmartBookingResult {
  success: boolean;
  triage: SmartBookingTriage;
  preferredDate: string;
  preferredTime: string;
  options: SmartBookingOption[];
  totalMatches: number;
  liveTimeIST?: string;
  todayDateIST?: string;
  autoAdvancedFromToday?: boolean;
  timeNotice?: string;
}


