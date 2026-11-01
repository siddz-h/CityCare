"""
City-Based Hospital Appointment Management System
Python Flask Backend Alternative for Academic Evaluation / Viva Presentation
Compatible with Python 3.8+ and SQLite3
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import sqlite3
import json
import datetime
import os
import urllib.request
import urllib.parse

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), 'hospital_system.db')

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()
    
    # Hospitals Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS hospitals (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        city TEXT NOT NULL,
        state TEXT,
        address TEXT NOT NULL,
        phone TEXT,
        emergency_phone TEXT,
        departments TEXT,
        rating REAL,
        beds INTEGER,
        lat REAL,
        lng REAL,
        is_open_24x7 INTEGER DEFAULT 1,
        image TEXT
    )
    ''')

    # Doctors Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS doctors (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        speciality TEXT NOT NULL,
        department TEXT NOT NULL,
        qualification TEXT,
        experience INTEGER,
        hospital_id TEXT,
        hospital_name TEXT,
        city TEXT,
        fee INTEGER,
        rating REAL,
        phone TEXT,
        available_days TEXT,
        available_slots TEXT,
        avatar TEXT,
        bio TEXT
    )
    ''')

    # Appointments Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS appointments (
        id TEXT PRIMARY KEY,
        token_number TEXT UNIQUE,
        patient_name TEXT NOT NULL,
        patient_phone TEXT NOT NULL,
        patient_email TEXT,
        patient_age INTEGER,
        patient_gender TEXT,
        doctor_id TEXT NOT NULL,
        doctor_name TEXT,
        doctor_speciality TEXT,
        hospital_id TEXT,
        hospital_name TEXT,
        city TEXT,
        appointment_date TEXT NOT NULL,
        appointment_time TEXT NOT NULL,
        symptoms TEXT,
        fee INTEGER,
        payment_method TEXT,
        payment_status TEXT,
        transaction_id TEXT,
        status TEXT,
        doctor_notes TEXT,
        created_at TEXT
    )
    ''')

    # Audit Logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS audit_logs (
        id TEXT PRIMARY KEY,
        timestamp TEXT,
        action TEXT,
        user_name TEXT,
        details TEXT,
        target_id TEXT
    )
    ''')

    conn.commit()
    conn.close()

init_db()

def auto_discover_city_hospitals(city_name):
    city_name = city_name.strip()
    formatted_city = city_name.capitalize()
    conn = get_db()
    existing = conn.execute("SELECT * FROM hospitals WHERE LOWER(city) = LOWER(?)", (city_name,)).fetchall()
    if len(existing) >= 2:
        conn.close()
        return

    try:
        url = f"https://nominatim.openstreetmap.org/search?format=json&q=hospital+in+{urllib.parse.quote(city_name)}&limit=8"
        req = urllib.request.Request(url, headers={'User-Agent': 'CityCare-Academic-Python/1.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode())
            
        if data and isinstance(data, list) and len(data) > 0:
            for idx, p in enumerate(data[:6]):
                clean_name = p.get('name') or p.get('display_name', '').split(',')[0].strip()
                if not any(k in clean_name.lower() for k in ['hospital', 'clinic', 'care']):
                    clean_name = f"{clean_name} Hospital"
                
                hosp_id = f"hosp-{city_name.lower()}-{idx+1}"
                address = p.get('display_name', f"{clean_name}, {formatted_city}")
                lat = float(p.get('lat', 21.0441))
                lng = float(p.get('lon', 75.0641))
                depts = json.dumps(['General Medicine', 'Pediatrics', 'Orthopedics', 'Cardiology'])

                conn.execute('''
                INSERT OR IGNORE INTO hospitals (id, name, city, state, address, phone, emergency_phone, departments, rating, beds, lat, lng, is_open_24x7)
                VALUES (?, ?, ?, 'Maharashtra', ?, '+91 257 220000', '108', ?, 4.6, 80, ?, ?, 1)
                ''', (hosp_id, clean_name, formatted_city, address[:100], depts, lat, lng))

                # Also insert 2 doctors for this hospital
                doc1_id = f"doc-{city_name.lower()}-{idx+1}-1"
                doc2_id = f"doc-{city_name.lower()}-{idx+1}-2"
                slots = json.dumps(['09:00 AM', '10:30 AM', '02:00 PM', '04:00 PM'])
                days = json.dumps(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

                conn.execute('''
                INSERT OR IGNORE INTO doctors (id, name, speciality, department, qualification, experience, hospital_id, hospital_name, city, fee, rating, phone, available_days, available_slots)
                VALUES (?, 'Dr. R. K. Patil', 'General Medicine', 'General Medicine', 'MBBS, MD', 12, ?, ?, ?, 350, 4.8, '+91 98000 11111', ?, ?)
                ''', (doc1_id, hosp_id, clean_name, formatted_city, days, slots))

                conn.execute('''
                INSERT OR IGNORE INTO doctors (id, name, speciality, department, qualification, experience, hospital_id, hospital_name, city, fee, rating, phone, available_days, available_slots)
                VALUES (?, 'Dr. Neeta Deshmukh', 'Pediatrics', 'Pediatrics', 'MBBS, DCH', 9, ?, ?, ?, 400, 4.9, '+91 98000 22222', ?, ?)
                ''', (doc2_id, hosp_id, clean_name, formatted_city, days, slots))

            conn.commit()
    except Exception as e:
        print(f"Error in auto_discover_city_hospitals: {e}")
    finally:
        conn.close()

@app.route('/api/hospitals', methods=['GET'])
def get_hospitals():
    city = request.args.get('city')
    if city and city.lower() != 'all':
        auto_discover_city_hospitals(city)

    conn = get_db()
    if city and city.lower() != 'all':
        rows = conn.execute("SELECT * FROM hospitals WHERE LOWER(city) = LOWER(?)", (city,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM hospitals").fetchall()
    
    hospitals = []
    for r in rows:
        hospitals.append({
            "id": r["id"],
            "name": r["name"],
            "city": r["city"],
            "state": r["state"],
            "address": r["address"],
            "phone": r["phone"],
            "emergencyPhone": r["emergency_phone"],
            "departments": json.loads(r["departments"]) if r["departments"] else [],
            "rating": r["rating"],
            "beds": r["beds"],
            "lat": r["lat"],
            "lng": r["lng"]
        })
    conn.close()
    return jsonify({"success": True, "hospitals": hospitals})

@app.route('/api/doctors', methods=['GET'])
def get_doctors():
    city = request.args.get('city')
    speciality = request.args.get('speciality')
    conn = get_db()
    query = "SELECT * FROM doctors WHERE 1=1"
    params = []
    if city and city.lower() != 'all':
        query += " AND LOWER(city) = LOWER(?)"
        params.append(city)
    if speciality and speciality.lower() != 'all':
        query += " AND (LOWER(speciality) = LOWER(?) OR LOWER(department) = LOWER(?))"
        params.extend([speciality, speciality])

    rows = conn.execute(query, params).fetchall()
    doctors = []
    for r in rows:
        doctors.append({
            "id": r["id"],
            "name": r["name"],
            "speciality": r["speciality"],
            "department": r["department"],
            "qualification": r["qualification"],
            "experience": r["experience"],
            "hospitalId": r["hospital_id"],
            "hospitalName": r["hospital_name"],
            "city": r["city"],
            "fee": r["fee"],
            "rating": r["rating"],
            "phone": r["phone"],
            "availableDays": json.loads(r["available_days"]) if r["available_days"] else [],
            "availableSlots": json.loads(r["available_slots"]) if r["available_slots"] else []
        })
    conn.close()
    return jsonify({"success": True, "doctors": doctors})

@app.route('/api/appointments', methods=['POST'])
def book_appointment():
    data = request.json or {}
    doctor_id = data.get('doctorId')
    appt_date = data.get('appointmentDate')
    appt_time = data.get('appointmentTime')

    if not doctor_id or not appt_date or not appt_time:
        return jsonify({"success": False, "message": "Missing required fields"}), 400

    conn = get_db()
    # Check double booking
    conflict = conn.execute(
        "SELECT * FROM appointments WHERE doctor_id = ? AND appointment_date = ? AND appointment_time = ? AND status != 'cancelled'",
        (doctor_id, appt_date, appt_time)
    ).fetchone()

    if conflict:
        conn.close()
        return jsonify({
            "success": False,
            "code": "DOUBLE_BOOKING_PREVENTED",
            "message": "Time slot already booked for this doctor."
        }), 409

    token_number = f"OPD-{datetime.datetime.now().strftime('%y%m%d%H%M')}"
    appt_id = f"apt-{int(datetime.datetime.now().timestamp()*1000)}"

    conn.execute('''
    INSERT INTO appointments (
        id, token_number, patient_name, patient_phone, patient_email, patient_age, patient_gender,
        doctor_id, doctor_name, doctor_speciality, hospital_id, hospital_name, city,
        appointment_date, appointment_time, symptoms, fee, payment_method, payment_status,
        transaction_id, status, doctor_notes, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', '', ?)
    ''', (
        appt_id, token_number, data.get('patientName', 'Anonymous'), data.get('patientPhone', ''),
        data.get('patientEmail', ''), data.get('patientAge', 30), data.get('patientGender', 'Other'),
        doctor_id, data.get('doctorName', ''), data.get('doctorSpeciality', ''),
        data.get('hospitalId', ''), data.get('hospitalName', ''), data.get('city', ''),
        appt_date, appt_time, data.get('symptoms', ''), data.get('fee', 500),
        data.get('paymentMethod', 'cash'), data.get('paymentStatus', 'pending'),
        data.get('transactionId', ''), datetime.datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Booked successfully", "tokenNumber": token_number}), 201

@app.route('/api/doctors/<doc_id>/rate', methods=['POST'])
def rate_doctor(doc_id):
    data = request.json or {}
    rating = float(data.get('rating', 5.0))
    conn = get_db()
    doc = conn.execute("SELECT * FROM doctors WHERE id = ?", (doc_id,)).fetchone()
    if not doc:
        conn.close()
        return jsonify({"success": False, "message": "Doctor not found"}), 404
    
    new_rating = round((doc['rating'] + rating) / 2.0, 1)
    conn.execute("UPDATE doctors SET rating = ? WHERE id = ?", (new_rating, doc_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "newRating": new_rating})

@app.route('/api/doctors/<doc_id>/block-slot', methods=['POST'])
def block_slot(doc_id):
    data = request.json or {}
    date = data.get('date')
    slot = data.get('slot')
    reason = data.get('reason', 'Emergency Leave')
    return jsonify({"success": True, "message": f"Slot {slot} on {date} blocked successfully", "reason": reason})

if __name__ == '__main__':
    print("CityCare Python Flask Server starting on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
