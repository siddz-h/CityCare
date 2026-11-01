import React, { useState, useEffect } from 'react';
import { Hospital, Doctor, Appointment, AuditLog, ReportSummary, User, AuthorizedAdmin } from '../types';
import { api } from '../services/api';
import {
  Building2,
  Stethoscope,
  Calendar,
  DollarSign,
  Download,
  Plus,
  Trash2,
  ShieldCheck,
  Activity,
  BarChart3,
  Clock,
  CheckCircle,
  UserPlus,
  UserCheck,
  ShieldAlert,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Lock,
  Mail,
  User as UserIcon,
} from 'lucide-react';

interface AdminDashboardProps {
  hospitals: Hospital[];
  doctors: Doctor[];
  appointments: Appointment[];
  auditLogs: AuditLog[];
  currentUser?: User | null;
  onRefresh: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  hospitals,
  doctors,
  appointments,
  auditLogs,
  currentUser,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'hospitals' | 'doctors' | 'logs' | 'rbac'>('overview');
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  // RBAC Access Delegation States
  const ROOT_ADMIN_EMAIL = 'bhavsarvaibhav001@gmail.com';
  const isRootAdmin = (currentUser?.email || '').trim().toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();

  const [authorizedAdmins, setAuthorizedAdmins] = useState<AuthorizedAdmin[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminNotes, setNewAdminNotes] = useState('');
  const [rbacLoading, setRbacLoading] = useState(false);
  const [rbacMessage, setRbacMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load authorized admins
  const fetchAdmins = async () => {
    try {
      const data = await api.getAuthorizedAdmins();
      setAuthorizedAdmins(data.authorizedAdmins || []);
    } catch (err) {
      console.error('Failed to load authorized admins', err);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, [activeTab]);

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRootAdmin) {
      setRbacMessage({
        type: 'error',
        text: `Permission Denied: Only ${ROOT_ADMIN_EMAIL} can grant administrator access.`
      });
      return;
    }
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setRbacMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }

    setRbacLoading(true);
    setRbacMessage(null);
    try {
      const res = await api.grantAdminAccess(
        currentUser?.email || ROOT_ADMIN_EMAIL,
        newAdminEmail.trim(),
        newAdminName.trim() || 'Delegated Administrator',
        newAdminNotes.trim() || 'Granted by Primary Super Admin'
      );
      setAuthorizedAdmins(res.authorizedAdmins || []);
      setRbacMessage({
        type: 'success',
        text: `Success! Administrator privileges granted to ${newAdminEmail}. They can now sign in to Administrator Dashboard.`
      });
      setNewAdminEmail('');
      setNewAdminName('');
      setNewAdminNotes('');
      onRefresh();
    } catch (err: any) {
      setRbacMessage({ type: 'error', text: err.message || 'Failed to grant admin access.' });
    } finally {
      setRbacLoading(false);
    }
  };

  const handleRevokeAccess = async (targetEmail: string) => {
    if (!isRootAdmin) {
      alert(`Permission Denied: Only ${ROOT_ADMIN_EMAIL} can revoke administrator access.`);
      return;
    }
    if (targetEmail.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase()) {
      alert(`Primary Root Administrator (${ROOT_ADMIN_EMAIL}) cannot be revoked.`);
      return;
    }

    if (confirm(`Are you sure you want to revoke Administrator access from ${targetEmail}? They will no longer be able to access the Administrator portal.`)) {
      setRbacLoading(true);
      setRbacMessage(null);
      try {
        const res = await api.revokeAdminAccess(currentUser?.email || ROOT_ADMIN_EMAIL, targetEmail);
        setAuthorizedAdmins(res.authorizedAdmins || []);
        setRbacMessage({
          type: 'success',
          text: `Administrator access for ${targetEmail} has been successfully revoked.`
        });
        onRefresh();
      } catch (err: any) {
        setRbacMessage({ type: 'error', text: err.message || 'Failed to revoke admin access.' });
      } finally {
        setRbacLoading(false);
      }
    }
  };

  // New hospital modal
  const [showAddHospital, setShowAddHospital] = useState(false);
  const [newHospName, setNewHospName] = useState('');
  const [newHospCity, setNewHospCity] = useState('Mumbai');
  const [newHospAddress, setNewHospAddress] = useState('');
  const [newHospPhone, setNewHospPhone] = useState('+91 22 2800 1100');
  const [newHospDepts, setNewHospDepts] = useState('General Medicine, Cardiology, Orthopedics');

  // New doctor modal
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpec, setNewDocSpec] = useState('General Medicine');
  const [newDocHospId, setNewDocHospId] = useState(hospitals[0]?.id || '');
  const [newDocFee, setNewDocFee] = useState('500');
  const [newDocPhone, setNewDocPhone] = useState('+91 98000 11223');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getReportSummary();
        setSummary(data);
      } catch (e) {
        console.error(e);
      }
    };
    fetchSummary();
  }, [appointments, hospitals, doctors]);

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHospName || !newHospCity || !newHospAddress) return;

    try {
      await api.createHospital({
        name: newHospName,
        city: newHospCity,
        address: newHospAddress,
        phone: newHospPhone,
        departments: newHospDepts.split(',').map((s) => s.trim()),
      });
      setShowAddHospital(false);
      setNewHospName('');
      setNewHospAddress('');
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteHospital = async (id: string) => {
    if (confirm('Are you sure you want to delete this hospital?')) {
      try {
        await api.deleteHospital(id);
        onRefresh();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName || !newDocSpec || !newDocHospId) return;

    try {
      await api.createDoctor({
        name: newDocName,
        speciality: newDocSpec,
        hospitalId: newDocHospId,
        fee: parseInt(newDocFee) || 500,
        phone: newDocPhone,
      });
      setShowAddDoc(false);
      setNewDocName('');
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (confirm('Are you sure you want to remove this doctor?')) {
      try {
        await api.deleteDoctor(id);
        onRefresh();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const exportCSV = () => {
    const headers = ['Token', 'Patient', 'Phone', 'Doctor', 'Speciality', 'Hospital', 'City', 'Date', 'Time', 'Fee', 'PaymentMethod', 'Status'];
    const rows = appointments.map((a) => [
      a.tokenNumber,
      `"${a.patientName}"`,
      a.patientPhone,
      `"${a.doctorName}"`,
      a.doctorSpeciality,
      `"${a.hospitalName}"`,
      a.city,
      a.appointmentDate,
      a.appointmentTime,
      a.fee,
      a.paymentMethod,
      a.status,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CityCare_Appointments_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const paidApts = appointments.filter((a) => a.paymentStatus === 'paid');
  const totalRev = paidApts.reduce((acc, curr) => acc + (curr.fee || 0), 0);
  const onlineRev = paidApts.filter((a) => a.paymentMethod === 'demo_online').reduce((acc, c) => acc + (c.fee || 0), 0);
  const cashRev = paidApts.filter((a) => a.paymentMethod === 'cash').reduce((acc, c) => acc + (c.fee || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-md">
        <div>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-teal-500 text-slate-950 uppercase tracking-wider">
            System Administrator Console
          </span>
          <h2 className="text-2xl font-bold tracking-tight mt-2">
            Hospital & Appointment Operations
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg">
            Monitor healthcare network analytics, audit logs, manage affiliated hospitals and medical specialists.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Analytics Report (CSV)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Bookings</span>
            <Calendar className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{appointments.length}</div>
          <span className="text-[11px] text-teal-700 font-semibold mt-1 block">
            {appointments.filter(a => a.appointmentDate === new Date().toISOString().split('T')[0]).length} bookings today
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Network Hospitals</span>
            <Building2 className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{hospitals.length}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Across 4+ Tier-1 Cities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Active Doctors</span>
            <Stethoscope className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">{doctors.length}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Covering 10+ Specialities
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Revenue Collected</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">₹{totalRev}</div>
          <span className="text-[11px] text-slate-500 font-medium mt-1 block">
            Demo Online: ₹{onlineRev} • Cash: ₹{cashRev}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 flex-wrap">
        {[
          { id: 'overview', label: 'Analytics & Distribution' },
          { id: 'reports', label: 'All Appointment Records' },
          { id: 'hospitals', label: 'Manage Hospitals' },
          { id: 'doctors', label: 'Manage Doctors' },
          { id: 'logs', label: 'System Audit Logs' },
          { id: 'rbac', label: '🛡️ Admin Access & Delegation' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab: Overview / Analytics */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Department Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-teal-600" />
              Speciality / Department Booking Share
            </h3>

            <div className="space-y-3">
              {['Cardiology', 'Orthopedics', 'General Medicine', 'Neurology', 'Pulmonology', 'Dental', 'Pediatrics'].map((dept) => {
                const count = appointments.filter((a) => a.doctorSpeciality === dept).length;
                const pct = appointments.length > 0 ? Math.round((count / appointments.length) * 100) : 0;

                return (
                  <div key={dept} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">{dept}</span>
                      <span className="text-slate-500">{count} bookings ({pct}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-teal-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Appointment Status Breakdown */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-teal-600" />
              Consultation Status Distribution
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Completed', count: appointments.filter(a => a.status === 'completed').length, color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
                { label: 'Checked In', count: appointments.filter(a => a.status === 'checked_in').length, color: 'bg-blue-50 text-blue-800 border-blue-200' },
                { label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length, color: 'bg-amber-50 text-amber-800 border-amber-200' },
                { label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length, color: 'bg-rose-50 text-rose-800 border-rose-200' },
                { label: 'No-Show', count: appointments.filter(a => a.status === 'no_show').length, color: 'bg-slate-100 text-slate-700 border-slate-200' },
                { label: 'Rescheduled', count: appointments.filter(a => a.status === 'rescheduled').length, color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
              ].map((item, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${item.color}`}>
                  <span className="text-xs font-bold block">{item.label}</span>
                  <span className="text-2xl font-black mt-1 block">{item.count}</span>
                </div>
              ))}
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs text-slate-600">
              <ShieldCheck className="w-4 h-4 text-teal-600 inline mr-1" />
              Zero double-bookings recorded: Database concurrency locks prevent overlapping slots.
            </div>
          </div>
        </div>
      )}

      {/* Tab: All Reports */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Central Appointment Registry ({appointments.length})
            </h3>
            <button
              onClick={exportCSV}
              className="text-xs text-teal-700 font-bold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-bold text-[10px] tracking-wider border-b">
                <tr>
                  <th className="p-3 pl-6">Token</th>
                  <th className="p-3">Patient</th>
                  <th className="p-3">Doctor</th>
                  <th className="p-3">Hospital</th>
                  <th className="p-3">Date & Slot</th>
                  <th className="p-3">Fee / Payment</th>
                  <th className="p-3 pr-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60">
                    <td className="p-3 pl-6 font-mono font-bold text-teal-800">{a.tokenNumber}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{a.patientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{a.patientPhone}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{a.doctorName}</div>
                      <div className="text-[10px] text-teal-700">{a.doctorSpeciality}</div>
                    </td>
                    <td className="p-3 text-slate-600 truncate max-w-[150px]">{a.hospitalName}</td>
                    <td className="p-3">
                      <div className="font-medium text-slate-800">{a.appointmentDate}</div>
                      <div className="text-[10px] text-slate-400">{a.appointmentTime}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">₹{a.fee}</div>
                      <div className="text-[10px] text-slate-500 capitalize">{a.paymentMethod} • {a.paymentStatus}</div>
                    </td>
                    <td className="p-3 pr-6">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700">
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Hospitals Management */}
      {activeTab === 'hospitals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Affiliated Hospital Facilities ({hospitals.length})
            </h3>
            <button
              onClick={() => setShowAddHospital(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Hospital</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hospitals.map((hosp) => (
              <div key={hosp.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{hosp.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-50 text-teal-800 font-bold">{hosp.city}</span>
                  </div>
                  <p className="text-xs text-slate-500">{hosp.address}</p>
                  <p className="text-xs text-teal-700 font-mono">📞 {hosp.phone} • {hosp.beds} Beds</p>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {hosp.departments.map((d, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-100 text-[10px] text-slate-600 font-medium">
                        {d}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteHospital(hosp.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Remove Hospital"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Doctors Management */}
      {activeTab === 'doctors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
              Enrolled Medical Doctors ({doctors.length})
            </h3>
            <button
              onClick={() => setShowAddDoc(true)}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Specialist</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <img
                    src={doc.avatar || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80'}
                    alt={doc.name}
                    className="w-12 h-12 rounded-xl object-cover border"
                  />
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-900 text-sm">{doc.name}</div>
                    <div className="text-xs text-teal-700 font-semibold">{doc.speciality} Specialist • Fee: ₹{doc.fee}</div>
                    <div className="text-xs text-slate-500">{doc.hospitalName} ({doc.city})</div>
                    <div className="text-[11px] text-slate-400">Available: {doc.availableDays.join(', ')}</div>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteDoctor(doc.id)}
                  className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                  title="Remove Doctor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: System Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              Security & Action Audit Logs
            </h3>
            <span className="text-xs text-slate-400">Showing recent system activities</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-3.5 hover:bg-slate-50 flex items-start justify-between gap-4 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-800">
                      {log.action}
                    </span>
                    <span className="font-semibold text-slate-900">{log.user}</span>
                  </div>
                  <p className="text-slate-600 mt-1">{log.details}</p>
                </div>
                <div className="text-[11px] text-slate-400 whitespace-nowrap font-mono">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Administrator RBAC & Access Delegation */}
      {activeTab === 'rbac' && (
        <div className="space-y-6">
          {/* Master Policy Banner */}
          <div className="rounded-3xl p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white border border-purple-500/30 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-200 border border-purple-500/40">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Role-Based Access Control (RBAC) Enforcement</span>
                </div>
                <h3 className="text-xl font-extrabold text-white tracking-tight mt-1">
                  Master Administrator Authority Policy
                </h3>
                <p className="text-xs text-purple-200/80 max-w-2xl leading-relaxed">
                  Administrator access is strictly restricted to <span className="text-purple-300 font-bold font-mono">bhavsarvaibhav001@gmail.com</span>.
                  Only this account holds the master permission to grant, delegate, or revoke Administrator access across the entire healthcare system.
                </p>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {isRootAdmin ? (
                  <div className="px-4 py-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs flex items-center gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-white">Master Root Session Active</div>
                      <div className="text-[11px] text-emerald-300">Granting & Revoking Enabled</div>
                    </div>
                  </div>
                ) : (
                  <div className="px-4 py-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 text-xs flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 text-indigo-300 shrink-0" />
                    <div>
                      <div className="font-bold text-white">Delegated Admin Session</div>
                      <div className="text-[11px] text-indigo-300">Delegation Reserved for Root Admin</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Feedback Notification */}
          {rbacMessage && (
            <div
              className={`p-4 rounded-2xl border text-xs font-semibold flex items-center justify-between gap-3 ${
                rbacMessage.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {rbacMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{rbacMessage.text}</span>
              </div>
              <button
                onClick={() => setRbacMessage(null)}
                className="text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Delegation Action Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Form Column */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-sm text-slate-900">
                      Grant Administrator Access
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Assign administrative privileges to a team member
                    </p>
                  </div>
                </div>
                {isRootAdmin ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Authorized
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" /> Locked
                  </span>
                )}
              </div>

              {isRootAdmin ? (
                <form onSubmit={handleGrantAccess} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Account Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="email"
                        required
                        value={newAdminEmail}
                        onChange={(e) => setNewAdminEmail(e.target.value)}
                        placeholder="e.g. colleague@hospital.org"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        required
                        value={newAdminName}
                        onChange={(e) => setNewAdminName(e.target.value)}
                        placeholder="e.g. Dr. Rajesh Sharma"
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Designation Notes
                    </label>
                    <input
                      type="text"
                      value={newAdminNotes}
                      onChange={(e) => setNewAdminNotes(e.target.value)}
                      placeholder="e.g. Medical Superintendent / Operations Dean"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={rbacLoading}
                    className="w-full py-2.5 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {rbacLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4" />
                        <span>Grant Administrator Access</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <Lock className="w-4 h-4 text-amber-700" />
                    <span>Delegation Authority Restricted</span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    You are logged in as a delegated administrator. Per system access policy, only the primary root administrator (<strong>{ROOT_ADMIN_EMAIL}</strong>) is allowed to grant administrator access to other accounts.
                  </p>
                </div>
              )}
            </div>

            {/* Information & Architecture Box */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                    <Key className="w-4 h-4" />
                  </div>
                  <h4 className="font-extrabold text-sm text-slate-900">
                    How Administrator Delegation Works
                  </h4>
                </div>

                <div className="space-y-2 text-xs text-slate-600 leading-relaxed">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Root Super Admin Authority:</span>{' '}
                      <strong>{ROOT_ADMIN_EMAIL}</strong> is hardwired as the permanent Master Administrator. It cannot be revoked or locked out.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Exclusive Granting Permission:</span>{' '}
                      Only {ROOT_ADMIN_EMAIL} can authorize other email addresses. Anyone attempting unauthorized admin logins will receive an immediate HTTP 403 Forbidden security block.
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">Revocation & Audit Logging:</span>{' '}
                      Granted administrators can be revoked at any time by {ROOT_ADMIN_EMAIL}. Every grant, revocation, and unauthorized login attempt is recorded in the immutable audit trail.
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-200/70 text-[11px] text-purple-900 font-medium flex items-center justify-between">
                <span>Active Authorized Admins: <strong>{authorizedAdmins.filter(a => a.status === 'active').length}</strong></span>
                <span className="text-purple-700">Root Master: {ROOT_ADMIN_EMAIL}</span>
              </div>
            </div>
          </div>

          {/* Authorized Administrators Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">
                  Authorized Administrator Directory
                </h4>
                <p className="text-xs text-slate-500">
                  Accounts with clearance to access hospital operations and audit controls
                </p>
              </div>
              <button
                onClick={fetchAdmins}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Refresh List
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Administrator</th>
                    <th className="py-3 px-4">Clearance Tier</th>
                    <th className="py-3 px-4">Granted By</th>
                    <th className="py-3 px-4">Granted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {authorizedAdmins.map((admin) => {
                    const isTargetRoot = admin.email.toLowerCase() === ROOT_ADMIN_EMAIL.toLowerCase();
                    return (
                      <tr key={admin.email} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isTargetRoot ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                            }`}>
                              {admin.name.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{admin.name}</span>
                                {isTargetRoot && (
                                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 uppercase">
                                    Root
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-500 font-mono">{admin.email}</div>
                              {admin.notes && (
                                <div className="text-[10px] text-slate-400 italic">{admin.notes}</div>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isTargetRoot ? (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                              👑 Primary Super Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              🛡️ Delegated Admin
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                          {admin.grantedBy}
                        </td>

                        <td className="py-3 px-4 text-slate-500 text-[11px]">
                          {admin.grantedAt ? new Date(admin.grantedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Initial Seed'}
                        </td>

                        <td className="py-3 px-4">
                          {admin.status === 'active' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Revoked
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4 text-right">
                          {isTargetRoot ? (
                            <span className="text-[11px] font-bold text-slate-400 italic">
                              Permanent Master
                            </span>
                          ) : admin.status === 'active' ? (
                            isRootAdmin ? (
                              <button
                                onClick={() => handleRevokeAccess(admin.email)}
                                disabled={rbacLoading}
                                className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Revoke Access</span>
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-medium">
                                Active Delegated
                              </span>
                            )
                          ) : (
                            <span className="text-[11px] text-rose-600 font-semibold">
                              Access Inactive
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Security & RBAC Audit Event Stream */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-700" />
                <span>RBAC Security Activity Trail</span>
              </h4>
              <span className="text-[11px] text-slate-400">
                Audited security & permission events
              </span>
            </div>

            <div className="space-y-2">
              {auditLogs
                .filter(
                  (log) =>
                    log.action.includes('ADMIN') ||
                    log.action.includes('SECURITY') ||
                    log.action.includes('REGISTER')
                )
                .slice(0, 5)
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            log.action.includes('ALERT') || log.action.includes('DENIED')
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {log.action}
                        </span>
                        <span className="font-bold text-slate-900">{log.user}</span>
                      </div>
                      <p className="text-slate-600 mt-1 text-[11px]">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Hospital Modal */}
      {showAddHospital && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddHospital} className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Add New Hospital Facility</h3>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Hospital Name</label>
              <input
                type="text"
                required
                value={newHospName}
                onChange={(e) => setNewHospName(e.target.value)}
                placeholder="e.g. Apollo Super Speciality"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">City</label>
              <input
                type="text"
                required
                value={newHospCity}
                onChange={(e) => setNewHospCity(e.target.value)}
                placeholder="e.g. Mumbai, Pune, Delhi"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Address</label>
              <input
                type="text"
                required
                value={newHospAddress}
                onChange={(e) => setNewHospAddress(e.target.value)}
                placeholder="Street and Area address"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Phone</label>
              <input
                type="text"
                value={newHospPhone}
                onChange={(e) => setNewHospPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddHospital(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl">Save Hospital</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Doctor Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleAddDoctor} className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-base">Enroll Medical Specialist</h3>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Doctor Name</label>
              <input
                type="text"
                required
                value={newDocName}
                onChange={(e) => setNewDocName(e.target.value)}
                placeholder="e.g. Dr. Rajesh Sharma"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Speciality</label>
              <input
                type="text"
                required
                value={newDocSpec}
                onChange={(e) => setNewDocSpec(e.target.value)}
                placeholder="e.g. Cardiology, Orthopedics"
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">Assign Hospital</label>
              <select
                value={newDocHospId}
                onChange={(e) => setNewDocHospId(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
              >
                {hospitals.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.city})
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Fee (₹)</label>
                <input
                  type="number"
                  value={newDocFee}
                  onChange={(e) => setNewDocFee(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={newDocPhone}
                  onChange={(e) => setNewDocPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowAddDoc(false)} className="px-4 py-2 text-xs font-semibold text-slate-600">Cancel</button>
              <button type="submit" className="px-5 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl">Add Doctor</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
