import React, { useState } from 'react';
import {
  GraduationCap,
  Database,
  Code,
  Server,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Copy,
  Check,
  Printer,
  FileText,
  Network,
  Layers,
  Table,
} from 'lucide-react';

interface AcademicVivaModalProps {
  onClose: () => void;
}

export const AcademicVivaModal: React.FC<AcademicVivaModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<
    'synopsis' | 'dfd' | 'srs' | 'normalization' | 'architecture' | 'database' | 'algorithm' | 'python' | 'viva_qa'
  >('synopsis');
  const [copied, setCopied] = useState(false);

  const pythonSample = `# Run the standalone Python Flask Backend:
# Step 1: Install dependencies
pip install flask flask-cors requests

# Step 2: Run server
python backend_python/app.py

# Endpoints provided:
# GET  /api/hospitals?city=Jalgaon
# GET  /api/doctors?city=Nashik
# POST /api/appointments (with double-booking conflict check)
# Database: SQLite3 (backend_python/hospital_system.db)`;

  const handleCopy = () => {
    navigator.clipboard.writeText(pythonSample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-950 text-white p-6 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-white text-lg font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center font-bold">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Academic Project Documentation & Viva Suite
              </span>
            </div>

            <button
              onClick={handlePrint}
              className="mr-10 px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
              title="Print formatted project documentation or save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mt-2">
            City-Based Hospital Appointment System — Project Documentation
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Comprehensive college submission package containing Project Synopsis, SRS table, DFD Level 0 & 1, Normalization (1NF–3NF), Double-Booking Algorithm, and Viva Q&A.
          </p>
        </div>

        {/* Tab buttons */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs font-bold">
          {[
            { id: 'synopsis', label: '📄 Project Synopsis' },
            { id: 'dfd', label: '🔀 DFD Diagrams (L0/L1)' },
            { id: 'srs', label: '📋 SRS Specification' },
            { id: 'normalization', label: '📊 Normalization (1-3NF)' },
            { id: 'architecture', label: '🏛️ 3-Tier Architecture' },
            { id: 'database', label: '🗄️ Database ER Schema' },
            { id: 'algorithm', label: '🔒 Double-Booking Logic' },
            { id: 'python', label: '🐍 Python Backend' },
            { id: 'viva_qa', label: '🎓 Viva Q&A' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === t.id
                  ? 'bg-white text-teal-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="p-6 max-h-[65vh] overflow-y-auto text-slate-800 space-y-5 text-xs">
          {/* TAB: SYNOPSIS */}
          {activeTab === 'synopsis' && (
            <div className="space-y-4 printable-section">
              <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-teal-950">
                    Project Synopsis: City-Based Hospital Appointment Management System
                  </h3>
                  <p className="text-xs text-teal-700 mt-0.5">
                    Course: Bachelor of Computer Applications (BCA) / B.Tech / B.Sc. IT Final-Year Project
                  </p>
                </div>
                <button
                  onClick={handlePrint}
                  className="px-3 py-1.5 bg-teal-700 text-white font-bold rounded-lg cursor-pointer text-xs flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Synopsis</span>
                </button>
              </div>

              <div className="space-y-3 bg-white border border-slate-200 p-5 rounded-2xl">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    1. Introduction & Background
                  </h4>
                  <p className="text-slate-700 leading-relaxed mt-1 text-[11px]">
                    In urban and tier-2 towns (e.g. Jalgaon, Nashik, Amalner, Mumbai), patients face severe delays locating specialized doctors, verifying hospital ICU bed status, and booking consultation tokens without long queues. This project delivers an automated, city-based Hospital Information & Appointment System built on 100% free open-source technologies (OpenStreetMap, React, Express/Python Flask, SQLite).
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    2. Objectives of the System
                  </h4>
                  <ul className="list-disc pl-5 space-y-1 text-slate-700 text-[11px]">
                    <li>Enable geo-spatial hospital search for any city/area (Jalgaon, Nashik, Pune, etc.) using live OpenStreetMap Overpass and Nominatim APIs without paid keys.</li>
                    <li>Symptom-to-speciality triage engine mapping clinical symptoms (e.g. chest pain to Cardiology, toothache to Dental) to guide patients.</li>
                    <li>Zero double-booking guarantee via server-side atomic slot locking and doctor leave management.</li>
                    <li>Flexible payment options: Cash at Counter or simulated UPI/Card Demo Payment.</li>
                    <li>Live OPD Waiting Room TV Display with synthesized Web Audio API 2-tone queue chimes.</li>
                    <li>Patient EHR/EMR vault for vitals, chronological consultation timeline, and PDF printable prescription slips.</li>
                    <li>Tri-lingual interface: English, Hindi (हिंदी), and Marathi (मराठी) for regional inclusivity.</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-teal-700">
                    3. Tech Stack & Environment
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] mt-1">
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <strong>Frontend:</strong> React 19, TypeScript, Tailwind CSS, Leaflet Maps
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <strong>Backend:</strong> Node.js Express & Python 3.10 Flask REST API
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <strong>Database:</strong> SQLite3 / JSON Relational Schema (1NF–3NF)
                    </div>
                    <div className="bg-slate-50 p-2 rounded-lg border border-slate-200">
                      <strong>Geo API:</strong> OpenStreetMap / Overpass (100% Free)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DFD (DATA FLOW DIAGRAMS) */}
          {activeTab === 'dfd' && (
            <div className="space-y-5">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Network className="w-4 h-4 text-teal-600" />
                  <span>Data Flow Diagrams (DFD Level 0 & Level 1)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual context and functional process diagrams requested by university examiners.
                </p>
              </div>

              {/* DFD Level 0 Context Diagram */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                    DFD Level 0: Context Diagram
                  </span>
                  <span className="text-[10px] text-slate-400">System Boundary</span>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono leading-relaxed text-slate-300 space-y-2">
                  <div className="text-center font-bold text-teal-300">
                    [External Entities: Patient | Doctor | Receptionist | Admin]
                  </div>
                  <div className="text-center text-slate-500">
                    ↓↓  (City Search, Booking Requests, Vitals, Slot Locks, Check-Ins)
                  </div>
                  <div className="p-3 bg-teal-900/60 border border-teal-500 rounded-xl text-center font-bold text-white">
                    SYSTEM PROCESS 0.0: City-Based Hospital Appointment & OPD Queue System
                  </div>
                  <div className="text-center text-slate-500">
                    ↓↓  (Hospital Coordinates, Token Numbers, OPD Slips, Audit Logs)
                  </div>
                  <div className="text-center font-bold text-teal-300">
                    [External Systems & Stores: OpenStreetMap Overpass API | Local DB]
                  </div>
                </div>
              </div>

              {/* DFD Level 1 Detailed Process Breakdown */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  DFD Level 1: Sub-Processes Breakdown
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block">Process 1.0: Geo Hospital Discovery</span>
                    <p className="text-slate-600 mt-1">
                      Input: City name (e.g. Jalgaon, Nashik) → Query OSM Nominatim → Filter amenity=hospital → Output: Hospital markers & real coordinates.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block">Process 2.0: Symptom Matching & Triage</span>
                    <p className="text-slate-600 mt-1">
                      Input: Patient symptoms description → Rule-based Clinical Classifier → Output: Speciality rank, urgency (Low/Med/High).
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block">Process 3.0: Slot Lock & Double-Booking Guard</span>
                    <p className="text-slate-600 mt-1">
                      Input: Doctor ID, Date, Time Slot → Atomic Conflict Validation → If free: generate unique OPD Token & commit; else: HTTP 409 Conflict.
                    </p>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="font-bold text-teal-900 block">Process 4.0: Live Queue & EHR Management</span>
                    <p className="text-slate-600 mt-1">
                      Receptionist check-in → TV Waiting Screen update with Web Audio chime → Doctor records vitals and e-prescription → Patient EHR history.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: SRS */}
          {activeTab === 'srs' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Table className="w-4 h-4 text-teal-600" />
                <span>Software Requirement Specification (SRS Table)</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px] border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-100 text-slate-800 font-bold">
                    <tr>
                      <th className="p-2.5 border-b">Req ID</th>
                      <th className="p-2.5 border-b">Module</th>
                      <th className="p-2.5 border-b">Requirement Description</th>
                      <th className="p-2.5 border-b">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-01</td>
                      <td className="p-2 font-semibold">City Search</td>
                      <td className="p-2">System must discover verified hospitals in any selected city/town via OpenStreetMap.</td>
                      <td className="p-2 text-rose-600 font-bold">High</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-02</td>
                      <td className="p-2 font-semibold">Concurrency</td>
                      <td className="p-2">System must prevent double-booking for the same doctor, date, and slot with atomic checks.</td>
                      <td className="p-2 text-rose-600 font-bold">Critical</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-03</td>
                      <td className="p-2 font-semibold">OPD Token</td>
                      <td className="p-2">Every booking generates a unique token (e.g. OPD-JAL-104) and printable appointment slip with QR code.</td>
                      <td className="p-2 text-teal-700 font-bold">High</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-04</td>
                      <td className="p-2 font-semibold">Symptom Checker</td>
                      <td className="p-2">User enters natural language symptoms; system matches keywords to recommended medical department.</td>
                      <td className="p-2 text-teal-700 font-bold">Medium</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-05</td>
                      <td className="p-2 font-semibold">Live Queue Board</td>
                      <td className="p-2">TV display screen showing "Now Serving" token and audio chime for waiting room patients.</td>
                      <td className="p-2 text-teal-700 font-bold">High</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">FR-06</td>
                      <td className="p-2 font-semibold">EHR Vault</td>
                      <td className="p-2">Patients & doctors view history of consultation notes, vitals (BP, SpO2), and prescriptions.</td>
                      <td className="p-2 text-teal-700 font-bold">High</td>
                    </tr>
                    <tr>
                      <td className="p-2 font-mono font-bold text-teal-700">NFR-01</td>
                      <td className="p-2 font-semibold">Zero Paid Cost</td>
                      <td className="p-2">100% free operation using open APIs (OSM), sandbox demo payment, and local database.</td>
                      <td className="p-2 text-rose-600 font-bold">Mandatory</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: NORMALIZATION */}
          {activeTab === 'normalization' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-teal-600" />
                <span>Database Normalization Proof (1NF, 2NF, 3NF)</span>
              </h3>

              <div className="space-y-3 text-[11px]">
                <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl">
                  <h4 className="font-bold text-teal-950 text-xs">First Normal Form (1NF) — Atomicity</h4>
                  <p className="text-teal-900 mt-1">
                    Every column contains only atomic (indivisible) values. No repeating groups. Each table has a defined Primary Key:
                    <br />
                    • <code className="font-mono bg-teal-100 px-1 rounded">hospitals.id</code> (PK)
                    <br />
                    • <code className="font-mono bg-teal-100 px-1 rounded">doctors.id</code> (PK)
                    <br />
                    • <code className="font-mono bg-teal-100 px-1 rounded">appointments.id</code> (PK) with unique index on tokenNumber.
                  </p>
                </div>

                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl">
                  <h4 className="font-bold text-blue-950 text-xs">Second Normal Form (2NF) — No Partial Dependency</h4>
                  <p className="text-blue-900 mt-1">
                    The database is in 1NF and all non-key attributes are fully functionally dependent on the primary key. Hospital attributes (hospitalName, hospitalAddress) are separated from Doctor attributes. Doctor table refers to <code className="font-mono bg-blue-100 px-1 rounded">hospitalId</code> as a Foreign Key (FK), eliminating partial functional dependency on composite keys.
                  </p>
                </div>

                <div className="p-3.5 bg-purple-50 border border-purple-200 rounded-xl">
                  <h4 className="font-bold text-purple-950 text-xs">Third Normal Form (3NF) — No Transitive Dependency</h4>
                  <p className="text-purple-900 mt-1">
                    The database is in 2NF and has no transitive dependencies (i.e. Non-key attribute → Non-key attribute). In appointments, patient details (age, blood group, phone) belong to Users table via <code className="font-mono bg-purple-100 px-1 rounded">patientId</code>, and consultation notes belong to the consultation session rather than the general doctor profile.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Architecture */}
          {activeTab === 'architecture' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                3-Tier Client-Server Architecture
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200">
                  <span className="text-xs font-black text-teal-900 block mb-1">Presentation Layer</span>
                  <p className="text-teal-800 text-[11px] leading-relaxed">
                    React 19 SPA, Tailwind CSS v4, Lucide Icons, Leaflet interactive map with OpenStreetMap tiles. Fully responsive for desktop, tablet, and mobile.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200">
                  <span className="text-xs font-black text-blue-900 block mb-1">Application Layer</span>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    Node.js + Express REST API (and Python Flask equivalent in <code className="font-mono bg-blue-100 px-1 rounded">backend_python/</code>). Handles slot concurrency, token generation, and audit logging.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200">
                  <span className="text-xs font-black text-purple-900 block mb-1">Data & API Layer</span>
                  <p className="text-purple-800 text-[11px] leading-relaxed">
                    Local persistent relational/JSON store + OpenStreetMap Overpass public API for live municipal hospital discovery without paid keys.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-bold text-slate-900">Open-Source & Free Tier Justification:</h4>
                <p className="text-slate-600 leading-relaxed">
                  Unlike commercial hospital systems that rely on paid Google Maps Platform or proprietary payment gateways, this project leverages <strong>OpenStreetMap (OSM) / Overpass API</strong> for geo-spatial hospital lookup and an educational <strong>mock sandbox payment gateway</strong> for UPI/Cards. This guarantees 100% free deployment for college evaluation.
                </p>
              </div>
            </div>
          )}

          {/* Tab: Database */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Entity Relationship (ER) Schema Design
              </h3>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900 text-xs">
                    <span>Table 1: HOSPITALS</span>
                    <span className="font-mono text-teal-700">id (PK)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Columns: id, name, city, state, address, phone, emergencyPhone, departments, rating, beds, bedDetails, lat, lng, isOpen24x7.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900 text-xs">
                    <span>Table 2: DOCTORS</span>
                    <span className="font-mono text-teal-700">id (PK), hospitalId (FK)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Columns: id, name, speciality, department, qualification, experience, hospitalId, city, fee, availableDays, availableSlots, blockedSlots.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between font-bold text-slate-900 text-xs">
                    <span>Table 3: APPOINTMENTS</span>
                    <span className="font-mono text-teal-700">id (PK), tokenNumber (UNIQUE)</span>
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Columns: id, tokenNumber, patientName, patientPhone, doctorId (FK), appointmentDate, appointmentTime, vitals, prescriptions, rating, status.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Algorithm */}
          {activeTab === 'algorithm' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Double-Booking Prevention Algorithm
              </h3>
              <div className="p-4 bg-slate-900 text-teal-300 rounded-2xl font-mono text-[11px] leading-relaxed overflow-x-auto">
                <p className="text-slate-400">// Concurrency Guard Logic (Executed in server.ts & Python backend):</p>
                <p>1. User requests slot: (doctorId, appointmentDate, appointmentTime)</p>
                <p>2. Query database for active booking:</p>
                <p className="pl-4 text-white">SELECT * FROM appointments WHERE</p>
                <p className="pl-6 text-white">doctorId = :docId AND</p>
                <p className="pl-6 text-white">appointmentDate = :date AND</p>
                <p className="pl-6 text-white">appointmentTime = :slot AND</p>
                <p className="pl-6 text-white">status != 'cancelled'</p>
                <p>3. Check doctor emergency blocked slots:</p>
                <p className="pl-4 text-white">IF slot in doctor.blockedSlots on date THEN RETURN HTTP 409 Conflict</p>
                <p>4. IF conflict exists THEN:</p>
                <p className="pl-4 text-rose-400">RETURN HTTP 409 Conflict ("DOUBLE_BOOKING_PREVENTED")</p>
                <p>5. ELSE:</p>
                <p className="pl-4 text-emerald-400">Generate OPD Token, save record, write Audit Log, return HTTP 201 Created</p>
              </div>
            </div>
          )}

          {/* Tab: Python Backend */}
          {activeTab === 'python' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  Python Flask + SQLite Backend (<code className="font-mono text-teal-700">backend_python/app.py</code>)
                </span>
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <p className="text-slate-600">
                A standalone Python backend has been generated in <code className="font-mono bg-slate-100 px-1 rounded">/backend_python</code> implementing the identical REST routes with Flask, SQLite3, and CORS for university viva evaluation.
              </p>

              <pre className="p-3 bg-slate-900 text-emerald-400 rounded-2xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                {pythonSample}
              </pre>
            </div>
          )}

          {/* Tab: Viva Q&A */}
          {activeTab === 'viva_qa' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Common Final-Year Viva Questions & Model Answers
              </h3>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">Q1: How does this system prevent two patients from booking the same doctor slot?</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    <strong>Answer:</strong> We enforce two-tier validation. First, the UI fetches active slots for the selected doctor and date, visually locking already-booked and blocked slots. Second, on the server, an atomic check verifies that no active (non-cancelled) record or blocked slot exists matching (doctorId, appointmentDate, appointmentTime) before inserting. If a conflict occurs, HTTP 409 Conflict is returned.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">Q2: Can patients in Jalgaon and Nashik search for real hospitals?</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    <strong>Answer:</strong> Yes! The system connects directly to OpenStreetMap Overpass & Nominatim geocoding. When querying Jalgaon or Nashik or any town, it pulls verified real municipal hospitals, calculates GPS coordinates, and assigns verified clinical specialists ready for booking.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <h4 className="font-bold text-slate-900">Q3: Why is Multi-Language (English, Hindi, Marathi) implemented?</h4>
                  <p className="text-slate-600 mt-1 leading-relaxed">
                    <strong>Answer:</strong> Regional accessibility is paramount in healthcare. Patients in Maharashtra (such as Nashik and Jalgaon) frequently speak Marathi or Hindi. The instant language toggle ensures non-English speakers can easily triage symptoms, view tokens, and understand OPD instructions.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-[11px] text-slate-500">
            Click <strong>Print / Save PDF</strong> to generate college project report submission sheets.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
