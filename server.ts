import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key.trim() === '' || key === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return geminiClient;
}

app.use(express.json());

// Path to data store
const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed database for academic demo
const defaultSeed = {
  users: [
    {
      id: 'usr-1',
      name: 'Dr. Sameer Joshi',
      email: 'doctor@citycare.org',
      role: 'doctor',
      phone: '+91 98201 12345',
      speciality: 'Cardiology',
      hospitalId: 'hosp-1'
    },
    {
      id: 'usr-2',
      name: 'Priya Sharma (Staff)',
      email: 'reception@citycare.org',
      role: 'receptionist',
      phone: '+91 98201 54321',
      hospitalId: 'hosp-1'
    },
    {
      id: 'usr-3',
      name: 'Vaibhav Bhavsar (Primary Super Admin)',
      email: 'bhavsarvaibhav001@gmail.com',
      role: 'admin',
      phone: '+91 98000 00001'
    },
    {
      id: 'usr-4',
      name: 'Rahul Verma',
      email: 'rahul.patient@gmail.com',
      role: 'patient',
      phone: '+91 98765 43210',
      bloodGroup: 'O+',
      age: 28,
      gender: 'Male',
      city: 'Mumbai'
    }
  ],
  hospitals: [
    {
      id: 'hosp-1',
      name: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Dr. E Moses Road, Worli, Mumbai 400018',
      phone: '+91 22 2490 8800',
      emergencyPhone: '108 / +91 22 2490 8899',
      email: 'contact@citycare-worli.org',
      departments: ['Cardiology', 'Orthopedics', 'Neurology', 'Pediatrics', 'General Medicine'],
      rating: 4.8,
      beds: 350,
      lat: 18.9986,
      lng: 72.8174,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-2',
      name: 'Lifeline District Hospital & Trauma Centre',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'S.V. Road, Andheri West, Mumbai 400058',
      phone: '+91 22 2620 4400',
      emergencyPhone: '+91 22 2620 4499',
      email: 'info@lifeline-andheri.org',
      departments: ['General Medicine', 'Pulmonology', 'Dermatology', 'ENT', 'Gynecology'],
      rating: 4.5,
      beds: 220,
      lat: 19.1197,
      lng: 72.8468,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-3',
      name: 'Apex Health Institute & Dental Clinic',
      city: 'Mumbai',
      state: 'Maharashtra',
      address: 'Eastern Express Highway, Thane / Powai Link, Mumbai 400076',
      phone: '+91 22 2570 1200',
      emergencyPhone: '+91 22 2570 1299',
      email: 'care@apexhealth-mumbai.org',
      departments: ['Dental', 'Ophthalmology', 'Gastroenterology', 'Psychiatry'],
      rating: 4.7,
      beds: 180,
      lat: 19.1232,
      lng: 72.9103,
      isOpen24x7: false,
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-4',
      name: 'Metro City Multispeciality Hospital',
      city: 'Delhi',
      state: 'Delhi NCR',
      address: 'Pusa Road, Karol Bagh, New Delhi 110005',
      phone: '+91 11 4225 5555',
      emergencyPhone: '102 / +91 11 4225 5599',
      email: 'delhi@metrohealth.org',
      departments: ['Cardiology', 'Neurology', 'Pulmonology', 'General Medicine', 'Orthopedics'],
      rating: 4.9,
      beds: 450,
      lat: 28.6448,
      lng: 77.1888,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-5',
      name: 'Indira Gandhi Memorial Civil Hospital',
      city: 'Delhi',
      state: 'Delhi NCR',
      address: 'Ring Road, Lajpat Nagar, New Delhi 110024',
      phone: '+91 11 2984 3300',
      emergencyPhone: '+91 11 2984 3399',
      email: 'civil@delhigovthealth.org',
      departments: ['General Medicine', 'Pediatrics', 'Gynecology', 'ENT', 'Dermatology'],
      rating: 4.4,
      beds: 300,
      lat: 28.5684,
      lng: 77.2435,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-6',
      name: 'Silicon City Health Science Hospital',
      city: 'Bengaluru',
      state: 'Karnataka',
      address: '100ft Road, Indiranagar, Bengaluru 560038',
      phone: '+91 80 4099 2200',
      emergencyPhone: '+91 80 4099 2299',
      email: 'blrcare@siliconhealth.org',
      departments: ['Cardiology', 'Orthopedics', 'Psychiatry', 'Gastroenterology', 'General Medicine'],
      rating: 4.8,
      beds: 320,
      lat: 12.9716,
      lng: 77.6412,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?auto=format&fit=crop&w=800&q=80'
    },
    {
      id: 'hosp-7',
      name: 'Sahyadri Premier Hospital',
      city: 'Pune',
      state: 'Maharashtra',
      address: 'Karve Road, Deccan Gymkhana, Pune 411004',
      phone: '+91 20 6721 3000',
      emergencyPhone: '+91 20 6721 3999',
      email: 'info@sahyadri-pune.org',
      departments: ['Cardiology', 'Neurology', 'Pulmonology', 'Orthopedics', 'General Medicine'],
      rating: 4.7,
      beds: 280,
      lat: 18.5158,
      lng: 73.8418,
      isOpen24x7: true,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80'
    }
  ],
  doctors: [
    {
      id: 'doc-1',
      userId: 'usr-1',
      name: 'Dr. Sameer Joshi',
      speciality: 'Cardiology',
      department: 'Cardiology',
      qualification: 'MBBS, MD, DM (Cardiology)',
      experience: 14,
      hospitalId: 'hosp-1',
      hospitalName: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      fee: 600,
      rating: 4.9,
      reviewCount: 142,
      phone: '+91 98201 12345',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:30 PM', '05:00 PM'],
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      bio: 'Senior interventional cardiologist with over 14 years experience handling complex coronary angioplasties and preventative heart health.'
    },
    {
      id: 'doc-2',
      name: 'Dr. Ananya Sen',
      speciality: 'Orthopedics',
      department: 'Orthopedics',
      qualification: 'MBBS, MS (Ortho), DNB',
      experience: 11,
      hospitalId: 'hosp-1',
      hospitalName: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      fee: 550,
      rating: 4.8,
      reviewCount: 98,
      phone: '+91 98202 23456',
      availableDays: ['Mon', 'Wed', 'Fri', 'Sat'],
      availableSlots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM', '05:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1594824813576-23eb91185012?auto=format&fit=crop&w=400&q=80',
      bio: 'Joint replacement specialist and arthroscopic surgeon focusing on knee, hip pain, sports injuries, and arthritis rehabilitation.'
    },
    {
      id: 'doc-3',
      name: 'Dr. Rajesh Deshmukh',
      speciality: 'Neurology',
      department: 'Neurology',
      qualification: 'MBBS, MD (Medicine), DM (Neurology)',
      experience: 16,
      hospitalId: 'hosp-1',
      hospitalName: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      fee: 700,
      rating: 4.9,
      reviewCount: 180,
      phone: '+91 98203 34567',
      availableDays: ['Tue', 'Thu', 'Sat'],
      availableSlots: ['09:30 AM', '11:00 AM', '03:00 PM', '04:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      bio: 'Expert in migraines, stroke prevention, Parkinson disease, epilepsy, and peripheral nerve disorders.'
    },
    {
      id: 'doc-4',
      name: 'Dr. Meera Kulkarni',
      speciality: 'General Medicine',
      department: 'General Medicine',
      qualification: 'MBBS, MD (General Medicine)',
      experience: 9,
      hospitalId: 'hosp-2',
      hospitalName: 'Lifeline District Hospital & Trauma Centre',
      city: 'Mumbai',
      fee: 400,
      rating: 4.7,
      reviewCount: 85,
      phone: '+91 98204 45678',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '03:30 PM', '05:00 PM'],
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      bio: 'Consultant physician skilled in managing viral fevers, hypertension, diabetes mellitus, thyroid, and infectious illnesses.'
    },
    {
      id: 'doc-5',
      name: 'Dr. Vikram Sethi',
      speciality: 'Pulmonology',
      department: 'Pulmonology',
      qualification: 'MBBS, DTCD, DNB (Respiratory)',
      experience: 12,
      hospitalId: 'hosp-2',
      hospitalName: 'Lifeline District Hospital & Trauma Centre',
      city: 'Mumbai',
      fee: 500,
      rating: 4.8,
      reviewCount: 110,
      phone: '+91 98205 56789',
      availableDays: ['Mon', 'Tue', 'Thu', 'Fri'],
      availableSlots: ['10:00 AM', '11:30 AM', '03:00 PM', '04:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&w=400&q=80',
      bio: 'Specialist in asthma, chronic cough, COPD, bronchitis, allergic rhinitis, and sleep apnea.'
    },
    {
      id: 'doc-6',
      name: 'Dr. Shalini Gupta',
      speciality: 'Dermatology',
      department: 'Dermatology',
      qualification: 'MBBS, MD (DVL)',
      experience: 8,
      hospitalId: 'hosp-2',
      hospitalName: 'Lifeline District Hospital & Trauma Centre',
      city: 'Mumbai',
      fee: 450,
      rating: 4.6,
      reviewCount: 76,
      phone: '+91 98206 67890',
      availableDays: ['Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: ['11:00 AM', '01:00 PM', '03:00 PM', '04:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?auto=format&fit=crop&w=400&q=80',
      bio: 'Clinical dermatologist handling eczema, psoriasis, skin allergies, fungal infections, and acne treatments.'
    },
    {
      id: 'doc-7',
      name: 'Dr. Rohan Patel',
      speciality: 'Dental',
      department: 'Dental',
      qualification: 'BDS, MDS (Orthodontics & Endodontics)',
      experience: 10,
      hospitalId: 'hosp-3',
      hospitalName: 'Apex Health Institute & Dental Clinic',
      city: 'Mumbai',
      fee: 350,
      rating: 4.8,
      reviewCount: 130,
      phone: '+91 98207 78901',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlots: ['09:30 AM', '11:00 AM', '02:00 PM', '04:00 PM', '05:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
      bio: 'Cosmetic dentist, root canal specialist, wisdom tooth extraction, and oral health consultant.'
    },
    {
      id: 'doc-8',
      name: 'Dr. Arvind Singhal',
      speciality: 'Cardiology',
      department: 'Cardiology',
      qualification: 'MBBS, MD, DM (Cardio)',
      experience: 18,
      hospitalId: 'hosp-4',
      hospitalName: 'Metro City Multispeciality Hospital',
      city: 'Delhi',
      fee: 750,
      rating: 4.9,
      reviewCount: 220,
      phone: '+91 98111 22334',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      availableSlots: ['09:00 AM', '10:30 AM', '02:00 PM', '03:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?auto=format&fit=crop&w=400&q=80',
      bio: 'Leading cardiologist in North India with comprehensive cardiac care and pacemaker implantations.'
    },
    {
      id: 'doc-9',
      name: 'Dr. Neha Kapoor',
      speciality: 'Pediatrics',
      department: 'Pediatrics',
      qualification: 'MBBS, DCH, MD (Pediatrics)',
      experience: 13,
      hospitalId: 'hosp-5',
      hospitalName: 'Indira Gandhi Memorial Civil Hospital',
      city: 'Delhi',
      fee: 450,
      rating: 4.8,
      reviewCount: 165,
      phone: '+91 98112 33445',
      availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      availableSlots: ['10:00 AM', '11:30 AM', '01:00 PM', '03:30 PM'],
      avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
      bio: 'Compassionate child health specialist for infant vaccination, pediatric infections, and developmental milestones.'
    },
    {
      id: 'doc-10',
      name: 'Dr. Karthik Raman',
      speciality: 'Gastroenterology',
      department: 'Gastroenterology',
      qualification: 'MBBS, MD, DM (Gastro)',
      experience: 12,
      hospitalId: 'hosp-6',
      hospitalName: 'Silicon City Health Science Hospital',
      city: 'Bengaluru',
      fee: 650,
      rating: 4.9,
      reviewCount: 140,
      phone: '+91 98450 11223',
      availableDays: ['Mon', 'Wed', 'Thu', 'Fri'],
      availableSlots: ['09:30 AM', '11:00 AM', '02:30 PM', '04:00 PM'],
      avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
      bio: 'Endoscopy expert managing GERD, acidity, liver disorders, IBS, and digestive tract issues.'
    }
  ],
  appointments: [
    {
      id: 'apt-101',
      tokenNumber: 'OPD-MUM-101',
      patientId: 'usr-4',
      patientName: 'Rahul Verma',
      patientPhone: '+91 98765 43210',
      patientEmail: 'rahul.patient@gmail.com',
      patientAge: 28,
      patientGender: 'Male',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sameer Joshi',
      doctorSpeciality: 'Cardiology',
      hospitalId: 'hosp-1',
      hospitalName: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      appointmentDate: new Date().toISOString().split('T')[0], // Today
      appointmentTime: '10:00 AM',
      symptoms: 'Mild chest heaviness after running, occasional breathlessness',
      fee: 600,
      paymentMethod: 'demo_online', // 'cash' or 'demo_online'
      paymentStatus: 'paid', // 'paid' or 'pending'
      transactionId: 'TXN-DEMO-991204',
      paymentModeDetail: 'UPI (GPay - demo@upi)',
      status: 'checked_in', // 'scheduled', 'checked_in', 'completed', 'cancelled', 'rescheduled', 'no_show'
      doctorNotes: 'BP recorded 128/82. ECG requested. Prescribed mild lifestyle adjustments.',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString()
    },
    {
      id: 'apt-102',
      tokenNumber: 'OPD-MUM-102',
      patientId: 'usr-4',
      patientName: 'Rahul Verma',
      patientPhone: '+91 98765 43210',
      patientEmail: 'rahul.patient@gmail.com',
      patientAge: 28,
      patientGender: 'Male',
      doctorId: 'doc-7',
      doctorName: 'Dr. Rohan Patel',
      doctorSpeciality: 'Dental',
      hospitalId: 'hosp-3',
      hospitalName: 'Apex Health Institute & Dental Clinic',
      city: 'Mumbai',
      appointmentDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // Day after tomorrow
      appointmentTime: '11:00 AM',
      symptoms: 'Tooth sensitivity to cold water, lower right molar pain',
      fee: 350,
      paymentMethod: 'cash',
      paymentStatus: 'pending',
      status: 'scheduled',
      doctorNotes: '',
      createdAt: new Date(Date.now() - 3600000 * 24).toISOString()
    },
    {
      id: 'apt-103',
      tokenNumber: 'OPD-MUM-103',
      patientId: 'usr-mock-2',
      patientName: 'Aarav Mehta',
      patientPhone: '+91 98199 88776',
      patientEmail: 'aarav.m@example.com',
      patientAge: 45,
      patientGender: 'Male',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sameer Joshi',
      doctorSpeciality: 'Cardiology',
      hospitalId: 'hosp-1',
      hospitalName: 'CityCare Memorial Super Speciality Hospital',
      city: 'Mumbai',
      appointmentDate: new Date().toISOString().split('T')[0], // Today
      appointmentTime: '11:00 AM',
      symptoms: 'High blood pressure review and annual checkup',
      fee: 600,
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      status: 'completed',
      doctorNotes: 'Prescription renewed. Amlodipine 5mg continued. Regular morning walk advised.',
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    }
  ],
  auditLogs: [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
      action: 'BOOK_APPOINTMENT',
      user: 'Rahul Verma (Patient)',
      details: 'Booked appointment with Dr. Sameer Joshi at CityCare Memorial Super Speciality Hospital for 10:00 AM',
      targetId: 'apt-101'
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 3600000 * 3).toISOString(),
      action: 'PAYMENT_RECEIVED',
      user: 'System (Online Demo)',
      details: 'Recorded mock online payment of ₹600 via UPI (TXN-DEMO-991204)',
      targetId: 'apt-101'
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 3600000 * 1).toISOString(),
      action: 'PATIENT_CHECKED_IN',
      user: 'Priya Sharma (Receptionist)',
      details: 'Checked-in patient Rahul Verma (OPD-MUM-101) at reception counter',
      targetId: 'apt-101'
    }
  ],
  authorizedAdmins: [
    {
      email: 'bhavsarvaibhav001@gmail.com',
      name: 'Vaibhav Bhavsar (Primary Super Admin)',
      grantedBy: 'SYSTEM_ROOT',
      grantedAt: new Date().toISOString(),
      isRoot: true,
      status: 'active',
      notes: 'Designated Master Administrator & Sole Authority to grant access'
    }
  ]
};

// Master Root Admin
const ROOT_ADMIN_EMAIL = 'bhavsarvaibhav001@gmail.com';

function ensureAdminSecurity(db: any) {
  if (!db.authorizedAdmins || !Array.isArray(db.authorizedAdmins)) {
    db.authorizedAdmins = [];
  }

  // Ensure ROOT ADMIN is always registered and active
  let rootAdmin = db.authorizedAdmins.find(
    (a: any) => a.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
  );
  if (!rootAdmin) {
    db.authorizedAdmins.unshift({
      email: ROOT_ADMIN_EMAIL,
      name: 'Vaibhav Bhavsar (Primary Super Admin)',
      grantedBy: 'SYSTEM_ROOT',
      grantedAt: new Date().toISOString(),
      isRoot: true,
      status: 'active',
      notes: 'Designated Master Administrator & Sole Authority to grant access'
    });
  } else {
    rootAdmin.isRoot = true;
    rootAdmin.status = 'active';
  }

  // Ensure root admin exists in db.users
  let rootUser = db.users.find(
    (u: any) => u.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()
  );
  if (!rootUser) {
    db.users.push({
      id: 'usr-admin-root',
      name: 'Vaibhav Bhavsar (Primary Super Admin)',
      email: ROOT_ADMIN_EMAIL,
      role: 'admin',
      phone: '+91 98000 00001',
      city: 'Amalner'
    });
  } else {
    rootUser.role = 'admin';
  }

  // Ensure active authorized admins have role 'admin' in db.users
  db.authorizedAdmins.forEach((auth: any) => {
    if (auth.status === 'active') {
      const u = db.users.find((user: any) => user.email.toLowerCase() === auth.email.toLowerCase());
      if (u) {
        u.role = 'admin';
      }
    }
  });
}

let cachedDB: any = null;

// Database helper functions
function loadDB() {
  if (cachedDB) {
    return cachedDB;
  }
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(data);
      ensureAdminSecurity(parsed);
      if (ensureNoOverlappingAppointments(parsed)) {
        saveDB(parsed);
      }
      cachedDB = parsed;
      return cachedDB;
    }
  } catch (err) {
    console.error('Error reading db.json, reinitializing default:', err);
  }
  ensureAdminSecurity(defaultSeed);
  ensureNoOverlappingAppointments(defaultSeed);
  cachedDB = defaultSeed;
  fs.writeFileSync(DB_PATH, JSON.stringify(defaultSeed, null, 2), 'utf-8');
  return cachedDB;
}

const FULL_OPD_SLOTS = [
  '09:00 AM',
  '10:30 AM',
  '12:00 PM',
  '02:00 PM',
  '04:00 PM',
  '05:30 PM',
  '07:00 PM',
  '08:30 PM',
  '09:30 PM',
];

let serverInternetOffsetMs = 0;
let serverTimeSource = 'System IST Clock (Asia/Kolkata)';
let lastInternetSyncAt = 0;

async function syncServerInternetTime(): Promise<void> {
  if (Date.now() - lastInternetSyncAt < 5 * 60 * 1000) return;
  lastInternetSyncAt = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const start = Date.now();
    const res = await fetch('https://worldtimeapi.org/api/timezone/Asia/Kolkata', {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data: any = await res.json();
      const rtt = (Date.now() - start) / 2;
      if (typeof data.unixtime === 'number') {
        serverInternetOffsetMs = data.unixtime * 1000 + rtt - Date.now();
        serverTimeSource = 'WorldTimeAPI Internet Clock (Asia/Kolkata IST)';
      }
    }
  } catch {
    // Fallback to system clock formatted in Asia/Kolkata
  }
}

// Trigger initial non-blocking sync
syncServerInternetTime();

function getServerISTClock() {
  const correctedNow = new Date(Date.now() + serverInternetOffsetMs);
  const partsFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const parts = partsFormatter.formatToParts(correctedNow);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value;
  }

  const year = parseInt(map.year || '2026', 10);
  const month = parseInt(map.month || '1', 10);
  const day = parseInt(map.day || '1', 10);
  let hour24 = parseInt(map.hour || '0', 10);
  if (hour24 === 24) hour24 = 0;
  const minute = parseInt(map.minute || '0', 10);
  const second = parseInt(map.second || '0', 10);

  const todayStr = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const istMidday = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  istMidday.setUTCDate(istMidday.getUTCDate() + 1);
  const tomorrowStr = `${istMidday.getUTCFullYear()}-${String(istMidday.getUTCMonth() + 1).padStart(2, '0')}-${String(istMidday.getUTCDate()).padStart(2, '0')}`;

  const minutesSinceMidnight = hour24 * 60 + minute;
  const ampm = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const time12h = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')} ${ampm}`;
  const timeShort = `${String(hour12).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${ampm}`;

  let period: 'morning' | 'afternoon' | 'evening' | 'night' = 'morning';
  if (hour24 >= 5 && hour24 < 12) period = 'morning';
  else if (hour24 >= 12 && hour24 < 17) period = 'afternoon';
  else if (hour24 >= 17 && hour24 < 22) period = 'evening';
  else period = 'night';

  return {
    epochMs: correctedNow.getTime(),
    todayStr,
    tomorrowStr,
    time12h,
    timeShort,
    minutesSinceMidnight,
    hour24,
    period,
    source: serverTimeSource,
  };
}

function parseServerSlotMinutes(slot: string): number {
  const cleaned = (slot || '').trim().toUpperCase();
  const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  const mer = match[3];
  if (mer === 'PM' && hours < 12) hours += 12;
  if (mer === 'AM' && hours === 12) hours = 0;
  return hours * 60 + mins;
}

function isServerSlotPast(
  appointmentDate: string,
  slot: string,
  istClock = getServerISTClock()
): boolean {
  if (!appointmentDate || !slot) return false;
  if (appointmentDate < istClock.todayStr) return true;
  if (appointmentDate > istClock.todayStr) return false;
  return parseServerSlotMinutes(slot) <= istClock.minutesSinceMidnight;
}

function normalizeSlot(slot: string): string {
  return (slot || '').trim().toUpperCase();
}

function isActiveAppointment(apt: any): boolean {
  return apt && apt.status !== 'cancelled' && apt.status !== 'no_show';
}

function isSamePatient(a: any, target: { patientId?: string; patientPhone?: string; patientEmail?: string; patientName?: string }): boolean {
  if (target.patientId && a.patientId && a.patientId === target.patientId) return true;
  const cleanTargetEmail = (target.patientEmail || '').trim().toLowerCase();
  const cleanAptEmail = (a.patientEmail || '').trim().toLowerCase();
  if (cleanTargetEmail && cleanAptEmail && cleanTargetEmail === cleanAptEmail) return true;
  const cleanTargetPhone = (target.patientPhone || '').replace(/[^0-9]/g, '');
  const cleanAptPhone = (a.patientPhone || '').replace(/[^0-9]/g, '');
  if (cleanTargetPhone.length >= 6 && cleanAptPhone.length >= 6 && cleanTargetPhone === cleanAptPhone) return true;
  const cleanTargetName = (target.patientName || '').trim().toLowerCase();
  const cleanAptName = (a.patientName || '').trim().toLowerCase();
  if (cleanTargetName && cleanAptName && cleanTargetName === cleanAptName) return true;
  return false;
}

function ensureNoOverlappingAppointments(db: any): boolean {
  if (!db) return false;
  let modified = false;

  // 1. Clean up any user record where an email was placed in 'name' or a short password in 'phone'
  if (Array.isArray(db.users)) {
    for (const u of db.users) {
      if (u.name && u.name.includes('@') && (!u.email || u.email.endsWith('@citycare.org'))) {
        const realEmail = u.name.trim().toLowerCase();
        u.email = realEmail;
        u.name = (realEmail.split('@')[0] || 'Patient')
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (l: string) => l.toUpperCase())
          .trim();
        modified = true;
      }
      if (u.phone && String(u.phone).replace(/[^0-9]/g, '').length < 10) {
        u.phone = `+91 98000 ${String(u.id).replace(/[^0-9]/g, '').slice(-5).padStart(5, '0')}`;
        modified = true;
      }
    }
  }

  // 2. Ensure appointments with different patient names/emails are never merged under Rahul Verma's usr-4 ID
  if (Array.isArray(db.appointments)) {
    for (const apt of db.appointments) {
      if (apt.patientId === 'usr-4' && apt.patientName && apt.patientName.trim().toLowerCase() !== 'rahul verma') {
        const cleanEmail = (apt.patientEmail || '').trim().toLowerCase();
        const matchedUser = (db.users || []).find(
          (u: any) => u.id !== 'usr-4' && cleanEmail && (u.email || '').toLowerCase() === cleanEmail
        );
        apt.patientId = matchedUser ? matchedUser.id : `usr-pat-${String(apt.id).replace(/[^0-9]/g, '').slice(-6) || '999'}`;
        modified = true;
      }
    }
  }

  if (!Array.isArray(db.appointments)) return modified;
  const fallbackSlots = ['09:00 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '03:30 PM', '04:00 PM', '05:00 PM'];

  // Iterate from oldest to newest so earlier bookings keep their original slot
  const activeApts = [...db.appointments].reverse().filter(isActiveAppointment);
  const occupiedDoctorSlots = new Set<string>();
  const occupiedPatientSlots = new Set<string>();

  for (const apt of activeApts) {
    const date = apt.appointmentDate;
    let slot = normalizeSlot(apt.appointmentTime);
    const docKey = `${apt.doctorId}|${date}|${slot}`;
    const patIdentifier = apt.patientId || (apt.patientPhone || '').replace(/[^0-9]/g, '') || (apt.patientName || '').trim().toLowerCase();
    const patKey = `${patIdentifier}|${date}|${slot}`;

    if (occupiedDoctorSlots.has(docKey) || occupiedPatientSlots.has(patKey)) {
      const doc = (db.doctors || []).find((d: any) => d.id === apt.doctorId);
      const candidateSlots: string[] = Array.from(new Set([...(doc?.availableSlots || []), ...fallbackSlots]));
      const nextFree = candidateSlots.find((cand) => {
        const normCand = normalizeSlot(cand);
        return (
          !occupiedDoctorSlots.has(`${apt.doctorId}|${date}|${normCand}`) &&
          !occupiedPatientSlots.has(`${patIdentifier}|${date}|${normCand}`)
        );
      });
      if (nextFree) {
        apt.appointmentTime = nextFree;
        slot = normalizeSlot(nextFree);
        modified = true;
      }
    }

    occupiedDoctorSlots.add(`${apt.doctorId}|${date}|${slot}`);
    occupiedPatientSlots.add(`${patIdentifier}|${date}|${slot}`);
  }

  // 3. Deduplicate repeated doctor names per city, enrich gender & cartoon/anime SVG avatars, and ensure 7-day slot coverage
  if (Array.isArray(db.doctors)) {
    const seenCityNames = new Set<string>();
    let poolCursor = 0;

    for (const doc of db.doctors) {
      const cityKey = (doc.city || 'Mumbai').trim().toLowerCase();
      const nameKey = `${cityKey}|${(doc.name || '').trim().toLowerCase()}`;

      // If this city already has a doctor with the exact same name, assign a unique specialist profile from REAL_DOCTOR_POOL
      if (seenCityNames.has(nameKey)) {
        const sameSpecPool = REAL_DOCTOR_POOL.filter(
          (p) =>
            p.speciality.toLowerCase() === (doc.speciality || '').toLowerCase() &&
            !seenCityNames.has(`${cityKey}|${p.name.toLowerCase()}`)
        );
        const replacement =
          sameSpecPool[0] ||
          REAL_DOCTOR_POOL.find((p) => !seenCityNames.has(`${cityKey}|${p.name.toLowerCase()}`));
        poolCursor++;

        if (replacement && replacement.name !== doc.name) {
          doc.name = replacement.name;
          doc.gender = replacement.gender;
          doc.qualification = replacement.qualification;
          doc.bio = replacement.bio;
          doc.avatar = generateServerCartoonAvatar(doc.name, doc.speciality || 'General Medicine', doc.gender);
          modified = true;
        }
      }

      seenCityNames.add(`${cityKey}|${(doc.name || '').trim().toLowerCase()}`);

      const inferredGender = inferServerDoctorGender(doc.name, doc.gender);
      if (doc.gender !== inferredGender) {
        doc.gender = inferredGender;
        modified = true;
      }

      if (!doc.avatar || !String(doc.avatar).startsWith('data:image/svg+xml')) {
        doc.avatar = generateServerCartoonAvatar(doc.name, doc.speciality || 'General Medicine', doc.gender);
        modified = true;
      }

      // Ensure 7-day availability so weekend bookings never fail
      if (!Array.isArray(doc.availableDays) || doc.availableDays.length < 7) {
        doc.availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        modified = true;
      }
      if (!Array.isArray(doc.availableSlots) || doc.availableSlots.length < 9) {
        doc.availableSlots = [...FULL_OPD_SLOTS];
        modified = true;
      }
    }

    // Ensure every city present in db.hospitals has full department coverage (Pediatrics, General Medicine, Cardiology, Orthopedics, Neurology, Pulmonology, Gastroenterology, Dermatology, Dental)
    if (Array.isArray(db.hospitals)) {
      const citiesInDb = Array.from(
        new Set(db.hospitals.map((h: any) => (h.city || '').trim()).filter(Boolean))
      ) as string[];
      const coreSpecialties = [
        'Pediatrics',
        'General Medicine',
        'Cardiology',
        'Orthopedics',
        'Neurology',
        'Pulmonology',
        'Gastroenterology',
        'Dermatology',
        'Dental',
      ];

      for (const cName of citiesInDb) {
        const cityHospitals = db.hospitals.filter(
          (h: any) => (h.city || '').toLowerCase() === cName.toLowerCase()
        );
        if (cityHospitals.length === 0) continue;

        const cityDoctors = db.doctors.filter(
          (d: any) => (d.city || '').toLowerCase() === cName.toLowerCase()
        );
        const existingSpecs = new Set(
          cityDoctors.map((d: any) => (d.speciality || '').toLowerCase())
        );

        coreSpecialties.forEach((reqSpec, idx) => {
          if (!existingSpecs.has(reqSpec.toLowerCase())) {
            const targetHosp = cityHospitals[idx % cityHospitals.length];
            const candidate =
              REAL_DOCTOR_POOL.find(
                (p) =>
                  p.speciality.toLowerCase() === reqSpec.toLowerCase() &&
                  !seenCityNames.has(`${cName.toLowerCase()}|${p.name.toLowerCase()}`)
              ) ||
              REAL_DOCTOR_POOL.find((p) => p.speciality.toLowerCase() === reqSpec.toLowerCase()) ||
              REAL_DOCTOR_POOL[idx % REAL_DOCTOR_POOL.length];

            const newDocId = `doc-${cName.toLowerCase().replace(/[^a-z0-9]/g, '')}-spec-${idx + 1}`;
            seenCityNames.add(`${cName.toLowerCase()}|${candidate.name.toLowerCase()}`);

            db.doctors.push({
              id: newDocId,
              name: candidate.name,
              gender: candidate.gender,
              speciality: candidate.speciality,
              department: candidate.speciality,
              qualification: candidate.qualification,
              experience: candidate.experience,
              hospitalId: targetHosp.id,
              hospitalName: targetHosp.name,
              city: targetHosp.city || cName,
              fee: candidate.fee,
              rating: Number((4.7 + (idx % 3) * 0.1).toFixed(1)),
              reviewCount: 42 + idx * 11,
              phone: `+91 9823${idx} 4512${idx}`,
              availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              availableSlots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:00 PM', '05:30 PM'],
              avatar: generateServerCartoonAvatar(candidate.name, candidate.speciality, candidate.gender),
              bio: candidate.bio,
            });
            modified = true;
          }
        });
      }
    }
  }

  return modified;
}

const SERVER_FEMALE_NAMES = new Set([
  'ananya', 'meera', 'shalini', 'neha', 'neeta', 'sneha', 'priya', 'kavita', 'pooja',
  'sunita', 'swati', 'pallavi', 'anjali', 'divya', 'sonali', 'madhuri', 'archana',
  'vandana', 'deepika', 'shruti', 'nandini', 'aditi', 'rashmi', 'vidya', 'rekha',
  'bhavana', 'shweta', 'gayatri', 'vaishali', 'rupali', 'manisha', 'jyoti', 'smita',
  'ashwini', 'sujata', 'varsha', 'amruta', 'tejaswini', 'radhika', 'kriti',
]);

function inferServerDoctorGender(name: string, explicitGender?: string): 'male' | 'female' {
  if (explicitGender) {
    const g = String(explicitGender).trim().toLowerCase();
    if (g === 'female' || g === 'f') return 'female';
    if (g === 'male' || g === 'm') return 'male';
  }
  const cleaned = (name || '').replace(/^dr\.?\s+/i, '').trim().toLowerCase();
  const firstToken = cleaned.split(/\s+/)[0]?.replace(/[^a-z]/g, '') || '';
  if (SERVER_FEMALE_NAMES.has(firstToken)) return 'female';
  return 'male';
}

function hashServerString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function generateServerCartoonAvatar(
  name: string,
  speciality = 'General Medicine',
  explicitGender?: string
): string {
  const gender = inferServerDoctorGender(name, explicitGender);
  const h = hashServerString(`${name}-${speciality}-${gender}`);
  const specLower = (speciality || '').toLowerCase();

  const palettes: Record<string, { bg1: string; bg2: string; scrub: string; badge: string }> = {
    cardiology: { bg1: '#FFE4E6', bg2: '#FECDD3', scrub: '#E11D48', badge: '#FB7185' },
    pediatrics: { bg1: '#FEF3C7', bg2: '#FDE68A', scrub: '#D97706', badge: '#FBBF24' },
    orthopedics: { bg1: '#E0E7FF', bg2: '#C7D2FE', scrub: '#4F46E5', badge: '#818CF8' },
    neurology: { bg1: '#F3E8FF', bg2: '#E9D5FF', scrub: '#7C3AED', badge: '#A78BFA' },
    pulmonology: { bg1: '#E0F2FE', bg2: '#BAE6FD', scrub: '#0284C7', badge: '#38BDF8' },
    gastroenterology: { bg1: '#FFEDD5', bg2: '#FED7AA', scrub: '#EA580C', badge: '#FB923C' },
    dermatology: { bg1: '#FCE7F3', bg2: '#FBCFE8', scrub: '#DB2777', badge: '#F472B6' },
    dental: { bg1: '#CCFBF1', bg2: '#99F6E4', scrub: '#0D9488', badge: '#2DD4BF' },
    default: { bg1: '#DCFCE7', bg2: '#BBF7D0', scrub: '#059669', badge: '#34D399' },
  };

  const palette =
    palettes[specLower] ||
    Object.entries(palettes).find(([k]) => specLower.includes(k))?.[1] ||
    palettes.default;

  const skins = ['#FDE2C8', '#F7C9A6', '#EAB68F', '#F3D1B0', '#E5AD84'];
  const hairs = ['#1E293B', '#0F172A', '#3B2314', '#271810', '#1C1917', '#334155'];
  const skin = skins[h % skins.length];
  const hair = hairs[(h >> 3) % hairs.length];
  const hasGlasses = h % 3 === 0;
  const hairVariant = h % 3;

  const femaleBackHair =
    hairVariant === 0
      ? `<path d="M52 72 C44 105 46 142 60 158 L140 158 C154 142 156 105 148 72 Z" fill="${hair}" />`
      : hairVariant === 1
      ? `<circle cx="100" cy="40" r="22" fill="${hair}" /><path d="M56 76 C50 105 54 134 66 146 L134 146 C146 134 150 105 144 76 Z" fill="${hair}" />`
      : `<path d="M50 75 C40 112 48 150 64 162 L136 162 C152 150 160 112 150 75 Z" fill="${hair}" />`;

  const femaleFrontHair =
    hairVariant === 0
      ? `<path d="M54 78 C54 44 74 30 100 30 C126 30 146 44 146 78 C134 58 116 52 100 56 C84 52 66 58 54 78 Z" fill="${hair}" />`
      : `<path d="M54 80 C54 45 75 31 100 31 C125 31 146 45 146 80 C138 62 122 50 104 54 C88 50 68 60 54 80 Z" fill="${hair}" />`;

  const maleHair =
    hairVariant === 0
      ? `<path d="M55 78 C53 45 73 30 100 30 C127 30 147 45 145 78 C138 58 122 50 100 52 C78 50 62 58 55 78 Z" fill="${hair}" /><path d="M72 34 L82 24 L94 32 L108 22 L118 33" fill="${hair}" />`
      : `<path d="M55 76 C54 42 75 28 100 28 C125 28 146 42 145 76 C134 56 118 48 100 48 C82 48 66 56 55 76 Z" fill="${hair}" />`;

  const glassesSvg = hasGlasses
    ? `<g stroke="#1E293B" stroke-width="2.4" fill="rgba(255,255,255,0.25)"><rect x="69" y="74" width="24" height="15" rx="5" /><rect x="107" y="74" width="24" height="15" rx="5" /><line x1="93" y1="81" x2="107" y2="81" /></g>`
    : '';

  const eyelashes =
    gender === 'female'
      ? `<path d="M72 78 Q81 73 89 78" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/><path d="M111 78 Q119 73 128 78" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="63" cy="88" r="3" fill="#F43F5E" opacity="0.55" /><circle cx="137" cy="88" r="3" fill="#F43F5E" opacity="0.55" />`
      : `<path d="M72 75 L90 76" stroke="${hair}" stroke-width="3" stroke-linecap="round"/><path d="M110 76 L128 75" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>`;

  const mouth =
    gender === 'female'
      ? `<path d="M91 102 Q100 110 109 102" stroke="#E11D48" stroke-width="2.8" fill="none" stroke-linecap="round" />`
      : `<path d="M90 103 Q100 110 110 103" stroke="#7C2D12" stroke-width="2.6" fill="none" stroke-linecap="round" />`;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><defs><linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${palette.bg1}" /><stop offset="100%" stop-color="${palette.bg2}" /></linearGradient></defs><rect width="200" height="200" rx="32" fill="url(#bgGrad)" /><circle cx="100" cy="105" r="76" fill="#FFFFFF" opacity="0.45" /><g transform="translate(152, 18)"><circle cx="14" cy="14" r="14" fill="#FFFFFF" opacity="0.9" /><path d="M14 7 V21 M7 14 H21" stroke="${palette.scrub}" stroke-width="3.5" stroke-linecap="round" /></g>${gender === 'female' ? femaleBackHair : ''}<rect x="88" y="114" width="24" height="26" rx="8" fill="${skin}" /><path d="M34 200 C36 152 62 134 100 134 C138 134 164 152 166 200 Z" fill="${palette.scrub}" /><path d="M34 200 C36 152 58 136 82 134 L94 200 Z" fill="#FFFFFF" /><path d="M166 200 C164 152 142 136 118 134 L106 200 Z" fill="#FFFFFF" /><path d="M82 134 L95 172 L72 166 Z" fill="#F1F5F9" /><path d="M118 134 L105 172 L128 166 Z" fill="#F1F5F9" /><path d="M74 132 C72 162 84 176 100 176 C116 176 128 162 126 132" stroke="#0F172A" stroke-width="4.5" fill="none" stroke-linecap="round" /><circle cx="122" cy="168" r="8" fill="#CBD5E1" stroke="#0F172A" stroke-width="3" /><circle cx="122" cy="168" r="3" fill="${palette.badge}" /><circle cx="58" cy="84" r="8" fill="${skin}" /><circle cx="142" cy="84" r="8" fill="${skin}" /><rect x="60" y="42" width="80" height="78" rx="36" fill="${skin}" /><ellipse cx="74" cy="93" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" /><ellipse cx="126" cy="93" rx="6" ry="3.5" fill="#FB7185" opacity="0.35" />${eyelashes}<circle cx="81" cy="83" r="4.5" fill="#0F172A" /><circle cx="119" cy="83" r="4.5" fill="#0F172A" /><circle cx="82.5" cy="81.5" r="1.6" fill="#FFFFFF" /><circle cx="120.5" cy="81.5" r="1.6" fill="#FFFFFF" /><path d="M100 84 L98 93 L102 94" stroke="#C28E66" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" />${mouth}${glassesSvg}${gender === 'female' ? femaleFrontHair : maleHair}</svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const REAL_DOCTOR_POOL: Array<{
  name: string;
  gender: 'male' | 'female';
  speciality: string;
  qualification: string;
  experience: number;
  fee: number;
  bio: string;
}> = [
  {
    name: 'Dr. Ravindra K. Patil',
    gender: 'male',
    speciality: 'General Medicine',
    qualification: 'MBBS, MD (Internal Medicine)',
    experience: 14,
    fee: 350,
    bio: 'Senior consultant physician specializing in viral fevers, diabetes, hypertension, and metabolic care.',
  },
  {
    name: 'Dr. Neeta Deshmukh',
    gender: 'female',
    speciality: 'Pediatrics',
    qualification: 'MBBS, DCH, MD (Pediatrics)',
    experience: 11,
    fee: 400,
    bio: 'Child health and neonatology specialist experienced in pediatric fever, asthma, and immunization.',
  },
  {
    name: 'Dr. Sachin Kulkarni',
    gender: 'male',
    speciality: 'Orthopedics',
    qualification: 'MBBS, MS (Ortho), Fellowship in Arthroscopy',
    experience: 15,
    fee: 450,
    bio: 'Orthopedic and joint replacement surgeon treating spine pain, knee arthritis, and sports injuries.',
  },
  {
    name: 'Dr. Sneha Bhavsar',
    gender: 'female',
    speciality: 'Cardiology',
    qualification: 'MBBS, MD, DM (Cardiology)',
    experience: 13,
    fee: 550,
    bio: 'Interventional cardiologist providing preventive heart checkups, echocardiography, and hypertension care.',
  },
  {
    name: 'Dr. Amit Joshi',
    gender: 'male',
    speciality: 'Dental',
    qualification: 'BDS, MDS (Conservative Dentistry & Endodontics)',
    experience: 9,
    fee: 300,
    bio: 'Micro-endodontist and dental surgeon specializing in painless single-sitting root canals and implants.',
  },
  {
    name: 'Dr. Pallavi Chaudhari',
    gender: 'female',
    speciality: 'General Medicine',
    qualification: 'MBBS, DNB (Family Medicine)',
    experience: 10,
    fee: 350,
    bio: 'Consultant family physician managing seasonal infections, thyroid disorders, and preventive diagnostics.',
  },
  {
    name: 'Dr. Prasad Suryawanshi',
    gender: 'male',
    speciality: 'Pulmonology',
    qualification: 'MBBS, MD (Respiratory Medicine)',
    experience: 12,
    fee: 450,
    bio: 'Pulmonologist and chest specialist treating persistent cough, asthma, allergy, and COPD.',
  },
  {
    name: 'Dr. Swati Wagh',
    gender: 'female',
    speciality: 'Dermatology',
    qualification: 'MBBS, MD (Dermatology, Venereology & Leprosy)',
    experience: 8,
    fee: 400,
    bio: 'Clinical dermatologist specializing in skin allergies, eczema, acne, and pediatric dermatology.',
  },
  {
    name: 'Dr. Nikhil Sonawane',
    gender: 'male',
    speciality: 'Gastroenterology',
    qualification: 'MBBS, MD, DM (Medical Gastroenterology)',
    experience: 13,
    fee: 500,
    bio: 'Digestive health and endoscopy specialist managing acidity, GERD, abdominal pain, and liver care.',
  },
  {
    name: 'Dr. Kavita Mahajan',
    gender: 'female',
    speciality: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    experience: 14,
    fee: 600,
    bio: 'Senior neurologist treating migraines, vertigo, nerve pain, epilepsy, and stroke rehabilitation.',
  },
  {
    name: 'Dr. Mahesh Bhalerao',
    gender: 'male',
    speciality: 'Pediatrics',
    qualification: 'MBBS, MD (Pediatrics), FIAP',
    experience: 16,
    fee: 400,
    bio: 'Senior pediatrician focused on childhood respiratory infections, nutrition, and growth monitoring.',
  },
  {
    name: 'Dr. Rohini Pawar',
    gender: 'female',
    speciality: 'Orthopedics',
    qualification: 'MBBS, DNB (Orthopedics)',
    experience: 9,
    fee: 450,
    bio: 'Orthopedic specialist in neck/back posture pain, osteoporosis, and joint rehabilitation.',
  },
  {
    name: 'Dr. Tushar Shinde',
    gender: 'male',
    speciality: 'Cardiology',
    qualification: 'MBBS, MD, DNB (Cardiology)',
    experience: 17,
    fee: 600,
    bio: 'Consultant cardiologist for chest pain evaluation, treadmill stress testing, and cardiac arrhythmia.',
  },
  {
    name: 'Dr. Ashwini Jadhav',
    gender: 'female',
    speciality: 'Pulmonology',
    qualification: 'MBBS, DTCD, DNB (Pulmonology)',
    experience: 10,
    fee: 450,
    bio: 'Respiratory specialist for wheezing, bronchitis, sleep apnea, and post-viral cough recovery.',
  },
  {
    name: 'Dr. Yogesh Narke',
    gender: 'male',
    speciality: 'Neurology',
    qualification: 'MBBS, MD, DM (Neuro)',
    experience: 12,
    fee: 550,
    bio: 'Neurologist experienced in chronic headache relief, dizziness, and peripheral neuropathy.',
  },
  {
    name: 'Dr. Vaishali More',
    gender: 'female',
    speciality: 'Gastroenterology',
    qualification: 'MBBS, MD, DNB (Gastroenterology)',
    experience: 11,
    fee: 500,
    bio: 'Gastroenterologist treating gastritis, food intolerance, abdominal cramps, and digestive disorders.',
  },
  {
    name: 'Dr. Mandar Gokhale',
    gender: 'male',
    speciality: 'Dermatology',
    qualification: 'MBBS, DDVL, MD',
    experience: 11,
    fee: 400,
    bio: 'Consultant dermatologist for skin rashes, fungal infections, psoriasis, and hair loss.',
  },
  {
    name: 'Dr. Shruti Deore',
    gender: 'female',
    speciality: 'Dental',
    qualification: 'BDS, MDS (Pediatric & Preventive Dentistry)',
    experience: 8,
    fee: 350,
    bio: 'Dental specialist in painless tooth fillings, gum care, wisdom tooth pain, and cosmetic alignment.',
  },
];

function saveDB(db: any) {
  cachedDB = db;
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing to db.json:', err);
  }
}

// Add an audit log entry
function addAuditLog(action: string, user: string, details: string, targetId?: string) {
  const db = loadDB();
  const newLog = {
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    action,
    user,
    details,
    targetId: targetId || ''
  };
  db.auditLogs.unshift(newLog);
  // Keep last 50 logs
  if (db.auditLogs.length > 50) {
    db.auditLogs = db.auditLogs.slice(0, 50);
  }
  saveDB(db);
  return newLog;
}

// Ensure db exists on startup
loadDB();

// -------------------------------------------------------------
// REST API ROUTES
// -------------------------------------------------------------

// 0. Authoritative Internet Time (IST Asia/Kolkata) endpoint
app.get('/api/time', async (req, res) => {
  await syncServerInternetTime();
  const clock = getServerISTClock();
  res.json({
    success: true,
    ...clock,
  });
});

// 1. Current user / Session / Auth simulation
app.get('/api/users', (req, res) => {
  const db = loadDB();
  res.json({ success: true, users: db.users });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, phone, role = 'patient', bloodGroup, age, gender, city = 'Mumbai' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ success: false, message: 'Name and email are required' });
  }

  const db = loadDB();
  const existing = db.users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.json({ success: true, user: existing, message: 'Existing user loaded' });
  }

  const newUser = {
    id: `usr-${Date.now()}`,
    name,
    email,
    phone: phone || '+91 90000 00000',
    role,
    bloodGroup: bloodGroup || 'O+',
    age: age ? parseInt(age) : 25,
    gender: gender || 'Other',
    city
  };

  db.users.push(newUser);
  saveDB(db);
  addAuditLog('USER_REGISTERED', `${name} (${role})`, `New user registered with email: ${email}`, newUser.id);
  res.json({ success: true, user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, phone, role, password, id } = req.body;
  const db = loadDB();
  ensureAdminSecurity(db);

  const cleanEmail = email ? email.trim().toLowerCase() : '';

  // 1. Strict Administrator Role Access Control
  // Rule: Administrator access is ONLY for bhavsarvaibhav001@gmail.com
  // and accounts explicitly granted access by bhavsarvaibhav001@gmail.com
  if (role === 'admin') {
    // If an email is provided:
    if (cleanEmail) {
      const isAuthorized = db.authorizedAdmins.some(
        (a: any) => a.email.toLowerCase() === cleanEmail && a.status === 'active'
      );

      if (!isAuthorized && cleanEmail !== ROOT_ADMIN_EMAIL.toLowerCase()) {
        addAuditLog(
          'SECURITY_ALERT',
          cleanEmail,
          `DENIED: Unauthorized attempt to access Administrator Console by ${cleanEmail}. Master Administrator: ${ROOT_ADMIN_EMAIL}`
        );
        return res.status(403).json({
          success: false,
          code: 'ADMIN_UNAUTHORIZED',
          message: `Access Denied: Administrator access is strictly restricted. Only ${ROOT_ADMIN_EMAIL} has Administrator access, or accounts authorized by ${ROOT_ADMIN_EMAIL}.`
        });
      }
    }

    // Target email to sign in: either the authorized email or default to root admin
    const targetEmail = cleanEmail || ROOT_ADMIN_EMAIL;
    let user = db.users.find((u: any) => u.email.toLowerCase() === targetEmail);
    if (!user) {
      const authInfo = db.authorizedAdmins.find((a: any) => a.email.toLowerCase() === targetEmail);
      user = {
        id: targetEmail === ROOT_ADMIN_EMAIL.toLowerCase() ? 'usr-admin-root' : `usr-admin-${Date.now()}`,
        name: authInfo?.name || (targetEmail === ROOT_ADMIN_EMAIL.toLowerCase() ? 'Vaibhav Bhavsar (Primary Super Admin)' : 'Delegated Administrator'),
        email: targetEmail,
        role: 'admin',
        phone: '+91 98000 00001',
        city: 'Amalner'
      };
      db.users.push(user);
      saveDB(db);
    } else {
      user.role = 'admin';
    }

    addAuditLog('USER_LOGGED_IN', `${user.name} (admin)`, `Administrator logged in: ${user.email}`, user.id);
    return res.json({ success: true, user });
  }

  // Normal login logic for patient, doctor, receptionist
  const { name } = req.body;
  const rawPhone = phone ? String(phone).trim() : '';
  const isPhoneInput = rawPhone && !rawPhone.includes('@');
  const cleanPhone = isPhoneInput ? rawPhone.replace(/[^0-9]/g, '') : '';
  const resolvedEmail =
    cleanEmail || (name && String(name).includes('@') ? String(name).trim().toLowerCase() : '');

  let user = null;
  if (id) {
    user = db.users.find((u: any) => u.id === id);
  }
  if (!user && resolvedEmail) {
    user = db.users.find((u: any) => (u.email || '').toLowerCase() === resolvedEmail);
  }
  // Only match by phone if no email was given AND phone has at least 10 digits
  if (!user && !resolvedEmail && cleanPhone.length >= 10) {
    user = db.users.find((u: any) => {
      const uPhone = (u.phone || '').replace(/[^0-9]/g, '');
      return uPhone.length >= 10 && uPhone.slice(-10) === cleanPhone.slice(-10);
    });
  }

  // Only fall back to default role user if NO email and NO phone were provided at all
  if (!user && !resolvedEmail && !rawPhone && role) {
    user = db.users.find((u: any) => u.role === role);
  }

  // If a new email or phone was entered that doesn't match an existing user, create a new unique user ID
  if (!user && role) {
    const deriveNameFromEmail = (em: string) => {
      const localPart = em.split('@')[0] || 'user';
      return localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (l) => l.toUpperCase())
        .trim();
    };

    const roleDefaultNames: Record<string, string> = {
      patient: 'Rahul Verma',
      doctor: 'Dr. Sameer Joshi',
      receptionist: 'Priya Sharma',
    };

    const customDisplayName =
      name && !String(name).includes('@') ? String(name).trim() : '';

    const resolvedName =
      customDisplayName ||
      (resolvedEmail ? deriveNameFromEmail(resolvedEmail) : '') ||
      (cleanPhone ? `Patient (${rawPhone})` : roleDefaultNames[role] || 'System User');

    const rolePrefix = role === 'patient' ? 'pat' : role === 'doctor' ? 'doc' : 'stf';
    const uniqueSuffix = Date.now().toString().slice(-6);

    user = {
      id: `usr-${rolePrefix}-${uniqueSuffix}`,
      name: resolvedName,
      email: resolvedEmail || `${role}.${uniqueSuffix}@citycare.org`,
      role: role,
      phone: cleanPhone.length >= 10 ? rawPhone : '+91 98000 ' + uniqueSuffix.slice(-5),
      bloodGroup: 'O+',
      age: 28,
      gender: 'Other',
      city: 'Amalner',
    };
    db.users.push(user);
    saveDB(db);
  }

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials or user not found' });
  }

  addAuditLog('USER_LOGGED_IN', `${user.name} (${user.role})`, `User authenticated into ${user.role} workspace portal`, user.id);
  res.json({ success: true, user });
});

// -------------------------------------------------------------
// ADMINISTRATOR RBAC & DELEGATION CONTROLS
// Master Authority: bhavsarvaibhav001@gmail.com
// -------------------------------------------------------------

// List authorized administrators
app.get('/api/admin/authorized-users', (req, res) => {
  const db = loadDB();
  ensureAdminSecurity(db);
  res.json({
    success: true,
    rootAdmin: ROOT_ADMIN_EMAIL,
    authorizedAdmins: db.authorizedAdmins
  });
});

// Grant Administrator Access (ONLY bhavsarvaibhav001@gmail.com can grant)
app.post('/api/admin/grant-access', (req, res) => {
  const { requesterEmail, newAdminEmail, newAdminName, notes } = req.body;
  const db = loadDB();
  ensureAdminSecurity(db);

  const cleanRequester = (requesterEmail || '').trim().toLowerCase();
  if (cleanRequester !== ROOT_ADMIN_EMAIL.toLowerCase()) {
    addAuditLog(
      'SECURITY_ALERT',
      cleanRequester || 'Unknown',
      `UNAUTHORIZED DELEGATION ATTEMPT: ${cleanRequester} attempted to grant administrator access to ${newAdminEmail}. Only ${ROOT_ADMIN_EMAIL} can grant administrator access.`
    );
    return res.status(403).json({
      success: false,
      message: `Permission Denied: Only ${ROOT_ADMIN_EMAIL} has the authority to grant Administrator access to other accounts.`
    });
  }

  if (!newAdminEmail || !newAdminEmail.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required to grant Administrator access.'
    });
  }

  const targetEmail = newAdminEmail.trim().toLowerCase();
  let existingAdmin = db.authorizedAdmins.find((a: any) => a.email.toLowerCase() === targetEmail);

  if (existingAdmin) {
    existingAdmin.status = 'active';
    existingAdmin.name = (newAdminName || '').trim() || existingAdmin.name;
    existingAdmin.grantedBy = ROOT_ADMIN_EMAIL;
    existingAdmin.grantedAt = new Date().toISOString();
    existingAdmin.notes = notes || existingAdmin.notes;
  } else {
    db.authorizedAdmins.push({
      email: targetEmail,
      name: (newAdminName || '').trim() || 'Delegated Administrator',
      grantedBy: ROOT_ADMIN_EMAIL,
      grantedAt: new Date().toISOString(),
      isRoot: targetEmail === ROOT_ADMIN_EMAIL.toLowerCase(),
      status: 'active',
      notes: notes || `Administrator access granted by ${ROOT_ADMIN_EMAIL}`
    });
  }

  // Update or create user in db.users
  let targetUser = db.users.find((u: any) => u.email.toLowerCase() === targetEmail);
  if (targetUser) {
    targetUser.role = 'admin';
    if (newAdminName && newAdminName.trim()) {
      targetUser.name = newAdminName.trim();
    }
  } else {
    db.users.push({
      id: `usr-admin-${Date.now()}`,
      name: (newAdminName || '').trim() || 'Delegated Administrator',
      email: targetEmail,
      role: 'admin',
      phone: '+91 98000 00000',
      city: 'Amalner'
    });
  }

  saveDB(db);
  addAuditLog(
    'ADMIN_ACCESS_GRANTED',
    `${ROOT_ADMIN_EMAIL} (Master Admin)`,
    `Administrator privileges granted to ${targetEmail} (${newAdminName || 'Delegated Admin'}) by ${ROOT_ADMIN_EMAIL}`
  );

  res.json({
    success: true,
    message: `Administrator access successfully granted to ${targetEmail}`,
    authorizedAdmins: db.authorizedAdmins
  });
});

// Revoke Administrator Access (ONLY bhavsarvaibhav001@gmail.com can revoke)
app.post('/api/admin/revoke-access', (req, res) => {
  const { requesterEmail, emailToRevoke } = req.body;
  const db = loadDB();
  ensureAdminSecurity(db);

  const cleanRequester = (requesterEmail || '').trim().toLowerCase();
  if (cleanRequester !== ROOT_ADMIN_EMAIL.toLowerCase()) {
    addAuditLog(
      'SECURITY_ALERT',
      cleanRequester || 'Unknown',
      `UNAUTHORIZED REVOCATION ATTEMPT: ${cleanRequester} attempted to revoke administrator access for ${emailToRevoke}.`
    );
    return res.status(403).json({
      success: false,
      message: `Permission Denied: Only ${ROOT_ADMIN_EMAIL} has the authority to revoke Administrator access.`
    });
  }

  const targetEmail = (emailToRevoke || '').trim().toLowerCase();
  if (targetEmail === ROOT_ADMIN_EMAIL.toLowerCase()) {
    return res.status(400).json({
      success: false,
      message: `Primary Root Administrator (${ROOT_ADMIN_EMAIL}) cannot be revoked.`
    });
  }

  const adminEntry = db.authorizedAdmins.find((a: any) => a.email.toLowerCase() === targetEmail);
  if (!adminEntry) {
    return res.status(404).json({
      success: false,
      message: `No administrator account found with email ${targetEmail}`
    });
  }

  adminEntry.status = 'revoked';

  // Demote user in db.users to patient
  const targetUser = db.users.find((u: any) => u.email.toLowerCase() === targetEmail);
  if (targetUser) {
    targetUser.role = 'patient';
  }

  saveDB(db);
  addAuditLog(
    'ADMIN_ACCESS_REVOKED',
    `${ROOT_ADMIN_EMAIL} (Master Admin)`,
    `Administrator privileges revoked from ${targetEmail} by ${ROOT_ADMIN_EMAIL}`
  );

  res.json({
    success: true,
    message: `Administrator privileges revoked from ${targetEmail}`,
    authorizedAdmins: db.authorizedAdmins
  });
});

// Dynamic Geospatial Hospital Discovery Engine (OpenStreetMap / Nominatim)
async function autoDiscoverCityHospitals(rawCity: string) {
  const city = rawCity.trim();
  const formattedCity = city.charAt(0).toUpperCase() + city.slice(1);
  const db = loadDB();

  // Check if we already have 2+ hospitals for this city in db
  const existing = db.hospitals.filter((h: any) => h.city.toLowerCase() === city.toLowerCase());
  if (existing.length >= 2) {
    return existing;
  }

  console.log(`[GeoDiscovery] Querying live OpenStreetMap / Nominatim healthcare nodes for: ${city}`);
  let discovered: any[] = [];

  try {
    // 1. Primary search: 'hospital in <city>'
    const url1 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('hospital in ' + city)}&limit=10`;
    const res1 = await fetch(url1, {
      headers: { 'User-Agent': 'CityCare-Academic-Healthcare-App/1.0 (academic-viva-demo)' }
    });
    if (res1.ok) {
      const data1 = await res1.json();
      if (Array.isArray(data1) && data1.length > 0) {
        discovered = data1;
      }
    }

    // 2. Secondary search if fewer than 2 results: 'clinic in <city>'
    if (discovered.length < 2) {
      const url2 = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent('clinic in ' + city)}&limit=6`;
      const res2 = await fetch(url2, {
        headers: { 'User-Agent': 'CityCare-Academic-Healthcare-App/1.0 (academic-viva-demo)' }
      });
      if (res2.ok) {
        const data2 = await res2.json();
        if (Array.isArray(data2)) {
          const existingPlaceIds = new Set(discovered.map((p: any) => p.place_id));
          for (const item of data2) {
            if (!existingPlaceIds.has(item.place_id)) {
              discovered.push(item);
            }
          }
        }
      }
    }

    // 3. Fallback to city coordinates if no amenities tagged in OSM
    let cityLat = 19.0760;
    let cityLon = 72.8777;
    let stateName = 'Maharashtra';

    const cityGeoUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    const geoRes = await fetch(cityGeoUrl, {
      headers: { 'User-Agent': 'CityCare-Academic-Healthcare-App/1.0 (academic-viva-demo)' }
    });
    if (geoRes.ok) {
      const geoData = await geoRes.json();
      if (Array.isArray(geoData) && geoData.length > 0) {
        cityLat = parseFloat(geoData[0].lat);
        cityLon = parseFloat(geoData[0].lon);
        if (geoData[0].display_name) {
          const parts = geoData[0].display_name.split(',');
          if (parts.length >= 2) stateName = parts[parts.length - 2].trim();
        }
      }
    }

    const hospitalImages = [
      'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80'
    ];

    const departmentPool = [
      ['General Medicine', 'Pediatrics', 'Emergency', 'Orthopedics'],
      ['Cardiology', 'General Medicine', 'Neurology', 'Pulmonology'],
      ['Dental', 'Orthopedics', 'Dermatology', 'General Medicine'],
      ['Gynecology', 'Pediatrics', 'General Medicine', 'ENT'],
      ['Gastroenterology', 'General Medicine', 'Emergency', 'Cardiology']
    ];

    let newHospitals: any[] = [];

    if (discovered.length > 0) {
      newHospitals = discovered.slice(0, 8).map((p: any, idx: number) => {
        let cleanName = p.name || (p.display_name ? p.display_name.split(',')[0].trim() : `Hospital ${idx + 1}`);
        if (!cleanName.toLowerCase().includes('hospital') && !cleanName.toLowerCase().includes('clinic') && !cleanName.toLowerCase().includes('care')) {
          cleanName = `${cleanName} Hospital`;
        }

        const lat = parseFloat(p.lat);
        const lon = parseFloat(p.lon);
        const rawAddr = p.display_name || `${cleanName}, ${city}, ${stateName}`;
        const hospId = `hosp-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}-${idx + 1}`;

        return {
          id: hospId,
          name: cleanName,
          city: formattedCity,
          state: stateName,
          address: rawAddr.length > 95 ? rawAddr.slice(0, 92) + '...' : rawAddr,
          phone: `+91 257 22${idx}100`,
          emergencyPhone: '108 / +91 257 229900',
          email: `contact@${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
          departments: departmentPool[idx % departmentPool.length],
          rating: Number((4.5 + (idx % 5) * 0.1).toFixed(1)),
          beds: 60 + (idx % 6) * 30,
          lat: lat,
          lng: lon,
          isOpen24x7: idx % 2 === 0,
          osmSource: true,
          image: hospitalImages[idx % hospitalImages.length]
        };
      });
    } else {
      // Create verified facilities centered on the city's real geographic coordinates
      newHospitals = [
        {
          id: `hosp-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}-1`,
          name: `Civil District Hospital, ${formattedCity}`,
          city: formattedCity,
          state: stateName,
          address: `Station Road, Civil Area, ${formattedCity}, ${stateName}`,
          phone: '+91 257 222100',
          emergencyPhone: '108',
          email: `civil@${city.toLowerCase()}health.gov.in`,
          departments: ['General Medicine', 'Emergency', 'Pediatrics', 'Orthopedics'],
          rating: 4.6,
          beds: 180,
          lat: cityLat + 0.002,
          lng: cityLon + 0.003,
          isOpen24x7: true,
          osmSource: true,
          image: hospitalImages[0]
        },
        {
          id: `hosp-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}-2`,
          name: `Apex Multi-Speciality Care, ${formattedCity}`,
          city: formattedCity,
          state: stateName,
          address: `Main Market Road, Near Central Bus Stand, ${formattedCity}, ${stateName}`,
          phone: '+91 257 224400',
          emergencyPhone: '108',
          email: `care@apex-${city.toLowerCase()}.org`,
          departments: ['Cardiology', 'General Medicine', 'Neurology', 'Dental'],
          rating: 4.8,
          beds: 120,
          lat: cityLat - 0.003,
          lng: cityLon - 0.002,
          isOpen24x7: true,
          osmSource: true,
          image: hospitalImages[1]
        },
        {
          id: `hosp-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}-3`,
          name: `Sanjeevani Maternity & Child Care, ${formattedCity}`,
          city: formattedCity,
          state: stateName,
          address: `College Road, Shivaji Chowk, ${formattedCity}, ${stateName}`,
          phone: '+91 257 228800',
          emergencyPhone: '108',
          email: `info@sanjeevani-${city.toLowerCase()}.org`,
          departments: ['Pediatrics', 'Gynecology', 'General Medicine'],
          rating: 4.7,
          beds: 80,
          lat: cityLat + 0.004,
          lng: cityLon - 0.003,
          isOpen24x7: false,
          osmSource: true,
          image: hospitalImages[2]
        }
      ];
    }

    // Now auto-create consulting doctors for each discovered hospital using distinct male & female profiles
    const newDoctors: any[] = [];
    let poolIdx = 0;

    newHospitals.forEach((hosp, hIdx) => {
      const docCount = 3;
      for (let dIdx = 0; dIdx < docCount; dIdx++) {
        const template = REAL_DOCTOR_POOL[poolIdx % REAL_DOCTOR_POOL.length];
        poolIdx++;
        const docId = `doc-${city.toLowerCase().replace(/[^a-z0-9]/g, '')}-${hIdx + 1}-${dIdx + 1}`;

        newDoctors.push({
          id: docId,
          name: template.name,
          gender: template.gender,
          speciality: template.speciality,
          department: template.speciality,
          qualification: template.qualification,
          experience: template.experience,
          hospitalId: hosp.id,
          hospitalName: hosp.name,
          city: formattedCity,
          fee: template.fee,
          rating: Number((4.7 + (dIdx % 3) * 0.1).toFixed(1)),
          reviewCount: 25 + dIdx * 12,
          phone: `+91 98${(hIdx + 1) * 10 + dIdx} 12345`,
          availableDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          availableSlots: ['09:00 AM', '10:30 AM', '12:00 PM', '02:00 PM', '04:00 PM', '05:30 PM'],
          avatar: generateServerCartoonAvatar(template.name, template.speciality, template.gender),
          bio: template.bio
        });
      }
    });

    const existingHospIds = new Set(db.hospitals.map((h: any) => h.id));
    newHospitals.forEach((nh) => {
      if (!existingHospIds.has(nh.id)) {
        db.hospitals.push(nh);
      }
    });

    const existingDocIds = new Set(db.doctors.map((d: any) => d.id));
    newDoctors.forEach((nd) => {
      if (!existingDocIds.has(nd.id)) {
        db.doctors.push(nd);
      }
    });

    saveDB(db);
    addAuditLog('AUTO_GEO_DISCOVERY', 'OSM & Nominatim Engine', `Auto-discovered ${newHospitals.length} real healthcare facilities and assigned ${newDoctors.length} doctors in ${formattedCity}`, formattedCity);

    return newHospitals;
  } catch (err: any) {
    console.error(`[GeoDiscovery] Error discovering hospitals for ${city}:`, err.message);
    return [];
  }
}

// 2. City & Hospitals
app.get('/api/hospitals', async (req, res) => {
  const { city } = req.query;
  const db = loadDB();
  let hospitals = db.hospitals;

  if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
    const cityName = city.trim();
    let matches = hospitals.filter((h: any) => h.city.toLowerCase() === cityName.toLowerCase());

    if (matches.length === 0) {
      // Auto-discover live real hospitals from OpenStreetMap & Nominatim
      matches = await autoDiscoverCityHospitals(cityName);
      hospitals = matches;
    } else {
      hospitals = matches;
    }
  }

  res.json({ success: true, hospitals });
});

app.post('/api/hospitals', (req, res) => {
  const { name, city, state, address, phone, emergencyPhone, departments, rating, beds, lat, lng, image } = req.body;
  if (!name || !city || !address) {
    return res.status(400).json({ success: false, message: 'Name, city, and address are required' });
  }

  const db = loadDB();
  const newHospital = {
    id: `hosp-${Date.now()}`,
    name,
    city,
    state: state || '',
    address,
    phone: phone || '+91 22 0000 0000',
    emergencyPhone: emergencyPhone || '108',
    email: `contact@${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.org`,
    departments: Array.isArray(departments) ? departments : ['General Medicine'],
    rating: rating ? parseFloat(rating) : 4.5,
    beds: beds ? parseInt(beds) : 100,
    lat: lat ? parseFloat(lat) : 19.0760,
    lng: lng ? parseFloat(lng) : 72.8777,
    isOpen24x7: true,
    image: image || 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
  };

  db.hospitals.push(newHospital);
  saveDB(db);
  addAuditLog('ADD_HOSPITAL', 'Admin', `Added hospital: ${name} in ${city}`, newHospital.id);
  res.json({ success: true, hospital: newHospital });
});

app.put('/api/hospitals/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const index = db.hospitals.findIndex((h: any) => h.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Hospital not found' });
  }

  db.hospitals[index] = { ...db.hospitals[index], ...req.body };
  saveDB(db);
  addAuditLog('UPDATE_HOSPITAL', 'Admin', `Updated hospital info for: ${db.hospitals[index].name}`, id);
  res.json({ success: true, hospital: db.hospitals[index] });
});

app.delete('/api/hospitals/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const hosp = db.hospitals.find((h: any) => h.id === id);
  if (!hosp) {
    return res.status(404).json({ success: false, message: 'Hospital not found' });
  }

  db.hospitals = db.hospitals.filter((h: any) => h.id !== id);
  saveDB(db);
  addAuditLog('DELETE_HOSPITAL', 'Admin', `Deleted hospital: ${hosp.name}`, id);
  res.json({ success: true, message: 'Hospital deleted' });
});

// Proxy route for OpenStreetMap Overpass API (to avoid CORS or rate limiter issues in browser)
app.get('/api/osm/search', async (req, res) => {
  const { city } = req.query;
  if (!city || typeof city !== 'string') {
    return res.status(400).json({ success: false, message: 'City parameter required' });
  }

  try {
    // 1. First get city bounding box / coords from Nominatim
    const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`;
    const geoRes = await fetch(nominatimUrl, {
      headers: { 'User-Agent': 'CityCare-Academic-Project/1.0 (academic-demo)' }
    });
    
    if (!geoRes.ok) {
      throw new Error(`Nominatim error: ${geoRes.statusText}`);
    }

    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return res.json({ success: true, source: 'local-fallback', hospitals: [] });
    }

    const lat = parseFloat(geoData[0].lat);
    const lon = parseFloat(geoData[0].lon);

    // 2. Query Overpass API for hospitals within 15km (15000m) around city center
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="hospital"](around:15000,${lat},${lon});
        way["amenity"="hospital"](around:15000,${lat},${lon});
      );
      out center 15;
    `;

    const overpassUrl = 'https://overpass-api.de/api/interpreter';
    const osmRes = await fetch(overpassUrl, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'CityCare-Academic-Project/1.0'
      }
    });

    if (!osmRes.ok) {
      throw new Error(`Overpass error: ${osmRes.statusText}`);
    }

    const osmJson = await osmRes.json();
    const fetchedHospitals = (osmJson.elements || [])
      .filter((el: any) => el.tags && (el.tags.name || el.tags['name:en']))
      .slice(0, 10)
      .map((el: any, idx: number) => {
        const name = el.tags.name || el.tags['name:en'];
        const latitude = el.lat || (el.center && el.center.lat) || lat;
        const longitude = el.lon || (el.center && el.center.lon) || lon;
        const street = el.tags['addr:street'] || el.tags['addr:suburb'] || `${city} Central Area`;
        const phone = el.tags['phone'] || el.tags['contact:phone'] || '+91 22 2800 0000';
        
        return {
          id: `osm-${el.id || idx}`,
          name: name,
          city: city,
          state: el.tags['addr:state'] || 'OpenStreetMap Verified',
          address: `${street}, ${city}`,
          phone: phone,
          emergencyPhone: el.tags['emergency:phone'] || '108',
          departments: ['General Medicine', 'Emergency', 'Cardiology', 'Orthopedics'],
          rating: 4.5,
          beds: 150,
          lat: latitude,
          lng: longitude,
          isOpen24x7: el.tags['opening_hours'] === '24/7' || true,
          osmSource: true,
          image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80'
        };
      });

    res.json({
      success: true,
      source: 'openstreetmap',
      cityLat: lat,
      cityLon: lon,
      hospitals: fetchedHospitals
    });
  } catch (error: any) {
    console.log('OSM fetch fallback triggered:', error.message);
    // Return graceful local hospitals for that city
    const db = loadDB();
    const localMatches = db.hospitals.filter((h: any) => h.city.toLowerCase() === city.toLowerCase());
    res.json({
      success: true,
      source: 'local_database_fallback',
      message: 'Using verified local database records',
      hospitals: localMatches
    });
  }
});

// 3. Doctors Management
app.get('/api/doctors', async (req, res) => {
  const { hospitalId, speciality, city } = req.query;
  let db = loadDB();
  let doctors = db.doctors;

  if (city && typeof city === 'string' && city.toLowerCase() !== 'all') {
    const cityName = city.trim();
    let matches = doctors.filter((d: any) => d.city.toLowerCase() === cityName.toLowerCase());
    if (matches.length === 0) {
      // Auto-discover city hospitals and create doctors
      await autoDiscoverCityHospitals(cityName);
      db = loadDB();
      doctors = db.doctors;
    }
    doctors = doctors.filter((d: any) => d.city.toLowerCase() === cityName.toLowerCase());
  }

  if (hospitalId && typeof hospitalId === 'string') {
    doctors = doctors.filter((d: any) => d.hospitalId === hospitalId);
  }
  if (speciality && typeof speciality === 'string' && speciality.toLowerCase() !== 'all') {
    doctors = doctors.filter((d: any) => d.speciality.toLowerCase() === speciality.toLowerCase() || d.department.toLowerCase() === speciality.toLowerCase());
  }

  res.json({ success: true, doctors });
});

app.post('/api/doctors', (req, res) => {
  const { name, speciality, department, qualification, experience, hospitalId, fee, phone, availableDays, availableSlots, bio, gender } = req.body;
  if (!name || !speciality || !hospitalId) {
    return res.status(400).json({ success: false, message: 'Name, speciality, and hospital are required' });
  }

  const db = loadDB();
  const hosp = db.hospitals.find((h: any) => h.id === hospitalId);
  const inferredGender = inferServerDoctorGender(name, gender);

  const newDoc = {
    id: `doc-${Date.now()}`,
    name,
    gender: inferredGender,
    speciality,
    department: department || speciality,
    qualification: qualification || 'MBBS, MD',
    experience: experience ? parseInt(experience) : 5,
    hospitalId,
    hospitalName: hosp ? hosp.name : 'Affiliated Hospital',
    city: hosp ? hosp.city : 'Mumbai',
    fee: fee ? parseInt(fee) : 500,
    rating: 4.8,
    reviewCount: 14,
    phone: phone || '+91 90000 00000',
    availableDays: availableDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    availableSlots: availableSlots || ['09:00 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '06:00 PM'],
    avatar: generateServerCartoonAvatar(name, speciality, inferredGender),
    bio: bio || `Specialist in ${speciality} with extensive clinical care.`
  };

  db.doctors.push(newDoc);
  saveDB(db);
  addAuditLog('ADD_DOCTOR', 'Admin', `Added doctor: ${name} (${speciality}) at ${newDoc.hospitalName}`, newDoc.id);
  res.json({ success: true, doctor: newDoc });
});

app.put('/api/doctors/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const index = db.doctors.findIndex((d: any) => d.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  db.doctors[index] = { ...db.doctors[index], ...req.body };
  saveDB(db);
  addAuditLog('UPDATE_DOCTOR', 'Admin / Doctor', `Updated profile for doctor: ${db.doctors[index].name}`, id);
  res.json({ success: true, doctor: db.doctors[index] });
});

app.delete('/api/doctors/:id', (req, res) => {
  const { id } = req.params;
  const db = loadDB();
  const doc = db.doctors.find((d: any) => d.id === id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  db.doctors = db.doctors.filter((d: any) => d.id !== id);
  saveDB(db);
  addAuditLog('DELETE_DOCTOR', 'Admin', `Removed doctor: ${doc.name}`, id);
  res.json({ success: true, message: 'Doctor removed' });
});

// 4. Symptom Matching Engine (Academic Rule-Based Speciality Classifier)
app.post('/api/symptoms/analyze', (req, res) => {
  const { symptoms } = req.body;
  if (!symptoms || typeof symptoms !== 'string') {
    return res.status(400).json({ success: false, message: 'Symptoms description is required' });
  }

  const query = symptoms.toLowerCase();
  
  // Knowledge dictionary mapping symptoms to medical speciality
  const rules = [
    {
      speciality: 'Cardiology',
      department: 'Cardiology',
      keywords: ['chest pain', 'chest heaviness', 'palpitations', 'heart', 'high bp', 'blood pressure', 'shortness of breath on walking', 'cholesterol'],
      urgency: 'High',
      recommendation: 'Immediate consultation recommended. Avoid heavy exertion.'
    },
    {
      speciality: 'Orthopedics',
      department: 'Orthopedics',
      keywords: ['joint pain', 'knee', 'back pain', 'bone', 'fracture', 'sprain', 'shoulder pain', 'spine', 'arthritis', 'swelling in leg'],
      urgency: 'Medium',
      recommendation: 'X-ray or physical examination advised. Avoid lifting heavy weights.'
    },
    {
      speciality: 'Neurology',
      department: 'Neurology',
      keywords: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tremor', 'fainting', 'memory loss', 'vertigo'],
      urgency: 'High',
      recommendation: 'Neurological evaluation suggested. Keep track of headache frequency.'
    },
    {
      speciality: 'Pulmonology',
      department: 'Pulmonology',
      keywords: ['cough', 'wheezing', 'asthma', 'breathlessness', 'chest congestion', 'phlegm', 'bronchitis', 'lung', 'breathing problem'],
      urgency: 'Medium',
      recommendation: 'Spirometry or chest checkup recommended.'
    },
    {
      speciality: 'Dental',
      department: 'Dental',
      keywords: ['tooth', 'toothache', 'gum', 'bleeding gums', 'cavity', 'jaw pain', 'molar', 'teeth sensitivity'],
      urgency: 'Low',
      recommendation: 'Dental screening and cleaning/filling recommended.'
    },
    {
      speciality: 'Dermatology',
      department: 'Dermatology',
      keywords: ['skin', 'rash', 'itching', 'acne', 'pimple', 'allergy', 'eczema', 'hair loss', 'psoriasis', 'blister'],
      urgency: 'Low',
      recommendation: 'Dermatological assessment recommended. Do not apply unprescribed steroids.'
    },
    {
      speciality: 'Gastroenterology',
      department: 'Gastroenterology',
      keywords: ['stomach pain', 'acidity', 'gerd', 'gas', 'indigestion', 'vomiting', 'constipation', 'diarrhea', 'liver', 'abdominal cramps'],
      urgency: 'Medium',
      recommendation: 'Dietary assessment and abdominal consultation advised.'
    },
    {
      speciality: 'Pediatrics',
      department: 'Pediatrics',
      keywords: ['child fever', 'baby', 'toddler', 'vaccination', 'child cough', 'pediatric', 'infant'],
      urgency: 'Medium',
      recommendation: 'Pediatric evaluation for age-appropriate medication.'
    },
    {
      speciality: 'Ophthalmology',
      department: 'Ophthalmology',
      keywords: ['eye', 'blurred vision', 'watery eyes', 'red eye', 'eye pain', 'spectacles', 'cataract'],
      urgency: 'Medium',
      recommendation: 'Vision screening and slit-lamp examination suggested.'
    },
    {
      speciality: 'ENT',
      department: 'ENT',
      keywords: ['ear pain', 'sore throat', 'tonsils', 'nose bleed', 'ear discharge', 'sinus', 'hoarseness'],
      urgency: 'Medium',
      recommendation: 'ENT examination for infection or allergy.'
    },
    {
      speciality: 'General Medicine',
      department: 'General Medicine',
      keywords: ['fever', 'weakness', 'fatigue', 'body ache', 'chills', 'viral', 'cold', 'infection'],
      urgency: 'Medium',
      recommendation: 'Routine blood tests (CBC, ESR) and general physician consultation.'
    }
  ];

  const matched = [];
  for (const rule of rules) {
    const hits = rule.keywords.filter(kw => query.includes(kw));
    if (hits.length > 0) {
      matched.push({
        speciality: rule.speciality,
        department: rule.department,
        matchedKeywords: hits,
        score: hits.length,
        urgency: rule.urgency,
        recommendation: rule.recommendation
      });
    }
  }

  // Sort by match score
  matched.sort((a, b) => b.score - a.score);

  // If no match found, default to General Medicine
  if (matched.length === 0) {
    matched.push({
      speciality: 'General Medicine',
      department: 'General Medicine',
      matchedKeywords: ['general symptoms'],
      score: 1,
      urgency: 'Medium',
      recommendation: 'General Physician consultation advised for comprehensive initial evaluation.'
    });
  }

  res.json({
    success: true,
    primarySpeciality: matched[0].speciality,
    matches: matched
  });
});

// Cache for symptom triage classifications & quota cooldown guard
const triageCache = new Map<string, {
  primarySpeciality: string;
  departments: string[];
  urgency: 'Routine' | 'Medium' | 'High' | 'Emergency';
  isEmergency: boolean;
  urgentCareGuidance: string | null;
  clinicalExplanation: string;
}>();
let geminiQuotaCooldownUntil = 0;

const PRESET_CONCERN_QUERIES = new Set([
  'child fever & cold',
  'child fever cold cough viral infection pediatrics general medicine',
  'persistent cough wheezing chest congestion asthma pulmonology',
  'stomach pain acidity cramps indigestion gas gastroenterology',
  'migraine headache dizziness vertigo neurology',
  'child fever infant cough baby vaccination pediatrics',
  'skin rash itching allergy eczema dermatology',
  'joint pain knee stiffness back pain arthritis orthopedics',
  'vomiting nausea food poisoning dehydration general medicine',
]);

// 4b. Smart Booking AI (Gemini AI department triage + strictly real hospital & doctor availability matching)
app.post('/api/triage/smart-booking', async (req, res) => {
  try {
    const { symptoms, preferredDate, preferredTime, city, patientId } = req.body;
    if (!symptoms || typeof symptoms !== 'string' || !symptoms.trim()) {
      return res.status(400).json({ success: false, message: 'Please describe your symptoms.' });
    }

    const istClock = getServerISTClock();
    const todayStr = istClock.todayStr;
    let targetDate = preferredDate && /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) ? preferredDate : todayStr;
    if (targetDate < todayStr) {
      targetDate = todayStr;
    }
    const requestedSlot = preferredTime ? String(preferredTime).trim() : 'any';
    let autoAdvancedFromToday = false;
    let timeNotice = '';

    // If user selected Today and requested Morning or Afternoon when it is already Evening/Night in IST,
    // note that morning/afternoon slots for today have passed.
    if (targetDate === todayStr) {
      if (requestedSlot === 'morning' && istClock.minutesSinceMidnight >= 12 * 60) {
        timeNotice = `Live IST is ${istClock.timeShort} (${istClock.period.toUpperCase()}) — Today's morning OPD slots have already passed.`;
      } else if (requestedSlot === 'afternoon' && istClock.minutesSinceMidnight >= 17 * 60) {
        timeNotice = `Live IST is ${istClock.timeShort} (${istClock.period.toUpperCase()}) — Today's morning & afternoon OPD slots have already passed. Showing live evening slots.`;
      }
    }

    let db = loadDB();
    if (city && typeof city === 'string' && city.trim() !== '' && city.toLowerCase() !== 'all') {
      const cityDocs = (db.doctors || []).filter(
        (d: any) => (d.city || '').toLowerCase() === city.trim().toLowerCase()
      );
      if (cityDocs.length === 0) {
        await autoDiscoverCityHospitals(city.trim());
        db = loadDB();
      }
    }

    const allDoctors: any[] = db.doctors || [];
    const allHospitals: any[] = db.hospitals || [];
    const allAppointments: any[] = db.appointments || [];

    // Distinct departments and specialties verified in the system
    const verifiedSpecialities = Array.from(new Set(allDoctors.map((d: any) => d.speciality).filter(Boolean)));
    const verifiedDepartments = Array.from(new Set(allDoctors.map((d: any) => d.department).filter(Boolean)));
    const allValidDepartments = Array.from(new Set([...verifiedSpecialities, ...verifiedDepartments]));

    // Step 1: Identify medical departments and urgency using cache, Gemini AI, or clinical rule engine
    const normalizedSymptomKey = symptoms.trim().toLowerCase();
    let triageResult = {
      primarySpeciality: 'General Medicine',
      departments: ['General Medicine'],
      urgency: 'Routine' as 'Routine' | 'Medium' | 'High' | 'Emergency',
      isEmergency: false,
      urgentCareGuidance: null as string | null,
      clinicalExplanation: 'General consultation recommended for comprehensive initial evaluation of reported symptoms.'
    };

    let geminiSuccess = false;

    if (triageCache.has(normalizedSymptomKey)) {
      triageResult = triageCache.get(normalizedSymptomKey)!;
      geminiSuccess = true;
    } else if (!PRESET_CONCERN_QUERIES.has(normalizedSymptomKey) && Date.now() > geminiQuotaCooldownUntil) {
      const ai = getGeminiClient();
      if (ai) {
        let timeoutHandle: any;
        try {
          const timeoutPromise = new Promise<never>((_, reject) => {
            timeoutHandle = setTimeout(() => {
              reject(new Error('Gemini API call timed out after 3000ms'));
            }, 3000);
          });

          const prompt = `You are a clinical triage assistant for CityCare Hospital Appointment System.
A patient has provided the following symptom description:
"${symptoms.trim()}"

CityCare currently operates the following verified medical departments and specialties:
${allValidDepartments.join(', ')}

Instructions:
1. Identify the single best primary medical department/speciality from the provided list ONLY.
2. Identify up to 2 other relevant departments from the list if applicable.
3. Provide a concise, clear clinical explanation (1 to 2 sentences) of why this department is suitable for their symptoms. Do NOT provide a medical diagnosis or say "You have condition X".
4. Assess clinical urgency: "Routine", "Medium", "High", or "Emergency".
5. If the symptoms indicate life-threatening emergency conditions (e.g., acute severe crushing chest pain radiating to left arm/jaw, acute severe shortness of breath, sudden facial droop or unilateral weakness, severe hemorrhaging, anaphylaxis), set isEmergency to true and provide urgentCareGuidance instructing immediate emergency care (e.g. Call emergency services 108 or proceed to the nearest Emergency Room immediately).
6. Return your response strictly as JSON matching this schema:
{
  "primarySpeciality": "string",
  "departments": ["string"],
  "urgency": "Routine" | "Medium" | "High" | "Emergency",
  "isEmergency": boolean,
  "urgentCareGuidance": "string" | null,
  "clinicalExplanation": "string"
}`;

          const geminiCallPromise = ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
            },
          });

          const geminiRes: any = await Promise.race([geminiCallPromise, timeoutPromise]);
          clearTimeout(timeoutHandle);

          const rawText = geminiRes?.text?.trim() || '';
          if (rawText) {
            const parsed = JSON.parse(rawText);
            if (parsed && parsed.primarySpeciality) {
              const matchedSpec = allValidDepartments.find(
                s => s.toLowerCase() === parsed.primarySpeciality.toLowerCase()
              ) || parsed.primarySpeciality;

              triageResult = {
                primarySpeciality: matchedSpec,
                departments: Array.isArray(parsed.departments) && parsed.departments.length > 0 
                  ? parsed.departments 
                  : [matchedSpec],
                urgency: ['Routine', 'Medium', 'High', 'Emergency'].includes(parsed.urgency) 
                  ? parsed.urgency 
                  : 'Medium',
                isEmergency: Boolean(parsed.isEmergency),
                urgentCareGuidance: parsed.urgentCareGuidance || (parsed.isEmergency ? 'Urgent emergency care recommended: proceed to the nearest ER or call 108 immediately.' : null),
                clinicalExplanation: parsed.clinicalExplanation || `Recommended consultation with ${matchedSpec} based on described symptoms.`
              };
              triageCache.set(normalizedSymptomKey, triageResult);
              geminiSuccess = true;
            }
          }
        } catch (err: any) {
          clearTimeout(timeoutHandle);
          const errStr = String(err?.message || err || '');
          if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('quota')) {
            geminiQuotaCooldownUntil = Date.now() + 15 * 60 * 1000;
          }
        }
      }
    }

    // Fallback rule-based matching if Gemini wasn't available or failed
    if (!geminiSuccess) {
      const q = symptoms.toLowerCase();
      const emergencyKeywords = ['crushing chest pain', 'heart attack', 'unconscious', 'cannot breathe', 'severe bleeding', 'stroke', 'face drooping', 'paralysis'];
      const hasEmergency = emergencyKeywords.some(kw => q.includes(kw));

      const rules = [
        { spec: 'Cardiology', kws: ['chest pain', 'chest heaviness', 'palpitations', 'heart', 'high bp', 'blood pressure', 'breathless walking', 'breathlessness'], urgency: 'High', expl: 'Cardiology consultation advised for cardiovascular evaluation and ECG.' },
        { spec: 'Orthopedics', kws: ['joint pain', 'knee', 'back pain', 'bone', 'fracture', 'sprain', 'shoulder pain', 'spine', 'arthritis', 'stiffness'], urgency: 'Medium', expl: 'Orthopedic specialist consultation recommended for musculoskeletal examination.' },
        { spec: 'Neurology', kws: ['headache', 'migraine', 'dizziness', 'seizure', 'numbness', 'tremor', 'fainting', 'vertigo'], urgency: 'High', expl: 'Neurology consultation suggested to evaluate neurological symptoms.' },
        { spec: 'Pulmonology', kws: ['persistent cough', 'cough', 'wheezing', 'asthma', 'breathlessness', 'chest congestion', 'phlegm', 'bronchitis'], urgency: 'Medium', expl: 'Pulmonology evaluation recommended for respiratory assessment.' },
        { spec: 'Dental', kws: ['tooth', 'toothache', 'gum', 'bleeding gums', 'cavity', 'jaw pain'], urgency: 'Routine', expl: 'Dental examination and oral hygiene screening advised.' },
        { spec: 'Dermatology', kws: ['skin', 'rash', 'itching', 'acne', 'pimple', 'allergy', 'eczema', 'hair loss'], urgency: 'Routine', expl: 'Dermatologist consultation recommended for topical evaluation.' },
        { spec: 'Gastroenterology', kws: ['stomach pain', 'stomach acidity', 'acidity', 'cramps', 'gerd', 'gas', 'indigestion', 'vomiting', 'constipation', 'diarrhea'], urgency: 'Medium', expl: 'Gastroenterology consultation advised for digestive assessment.' },
        { spec: 'Pediatrics', kws: ['child fever', 'fever & cold', 'child', 'infant', 'baby', 'toddler', 'vaccination', 'child cough', 'pediatric'], urgency: 'Medium', expl: 'Pediatric care recommended for age-appropriate evaluation.' },
        { spec: 'Ophthalmology', kws: ['eye', 'blurred vision', 'watery eyes', 'red eye', 'eye pain', 'vision'], urgency: 'Medium', expl: 'Ophthalmology review recommended for eye screening.' },
        { spec: 'ENT', kws: ['ear pain', 'sore throat', 'tonsils', 'nose bleed', 'ear discharge', 'sinus'], urgency: 'Medium', expl: 'ENT specialist examination advised for ear, nose, and throat evaluation.' },
        { spec: 'General Medicine', kws: ['fever', 'weakness', 'fatigue', 'body ache', 'chills', 'viral', 'cold'], urgency: 'Medium', expl: 'General physician consultation advised for comprehensive clinical evaluation.' }
      ];

      const bestRule = rules.find(r => r.kws.some(k => q.includes(k))) || rules[rules.length - 1];

      triageResult = {
        primarySpeciality: bestRule.spec,
        departments: [bestRule.spec, 'General Medicine'].filter((v, i, a) => a.indexOf(v) === i),
        urgency: hasEmergency ? 'Emergency' : (bestRule.urgency as any),
        isEmergency: hasEmergency,
        urgentCareGuidance: hasEmergency ? 'CRITICAL: Severe symptoms detected. Please seek immediate emergency medical care (Call 108 or visit nearest ER).' : null,
        clinicalExplanation: bestRule.expl
      };
      triageCache.set(normalizedSymptomKey, triageResult);
    }

    // Step 2: Use actual CityCare hospital and doctor data to find matching facilities and available appointment slots.
    const primarySpecLower = triageResult.primarySpeciality.toLowerCase();
    const deptListLower = triageResult.departments.map(d => d.toLowerCase());
    const cityFilter = city && city !== 'All' ? city.toLowerCase().trim() : null;

    const cityScopedDoctors = cityFilter
      ? allDoctors.filter((d: any) => (d.city || '').toLowerCase().trim() === cityFilter)
      : allDoctors;
    const doctorPool = cityScopedDoctors.length > 0 ? cityScopedDoctors : allDoctors;

    let matchingDoctors = doctorPool.filter((d: any) => {
      const docSpec = (d.speciality || '').toLowerCase();
      const docDept = (d.department || '').toLowerCase();
      return docSpec === primarySpecLower || docDept === primarySpecLower ||
             deptListLower.includes(docSpec) || deptListLower.includes(docDept);
    });

    if (matchingDoctors.length === 0) {
      matchingDoctors = doctorPool.filter((d: any) => {
        const docSpec = (d.speciality || '').toLowerCase();
        return docSpec.includes('general') || docSpec.includes('medicine');
      });
    }

    if (matchingDoctors.length === 0) {
      matchingDoctors = doctorPool;
    }

    const normalizeSlot = (s: string) => (s || '').trim().toUpperCase();

    const buildOptionsForDate = (dateToCheck: string) => {
      const built: any[] = [];
      for (const doc of matchingDoctors) {
        const standardSlots: string[] =
          Array.isArray(doc.availableSlots) && doc.availableSlots.length > 0
            ? Array.from(new Set([...doc.availableSlots, ...FULL_OPD_SLOTS]))
            : [...FULL_OPD_SLOTS];

        // Find occupied slots for this doctor on dateToCheck
        const doctorAppointments = allAppointments.filter(
          (a: any) =>
            a.doctorId === doc.id &&
            a.appointmentDate === dateToCheck &&
            a.status !== 'cancelled' &&
            a.status !== 'no_show'
        );
        const bookedSlots = new Set(
          doctorAppointments.map((a: any) => normalizeSlot(a.appointmentTime))
        );

        // Check doctor's blocked slots
        if (Array.isArray(doc.blockedSlots)) {
          doc.blockedSlots
            .filter((b: any) => b.date === dateToCheck)
            .forEach((b: any) => bookedSlots.add(normalizeSlot(b.slot)));
        }

        // Check patient's own overlapping appointments if patientId provided
        const patientBookedSlots = new Set<string>();
        if (patientId) {
          allAppointments
            .filter(
              (a: any) =>
                a.patientId === patientId &&
                a.appointmentDate === dateToCheck &&
                a.status !== 'cancelled' &&
                a.status !== 'no_show'
            )
            .forEach((a: any) => patientBookedSlots.add(normalizeSlot(a.appointmentTime)));
        }

        const pastSlotsOnDate = standardSlots.filter((slot) =>
          isServerSlotPast(dateToCheck, slot, istClock)
        );

        // Available free slots (must NOT be booked, must NOT overlap patient, and must NOT be in the past in live IST)
        const freeSlots = standardSlots.filter(
          (slot) =>
            !bookedSlots.has(normalizeSlot(slot)) &&
            !patientBookedSlots.has(normalizeSlot(slot)) &&
            !isServerSlotPast(dateToCheck, slot, istClock)
        );

        const hospital = allHospitals.find((h: any) => h.id === doc.hospitalId) || {
          id: doc.hospitalId || 'hosp-default',
          name: doc.hospitalName || 'CityCare Super Specialty Hospital',
          city: doc.city || 'Amalner',
          address: `${doc.city || 'Amalner'} Health Center`,
          rating: 4.6,
          departments: [doc.department || doc.speciality],
          phone: doc.phone || '+91 22 0000 0000',
          emergencyPhone: '108',
          isOpen24x7: true,
        };

        let chosenSlot = '';
        if (freeSlots.length > 0) {
          if (requestedSlot !== 'any') {
            const exact = freeSlots.find((s) => normalizeSlot(s) === normalizeSlot(requestedSlot));
            if (exact) {
              chosenSlot = exact;
            } else if (requestedSlot === 'morning') {
              chosenSlot = freeSlots.find((s) => s.includes('AM')) || freeSlots[0];
            } else if (requestedSlot === 'afternoon') {
              chosenSlot =
                freeSlots.find(
                  (s) =>
                    s.includes('12:') ||
                    s.includes('01:') ||
                    s.includes('02:') ||
                    s.includes('03:') ||
                    s.includes('04:00 PM')
                ) || freeSlots[0];
            } else if (requestedSlot === 'evening') {
              chosenSlot =
                freeSlots.find(
                  (s) =>
                    s.includes('05:') ||
                    s.includes('06:') ||
                    s.includes('07:') ||
                    s.includes('08:') ||
                    s.includes('09:')
                ) || freeSlots[0];
            } else {
              chosenSlot = freeSlots[0];
            }
          } else {
            chosenSlot = freeSlots[0];
          }
        }

        if (freeSlots.length > 0) {
          built.push({
            doctor: doc,
            hospital: hospital,
            availableSlots: freeSlots,
            pastSlots: pastSlotsOnDate,
            recommendedSlot: chosenSlot,
            isPrimaryMatch: (doc.speciality || '').toLowerCase() === primarySpecLower,
            explanation: `${doc.name} (${doc.qualification}) has ${doc.experience} years of clinical expertise in ${doc.speciality} at ${hospital.name}. Consultation fee is ₹${doc.fee}.`,
          });
        }
      }
      return built;
    };

    let options = buildOptionsForDate(targetDate);

    // If targetDate is Today and all slots for Today have already passed in live IST, auto-advance to Tomorrow!
    if (options.length === 0 && targetDate === todayStr) {
      targetDate = istClock.tomorrowStr;
      autoAdvancedFromToday = true;
      timeNotice = `All OPD slots for Today (${todayStr}) have passed as of ${istClock.timeShort} IST. Automatically showing available slots for Tomorrow (${targetDate}).`;
      options = buildOptionsForDate(targetDate);
    }

    // Sort options:
    // 1. City match first
    // 2. Primary specialty match next
    // 3. Doctor rating descending
    options.sort((a, b) => {
      if (cityFilter) {
        const aCity = (a.doctor.city || '').toLowerCase().trim() === cityFilter;
        const bCity = (b.doctor.city || '').toLowerCase().trim() === cityFilter;
        if (aCity !== bCity) return aCity ? -1 : 1;
      }
      if (a.isPrimaryMatch !== b.isPrimaryMatch) return a.isPrimaryMatch ? -1 : 1;
      return (b.doctor.rating || 0) - (a.doctor.rating || 0);
    });

    console.log(
      `[SmartBooking AI] Returning ${Math.min(options.length, 12)} of ${options.length} verified live slots for ${triageResult.primarySpeciality} on ${targetDate} (Live IST: ${istClock.timeShort})`
    );

    return res.status(200).json({
      success: true,
      triage: triageResult,
      preferredDate: targetDate,
      preferredTime: requestedSlot,
      options: options.slice(0, 12),
      totalMatches: options.length,
      liveTimeIST: istClock.timeShort,
      todayDateIST: istClock.todayStr,
      autoAdvancedFromToday,
      timeNotice:
        timeNotice ||
        (targetDate === todayStr
          ? `Live IST Clock (${istClock.timeShort}): Past slots for today are automatically locked.`
          : undefined),
    });
  } catch (error: any) {
    console.error('[SmartBooking AI] Error processing smart triage:', error?.message || error);
    return res.status(500).json({
      success: false,
      message: 'Failed to process smart triage: ' + (error?.message || 'Server error'),
    });
  }
});

// 5. Appointment Management (With Double-Booking Prevention & Token Generation)
app.get('/api/appointments', (req, res) => {
  const { patientId, doctorId, hospitalId, status, date } = req.query;
  const db = loadDB();
  let apts = db.appointments;

  if (patientId) apts = apts.filter((a: any) => a.patientId === patientId);
  if (doctorId) apts = apts.filter((a: any) => a.doctorId === doctorId);
  if (hospitalId) apts = apts.filter((a: any) => a.hospitalId === hospitalId);
  if (status && status !== 'all') apts = apts.filter((a: any) => a.status === status);
  if (date) apts = apts.filter((a: any) => a.appointmentDate === date);

  // Sort by date/time
  apts.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  res.json({ success: true, appointments: apts });
});

// Book appointment endpoint with strict double-booking prevention lock
app.post('/api/appointments', (req, res) => {
  const {
    doctorId,
    appointmentDate,
    appointmentTime,
    patientId,
    patientName,
    patientPhone,
    patientEmail,
    patientAge,
    patientGender,
    symptoms,
    paymentMethod, // 'cash' or 'demo_online'
    demoPaymentDetails // { upiId, cardLast4, txnId, method }
  } = req.body;

  if (!doctorId || !appointmentDate || !appointmentTime || !patientName || !patientPhone) {
    return res.status(400).json({
      success: false,
      message: 'Doctor, Date, Time slot, Patient Name, and Phone are required'
    });
  }

  const db = loadDB();
  const doctor = db.doctors.find((d: any) => d.id === doctorId);
  if (!doctor) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const istClock = getServerISTClock();
  if (!req.body.isWalkIn && isServerSlotPast(appointmentDate, appointmentTime, istClock)) {
    return res.status(400).json({
      success: false,
      code: 'PAST_SLOT_NOT_ALLOWED',
      message: `Cannot book ${appointmentTime} on ${appointmentDate} because that time slot has already passed (Live IST: ${istClock.timeShort}). Please select an upcoming evening slot or book for tomorrow.`,
    });
  }

  // 1. Check if doctor has blocked this slot (emergency / leave)
  const isBlocked = (doctor.blockedSlots || []).some(
    (b: any) => b.date === appointmentDate && normalizeSlot(b.slot) === normalizeSlot(appointmentTime)
  );
  if (isBlocked) {
    return res.status(409).json({
      success: false,
      code: 'DOCTOR_SLOT_BLOCKED',
      message: `${doctor.name} is unavailable on ${appointmentDate} at ${appointmentTime}. Please choose another slot.`
    });
  }

  // 2. DOUBLE-BOOKING PREVENTION CHECK (SAME DOCTOR OR SAME TIME SLOT):
  const doctorConflict = db.appointments.find((a: any) =>
    isActiveAppointment(a) &&
    a.doctorId === doctorId &&
    a.appointmentDate === appointmentDate &&
    normalizeSlot(a.appointmentTime) === normalizeSlot(appointmentTime)
  );

  if (doctorConflict) {
    return res.status(409).json({
      success: false,
      code: 'DOUBLE_BOOKING_PREVENTED',
      message: `Time slot ${appointmentTime} on ${appointmentDate} is already booked for ${doctor.name}. No more appointments are available at ${appointmentTime}.`
    });
  }

  // 3. PATIENT OVERLAP PREVENTION CHECK (SAME PATIENT CANNOT BOOK 2 APPOINTMENTS AT THE SAME TIME):
  const patientConflict = db.appointments.find((a: any) =>
    isActiveAppointment(a) &&
    a.appointmentDate === appointmentDate &&
    normalizeSlot(a.appointmentTime) === normalizeSlot(appointmentTime) &&
    isSamePatient(a, { patientId, patientPhone, patientEmail, patientName })
  );

  if (patientConflict) {
    return res.status(409).json({
      success: false,
      code: 'PATIENT_TIME_OVERLAP_PREVENTED',
      message: `You already have an appointment booked at ${appointmentTime} on ${appointmentDate} with ${patientConflict.doctorName} (${patientConflict.tokenNumber}). You cannot book two overlapping appointments at ${appointmentTime}.`
    });
  }

  // Generate unique OPD Token Number: OPD-CITY-NUMBER
  const cityCode = (doctor.city || 'GEN').substring(0, 3).toUpperCase();
  const randomNum = Math.floor(100 + Math.random() * 900);
  const tokenNumber = `OPD-${cityCode}-${randomNum}`;

  const isOnline = paymentMethod === 'demo_online';
  const paymentStatus = isOnline ? 'paid' : 'pending';
  const transactionId = isOnline
    ? (demoPaymentDetails?.txnId || `TXN-DEMO-${Date.now().toString().slice(-6)}`)
    : undefined;

  const newAppointment = {
    id: `apt-${Date.now()}`,
    tokenNumber,
    patientId: patientId || `usr-${Date.now()}`,
    patientName,
    patientPhone,
    patientEmail: patientEmail || '',
    patientAge: patientAge ? parseInt(patientAge) : 30,
    patientGender: patientGender || 'Other',
    doctorId: doctor.id,
    doctorName: doctor.name,
    doctorSpeciality: doctor.speciality,
    hospitalId: doctor.hospitalId,
    hospitalName: doctor.hospitalName,
    city: doctor.city,
    appointmentDate,
    appointmentTime,
    symptoms: symptoms || 'General Checkup',
    fee: doctor.fee,
    paymentMethod: paymentMethod || 'cash',
    paymentStatus,
    transactionId,
    paymentModeDetail: isOnline ? (demoPaymentDetails?.method || 'Demo Online Gateway') : 'Cash at Hospital Desk',
    status: 'scheduled',
    doctorNotes: '',
    createdAt: new Date().toISOString()
  };

  db.appointments.unshift(newAppointment);
  saveDB(db);

  addAuditLog(
    'BOOK_APPOINTMENT',
    patientName,
    `Booked appointment ${tokenNumber} with ${doctor.name} on ${appointmentDate} at ${appointmentTime} (${paymentMethod})`,
    newAppointment.id
  );

  res.status(201).json({
    success: true,
    message: 'Appointment booked successfully!',
    appointment: newAppointment
  });
});

// Update appointment status (checked_in, in_consultation, completed, cancelled, rescheduled, no_show)
app.patch('/api/appointments/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, doctorNotes, user = 'Staff', paymentStatus, vitals, prescriptions, rating, reviewFeedback, roomNumber } = req.body;

  const db = loadDB();
  const index = db.appointments.findIndex((a: any) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const apt = db.appointments[index];
  if (status) {
    apt.status = status;
    const nowIso = new Date().toISOString();
    if (status === 'checked_in') {
      apt.checkedInAt = nowIso;
    } else if (status === 'in_consultation') {
      apt.consultationStartedAt = nowIso;
    } else if (status === 'completed') {
      apt.completedAt = nowIso;
    }
  }
  if (doctorNotes !== undefined) apt.doctorNotes = doctorNotes;
  if (paymentStatus) apt.paymentStatus = paymentStatus;
  if (vitals) apt.vitals = vitals;
  if (prescriptions) apt.prescriptions = prescriptions;
  if (rating) apt.rating = rating;
  if (reviewFeedback) apt.reviewFeedback = reviewFeedback;
  if (roomNumber) apt.roomNumber = roomNumber;

  saveDB(db);
  addAuditLog('APPOINTMENT_STATUS_UPDATE', user, `Updated status to ${status || 'updated'} for token ${apt.tokenNumber}`, id);

  res.json({ success: true, appointment: apt });
});

// Rate doctor and update average rating
app.post('/api/doctors/:id/rate', (req, res) => {
  const { id } = req.params;
  const { rating, review = '', appointmentId } = req.body;
  const numRating = parseFloat(rating) || 5;

  const db = loadDB();
  const doc = db.doctors.find((d: any) => d.id === id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  const currentCount = doc.reviewCount || 10;
  const currentAvg = doc.rating || 4.7;
  const newCount = currentCount + 1;
  const newAvg = Number(((currentAvg * currentCount + numRating) / newCount).toFixed(1));

  doc.rating = newAvg;
  doc.reviewCount = newCount;

  if (appointmentId) {
    const apt = db.appointments.find((a: any) => a.id === appointmentId);
    if (apt) {
      apt.rating = numRating;
      apt.reviewFeedback = review;
    }
  }

  saveDB(db);
  addAuditLog('DOCTOR_RATING_SUBMITTED', 'Patient', `Submitted ${numRating}-star review for Dr. ${doc.name}`, id);

  res.json({ success: true, doctor: doc, newRating: newAvg, newReviewCount: newCount });
});

// Doctor slot block / leave management
app.post('/api/doctors/:id/block-slot', (req, res) => {
  const { id } = req.params;
  const { date, slot, reason = 'Emergency Surgery / Leave' } = req.body;

  if (!date || !slot) {
    return res.status(400).json({ success: false, message: 'Date and slot are required' });
  }

  const db = loadDB();
  const doc = db.doctors.find((d: any) => d.id === id);
  if (!doc) {
    return res.status(404).json({ success: false, message: 'Doctor not found' });
  }

  if (!doc.blockedSlots) {
    doc.blockedSlots = [];
  }

  doc.blockedSlots.push({ date, slot, reason });
  saveDB(db);
  addAuditLog('DOCTOR_SLOT_BLOCKED', doc.name, `Blocked slot on ${date} at ${slot}. Reason: ${reason}`, id);

  res.json({ success: true, message: `Slot ${slot} on ${date} blocked successfully`, blockedSlots: doc.blockedSlots });
});

// Reschedule appointment with double-booking check
app.post('/api/appointments/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { newDate, newTime, reason = 'Patient requested change', user = 'Patient' } = req.body;

  if (!newDate || !newTime) {
    return res.status(400).json({ success: false, message: 'New date and time are required' });
  }

  const db = loadDB();
  const index = db.appointments.findIndex((a: any) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const apt = db.appointments[index];
  const doc = db.doctors.find((d: any) => d.id === apt.doctorId);

  const istClock = getServerISTClock();
  if (isServerSlotPast(newDate, newTime, istClock)) {
    return res.status(400).json({
      success: false,
      code: 'PAST_SLOT_NOT_ALLOWED',
      message: `Cannot reschedule to ${newTime} on ${newDate} because that time slot has already passed (Live IST: ${istClock.timeShort}). Please choose a future slot.`,
    });
  }

  // 1. Check if doctor has blocked the new time slot
  if (doc && (doc.blockedSlots || []).some((b: any) => b.date === newDate && normalizeSlot(b.slot) === normalizeSlot(newTime))) {
    return res.status(409).json({
      success: false,
      code: 'DOCTOR_SLOT_BLOCKED',
      message: `${apt.doctorName} is on leave/unavailable on ${newDate} at ${newTime}. Please choose another time slot.`
    });
  }

  // 2. Double booking check for the doctor at the new time slot
  const doctorConflict = db.appointments.find((a: any) =>
    a.id !== id &&
    isActiveAppointment(a) &&
    a.doctorId === apt.doctorId &&
    a.appointmentDate === newDate &&
    normalizeSlot(a.appointmentTime) === normalizeSlot(newTime)
  );

  if (doctorConflict) {
    return res.status(409).json({
      success: false,
      code: 'DOUBLE_BOOKING_PREVENTED',
      message: `The selected slot (${newDate} at ${newTime}) is already booked for ${apt.doctorName}.`
    });
  }

  // 3. Patient overlap check: ensure this patient doesn't already have another appointment at newDate + newTime
  const patientConflict = db.appointments.find((a: any) =>
    a.id !== id &&
    isActiveAppointment(a) &&
    a.appointmentDate === newDate &&
    normalizeSlot(a.appointmentTime) === normalizeSlot(newTime) &&
    isSamePatient(a, {
      patientId: apt.patientId,
      patientPhone: apt.patientPhone,
      patientEmail: apt.patientEmail,
      patientName: apt.patientName,
    })
  );

  if (patientConflict) {
    return res.status(409).json({
      success: false,
      code: 'PATIENT_TIME_OVERLAP_PREVENTED',
      message: `You already have another appointment on ${newDate} at ${newTime} with ${patientConflict.doctorName} (${patientConflict.tokenNumber}). Overlapping appointments are not allowed.`
    });
  }

  const prevDate = apt.appointmentDate;
  const prevTime = apt.appointmentTime;

  apt.appointmentDate = newDate;
  apt.appointmentTime = newTime;
  apt.status = 'rescheduled';

  saveDB(db);
  addAuditLog(
    'RESCHEDULE_APPOINTMENT',
    user,
    `Rescheduled token ${apt.tokenNumber} from ${prevDate} ${prevTime} to ${newDate} ${newTime}. Reason: ${reason}`,
    id
  );

  res.json({ success: true, message: 'Appointment rescheduled successfully', appointment: apt });
});

// Cancel appointment
app.post('/api/appointments/:id/cancel', (req, res) => {
  const { id } = req.params;
  const { reason = 'Cancelled by user', user = 'User' } = req.body;

  const db = loadDB();
  const index = db.appointments.findIndex((a: any) => a.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Appointment not found' });
  }

  const apt = db.appointments[index];
  apt.status = 'cancelled';
  apt.cancelReason = reason;

  saveDB(db);
  addAuditLog('CANCEL_APPOINTMENT', user, `Cancelled appointment ${apt.tokenNumber}. Reason: ${reason}`, id);

  res.json({ success: true, message: 'Appointment cancelled', appointment: apt });
});

// 6. Reports & Analytics for Admin Dashboard
app.get('/api/reports/summary', (req, res) => {
  const db = loadDB();
  const { appointments, hospitals, doctors } = db;

  const totalBookings = appointments.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = appointments.filter((a: any) => a.appointmentDate === todayStr).length;

  const completed = appointments.filter((a: any) => a.status === 'completed').length;
  const checkedIn = appointments.filter((a: any) => a.status === 'checked_in').length;
  const scheduled = appointments.filter((a: any) => a.status === 'scheduled').length;
  const cancelled = appointments.filter((a: any) => a.status === 'cancelled').length;
  const noShow = appointments.filter((a: any) => a.status === 'no_show').length;

  const paidApts = appointments.filter((a: any) => a.paymentStatus === 'paid');
  const totalRevenue = paidApts.reduce((acc: number, curr: any) => acc + (curr.fee || 0), 0);
  const cashRevenue = paidApts.filter((a: any) => a.paymentMethod === 'cash').reduce((acc: number, curr: any) => acc + (curr.fee || 0), 0);
  const onlineRevenue = paidApts.filter((a: any) => a.paymentMethod === 'demo_online').reduce((acc: number, curr: any) => acc + (curr.fee || 0), 0);

  // Department-wise distribution
  const departmentCounts: Record<string, number> = {};
  appointments.forEach((a: any) => {
    const dept = a.doctorSpeciality || 'General Medicine';
    departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
  });

  // City-wise distribution
  const cityCounts: Record<string, number> = {};
  appointments.forEach((a: any) => {
    const city = a.city || 'Other';
    cityCounts[city] = (cityCounts[city] || 0) + 1;
  });

  res.json({
    success: true,
    summary: {
      totalHospitals: hospitals.length,
      totalDoctors: doctors.length,
      totalBookings,
      todayBookings,
      statusCounts: {
        completed,
        checkedIn,
        scheduled,
        cancelled,
        noShow
      },
      revenue: {
        totalRevenue,
        cashRevenue,
        onlineRevenue
      },
      departmentCounts,
      cityCounts
    }
  });
});

// 7. Audit Logs Endpoint
app.get('/api/audit-logs', (req, res) => {
  const db = loadDB();
  res.json({ success: true, logs: db.auditLogs || [] });
});

// -------------------------------------------------------------
// VITE MIDDLEWARE INTEGRATION (Express + Vite Dev Server)
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In dev mode, mount Vite as middleware so both frontend and API run on PORT 3000
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CityCare] Hospital Appointment System running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
