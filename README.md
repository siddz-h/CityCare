# 🏥 CityCare — Live IST-Synchronized OPD Triage & Regional Hospital Network

<div align="center">

### 🌐 **[🚀 Open the Live CityCare Deployment](https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app)**
**Public Preview Link:** [`https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app`](https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app)

[![Launch App](https://img.shields.io/badge/LIVE%20DEPLOYMENT-LAUNCH%20CITYCARE-A3E635?style=for-the-badge&logo=googlechrome&logoColor=black)](https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app)
[![React 19](https://img.shields.io/badge/UI-React%2019%20%2B%20TypeScript-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind 4](https://img.shields.io/badge/CSS-Tailwind%20v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Express API](https://img.shields.io/badge/Server-Express%20%2B%20TSX-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![OpenStreetMap](https://img.shields.io/badge/Geo-Leaflet%20%2B%20Overpass%20API-199900?style=for-the-badge&logo=openstreetmap&logoColor=white)](https://www.openstreetmap.org/)

</div>

<p align="center">
  <a href="https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app">
    <img src="./public/assets/aistudio/image_640951a6.png" alt="CityCare Symptom Triage, 108 Simulator & Live IST Slot Matcher" width="100%" />
  </a>
</p>

---

## 💡 What Problem We Actually Built This to Solve (And Why It Differs from Standard Medical Repos)

If you look at typical academic or demo hospital repositories on GitHub, they almost always work the same way: a static form lets you pick any doctor, pick any time (even `09:00 AM` when it is already `10:30 PM` at night), and save a row into a database table with zero awareness of clinical specialty matching, real clock time, or physical waiting-room queues.

When we designed **CityCare**, we focused on the actual friction points that happen every day in Indian outpatient departments (OPDs)—specifically across Maharashtra towns and cities like **Amalner, Jalgaon, Dhule, Nashik, Pune, and Mumbai**:

### 1. Patients Know Their Symptoms, Not Clinical Department Names
In a real household, nobody says *"I need an Otolaryngologist"* or *"Book me a Pulmonology OPD."* They say *"my child has had fever and cold since yesterday"* or *"chest feels heavy when climbing stairs."*
* **Our Implementation (`server.ts` + `SmartBookingAI.tsx`):** Instead of forcing patients to guess a department filter first, our intake screen accepts free-text descriptions, browser voice dictation, or clicks on an **Interactive Body Map**. The backend evaluates the complaint through **Gemini Flash Lite** (`gemini-3.1-flash-lite`) paired with a deterministic 11-department clinical keyword matrix (`triageCache`) so it never breaks even if external API quota is exhausted. It outputs the exact target specialty, priority tier (`Routine`, `Medium Care`, `High`, or `Emergency`), estimated cabin wait time (`~10–15 mins`), and an interactive **108 Ambulance & ER Showcase Simulator**.

### 2. Blocking "Time-Travel" Bookings with Live `Asia/Kolkata` Clock Authority
A major flaw in regular booking projects is that a user visiting the site at `10:35 PM` can still click and book `09:00 AM` for "Today."
* **Our Implementation (`src/utils/internetTime.ts` & `/api/time`):** Both frontend and backend calculate live minutes-since-midnight in `Asia/Kolkata` (`getLiveISTClock()` and `isServerSlotPast()`). Every single OPD slot (`09:00 AM` through `09:30 PM`) is compared against live Indian Standard Time. Past morning and afternoon slots for the current date are automatically locked out, and if all OPD hours for today have finished, the matcher shifts the target schedule to **Tomorrow** with an explicit timestamp notice.

### 3. Three-Way Server Lock Against Slot Collisions
In a real clinic, two people cannot sit in the same doctor's cabin at `10:30 AM`, and one patient cannot physically attend two different hospitals at `10:30 AM`.
* **Our Implementation (`POST /api/appointments` & `/reschedule`):** Before issuing an OPD token (`OPD-AMA-412`, `OPD-PUN-108`), `server.ts` executes three sequential checks on `/data/db.json`:
  1. **Doctor Leave / Emergency Block (`blockedSlots`):** Rejects the request (`HTTP 409 DOCTOR_SLOT_BLOCKED`) if the specialist marked that slot unavailable for emergency surgery or ward rounds.
  2. **Same-Doctor Slot Lock (`DOUBLE_BOOKING_PREVENTED`):** Ensures no active appointment exists for that `doctorId + appointmentDate + normalizedSlot`.
  3. **Same-Patient Overlap Lock (`PATIENT_TIME_OVERLAP_PREVENTED`):** Cross-checks `patientId`, phone number, and email so a single patient cannot hold two concurrent bookings at the same hour with different doctors.

### 4. Real-Time Corridor Queue Board & Trilingual Voice Callouts (`EN` / `हिन्दी` / `मराठी`)
Walk-in clinics outside metro areas serve patients who prefer reading and hearing updates in regional languages rather than English-only dashboards.
* **Our Implementation (`src/utils/translations.ts` & `sound.ts`):** When a doctor or receptionist moves a token from `Booked` → `Checked In` → `In Cabin` → `Completed`, the **Waiting Room Live Queue TV** view updates immediately and triggers browser Web Speech synthesis to announce the token number and cabin assignment aloud in **English, Hindi, or Marathi**.

### 5. Live OpenStreetMap Overpass Discovery + Scroll-Safe Leaflet Map
Instead of hardcoding three fake hospitals, typing any town name queries the **OpenStreetMap Nominatim & Overpass APIs** (`autoDiscoverCityHospitals` in `server.ts`) to pull real clinics and hospitals in that municipality, complete with **OSRM road routing** and a custom `Scroll Zoom: Off (Ctrl + Scroll)` guard in `HospitalMap.tsx` so scrolling down the web page never gets trapped inside the map canvas.

---

## 📊 Side-by-Side Technical Comparison

| Engineering Aspect | Typical College / Demo Medical Repo | 🏥 CityCare Architecture (This Codebase) |
| :--- | :--- | :--- |
| **Intake Flow** | Manual dropdown where user guesses department | **Symptom-First Triage** (Text + Voice + Interactive Body Map → Auto-matched specialists) |
| **Clock Validation** | Static strings; allows booking past hours on the same day | **Authoritative IST Engine (`Asia/Kolkata`)** locks elapsed slots & auto-advances after clinic hours |
| **Concurrency / Locks** | Unchecked array push / SQL insert | **3-Way Atomic Guard** (Doctor leave block + Doctor slot lock + Same-patient time overlap check) |
| **Map & Locations** | Static placeholder cards | **Live OSM Overpass City Discovery** + OSRM road distance + `Ctrl + Scroll` wheel-trap protection |
| **Checkout & Tokens** | Plain alert box on submit | **UPI / QR / Card Sandbox Gateway** + `Cash at Desk` option + printable `OPD-<CITY>-<NUM>` slip |
| **Corridor Experience** | None | **Live Waiting Room TV Mode** + **English / Hindi / Marathi** audio token announcements |
| **Role Separation** | Single view or basic admin table | **4 Dedicated Views**: Patient Portal, Doctor Cabin Console, Receptionist Walk-In Desk, Admin Audit Log |

---

## 🖼️ Interface Walkthrough (Actual App Captures)

### 1. Symptom Triage, Interactive Body Map & 108 Showcase Simulator
Patients enter symptoms by typing, speaking, or switching to the **Interactive Body Map**. The right panel displays the matched specialty (`Pulmonology`), clinical priority (`Medium Care`), live IST verification (`10:35:09 PM IST`), clickable time slots for `Dr. Tushar Shinde`, and an **Emergency & 108 Ambulance Simulator** built specifically for safe project demonstrations.

![Symptom Triage & Smart Booking Screen](./public/assets/aistudio/image_640951a6.png)

---

### 2. Regional Hospital Hub, Live Bed Counters & Scroll-Safe Clinical Map
Switching cities (e.g., `Amalner`, `Jalgaon`, `Nashik`, `Dhule`, `Pune`, `Mumbai`) loads verified local facilities with real-time **General, ICU, and Ventilator bed counters** alongside the interactive OpenStreetMap view featuring the top-right `Scroll Zoom: Off (Ctrl + Scroll)` control.

![Regional Hospital Network & Clinical Map](./public/assets/aistudio/image_1cf8573f.png)

---

### 3. Specialist Directory with Qualification & Fee Breakdown
Filter verified doctors by specialty tab (`Cardiology`, `Orthopedics`, `Neurology`, `General Medicine`, `Pulmonology`, `Dermatology`, `Dental`, `Pediatrics`, `Gastroenterology`) to compare degrees, years of practice, hospital location, and consultation fees before booking.

![Verified Specialists Directory](./public/assets/aistudio/image_550c3d7b.png)

---

### 4. Live IST Slot Picker & Patient Intake Modal
Displays 7-day IST calendar cards, real-time slot buttons synchronized with `LIVE IST`, pre-filled patient demographics (`Patient ID: usr-4`), and a toggle between **Cash at Desk** and **Online Instant Pay**.

![Live IST Appointment Booking Modal](./public/assets/aistudio/image_8e081e84.png)

---

### 5. Simulated UPI / QR / Card / NetBanking Checkout Sandbox
When **Online Instant Pay** is selected, patients can test zero-wait OPD token confirmation using simulated VPA handles (`demo.patient@okaxis`), quick UPI provider chips (`Google Pay`, `PhonePe`, `Paytm`, `BHIM UPI`), or card/netbanking modes without any real bank deduction.

![CityCare Sandbox Payment Gateway](./public/assets/aistudio/image_310895c5.png)

---

## 🔐 Four Role-Based Workspaces in One App

You can switch active roles anytime from the top-right profile menu or the left command drawer (`CityCare MENU`):

* **👤 Patient View:** Run symptom triage, inspect hospital ICU/ventilator counts, book or reschedule OPD slots, store medical files in **Health Vault**, and track live 4-step visit status (`Booked` → `Checked In` → `In Cabin` → `Completed`).
* **🩺 Doctor Console:** Call the next token into the cabin, record blood pressure / heart rate / SpO2 / temperature vitals, write digital prescriptions, or block out specific time slots for emergency surgeries.
* **🖥️ Receptionist Desk:** Register walk-in patients on the spot, mark cash payments as collected, and assign consultation room numbers.
* **🛡️ Admin Command Center:** Monitor city-wide bed utilization charts and inspect the timestamped audit log (`/api/audit-logs`) recording every state change across the hospital network.

---

## 🗂️ Codebase Layout

```text
├── public/
│   └── assets/aistudio/          # High-resolution captures of each module
├── src/
│   ├── components/
│   │   ├── SmartBookingAI.tsx    # Symptom intake, body map toggle, & live IST slot matcher
│   │   ├── HospitalMap.tsx       # Leaflet map, OSRM route polylines, & Ctrl+Scroll zoom guard
│   │   ├── EmergencyCommandModal.tsx # Showcase-safe 108 ambulance & ER bed simulator
│   │   └── Navbar.tsx            # Role switcher, language selector (EN/HI/MR), & live IST clock pill
│   ├── services/
│   │   └── api.ts                # Typed REST client for hospitals, doctors, triage, & appointments
│   ├── utils/
│   │   ├── internetTime.ts       # Client/server Asia/Kolkata clock offset & past-slot calculator
│   │   ├── translations.ts       # English, Hindi, and Marathi UI dictionary
│   │   └── sound.ts              # Web Audio chimes & Web Speech API token announcements
│   ├── App.tsx                   # Central state, booking modal, UPI sandbox, & role dashboards
│   └── types.ts                  # TypeScript data contracts
├── data/
│   └── db.json                   # File-backed store for hospitals, doctors, appointments, & audit logs
└── server.ts                     # Express API, Overpass city discovery, 3-way booking lock, & Gemini triage
```

---

## ⚙️ Running Locally

1. **Install Node packages**
   ```bash
   npm install
   ```

2. **Environment setup (Optional)**
   Copy `.env.example` to `.env`. If `GEMINI_API_KEY` is omitted, `/api/triage/smart-booking` automatically runs using the built-in 11-specialty clinical rule engine in `server.ts`.
   ```bash
   cp .env.example .env
   ```

3. **Start the Express + Vite server on port 3000**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` locally, or test the hosted build directly at **[https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app](https://ais-pre-cefe6u3zggwfiu6fe5x5gk-530948025475.asia-east1.run.app)**.
