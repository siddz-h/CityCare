# CityCare Hospital Appointment System

The CityCare Hospital Appointment System is a healthcare management platform designed to streamline appointment booking, triage, and administrative workflows for hospital staff and patients.

## Project Overview
This application serves as a comprehensive portal for patients to book appointments, view hospital data, check symptoms, and manage medical history, while providing dashboards for doctors, receptionists, and administrators.

## Technology Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express
- **Persistence**: JSON file-based database (`/data/db.json`)
- **Integration**: Gemini API (for Smart Booking AI triage)

## Key Features
- **Smart Booking AI**: Symptom-based triage and doctor recommendation.
- **Appointment Booking**: Real-time slot selection and conflict prevention.
- **Hospital Discovery**: OpenStreetMap-based facility discovery.
- **Patient Portal**: Appointment tracking and health records.
- **Admin/Staff Dashboards**: Analytics, audit logs, and user role management.

## Project Structure
- `/src/components`: React components for UI modules.
- `/src/services`: API interaction layer.
- `/data`: JSON database.
- `server.ts`: Express backend implementation.

## Setup & Execution
1. Install dependencies: `npm install`
2. Configure environment variables (refer to `.env.example`).
3. Run the development server: `npm run dev`

## Important Notes
- The Smart Booking feature includes a rule-based fallback if the Gemini API is unavailable.
- Data persistence is achieved via a local JSON file for the demo.
- API keys must be managed server-side.
- The project is currently under redesign to adopt a premium health-tech dashboard aesthetic.
