import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Lock,
  Mail,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldAlert,
  Eye,
  EyeOff,
  LogOut,
} from 'lucide-react';

export default function UserProfileModal({
  isOpen,
  onClose,
  user,
  onLogout,
  onSwitchToAdmin,
  isDark = false,
}) {
  const [adminPassword, setAdminPassword] = useState('');
  const [adminEmail, setAdminEmail] = useState(user?.email || '');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  const handleAdminAuth = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const targetEmail = adminEmail.trim().toLowerCase();
    if (!targetEmail) {
      setErrorMsg('Please provide an administrator email.');
      return;
    }
    if (!adminPassword) {
      setErrorMsg('Please enter administrator password.');
      return;
    }

    setAdminAuthLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          password: adminPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Invalid administrative credentials.');
      }

      setSuccessMsg('Administrator credentials verified successfully.');
      if (typeof window !== 'undefined') {
        localStorage.setItem('study_admin_token', data.token);
      }

      setTimeout(() => {
        if (onSwitchToAdmin) {
          onSwitchToAdmin(data.user, data.token);
        }
        onClose();
      }, 500);
    } catch (err) {
      setErrorMsg(err.message || 'Authentication error.');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        zIndex: 1080,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`w-100 rounded-3xl border shadow-2xl p-4 transition-all ${
          isDark ? 'bg-neutral-950 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ maxWidth: '500px' }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <User size={20} />
            </div>
            <div>
              <h5 className="fw-bold mb-0">User Profile & Access Control</h5>
              <span className="small text-muted">{user?.email || 'Active Session'}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-link text-muted p-1"
          >
            <X size={20} />
          </button>
        </div>

        {/* User Card */}
        <div className={`p-3 rounded-2xl border mb-3 ${
          isDark ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold">{user?.name || 'Study Scholar'}</span>
            <span className={`badge rounded-pill small px-2.5 py-1 ${
              user?.role === 'admin'
                ? 'bg-danger-subtle text-danger border border-danger-subtle'
                : 'bg-primary-subtle text-primary border border-primary-subtle'
            }`}>
              {user?.role?.toUpperCase() || 'STUDENT RESEARCHER'}
            </span>
          </div>
          <div className="small text-muted mb-2">{user?.email || 'scholar@study.ai'}</div>
          <div className="d-flex justify-content-between align-items-center pt-2 border-top small text-muted">
            <span>Status: <strong className="text-success">Active & Verified</strong></span>
            <span>Platform: <strong className="text-primary">StudyAI Node</strong></span>
          </div>
        </div>

        {/* Switch to Admin Mode Section */}
        <div className={`p-3.5 rounded-2xl border mb-3 ${
          isDark ? 'bg-red-950/20 border-red-900/40 text-red-100' : 'bg-red-50/70 border-red-200 text-red-950'
        }`}>
          <div className="d-flex align-items-center gap-2 mb-2 text-danger fw-bold small text-uppercase">
            <ShieldAlert size={16} />
            <span>Elevate Privileges: Switch to Admin Mode</span>
          </div>
          <p className="small opacity-90 mb-3">
            Enter administrative credentials (Admin 1 or Admin 2) to unlock the protected Admin Portal, review access requests, and manage server quotas.
          </p>

          {successMsg && (
            <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small rounded-xl mb-2">
              <CheckCircle2 size={16} />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-xl mb-2">
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleAdminAuth}>
            <div className="mb-2">
              <label className="form-label small fw-semibold mb-1">Admin Email:</label>
              <div className="input-group input-group-sm">
                <span className={`input-group-text ${isDark ? 'bg-neutral-900 border-neutral-700 text-slate-400' : 'bg-white'}`}>
                  <Mail size={14} />
                </span>
                <input
                  type="email"
                  required
                  placeholder="sarthaklove71@gmail.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  className={`form-control ${isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white'}`}
                  disabled={adminAuthLoading}
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold mb-1">Admin Password:</label>
              <div className="input-group input-group-sm">
                <span className={`input-group-text ${isDark ? 'bg-neutral-900 border-neutral-700 text-slate-400' : 'bg-white'}`}>
                  <KeyRound size={14} />
                </span>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className={`form-control ${isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-white'}`}
                  disabled={adminAuthLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  className={`btn btn-sm border-start-0 ${isDark ? 'btn-dark border-neutral-700' : 'btn-light border'}`}
                >
                  {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="btn btn-danger btn-sm rounded-pill w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 shadow-sm"
            >
              <Shield size={14} />
              <span>{adminAuthLoading ? 'Authenticating...' : 'Verify Credentials & Open Admin Portal'}</span>
            </button>
          </form>
        </div>

        {/* Footer Logout */}
        <div className="d-flex justify-content-between align-items-center pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              if (onLogout) onLogout();
              onClose();
            }}
            className="btn btn-sm btn-outline-danger rounded-pill px-3.5 py-1.5 fw-medium d-flex align-items-center gap-1.5"
          >
            <LogOut size={14} />
            <span>Sign Out Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}
