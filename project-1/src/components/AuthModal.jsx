import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Mail,
  User,
  CheckSquare,
  Square,
  ArrowRight,
  ShieldCheck,
  Eye,
  EyeOff,
  KeyRound,
  Check,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  onLoginSuccess,
  onLogin,
  isDark = false,
  initialTab = 'login',
}) {
  const [tab, setTab] = useState(initialTab || 'login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  // Password Visibility State (Eye button)
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Forgot Password States
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');

  // Sync tab with initialTab whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setTab(initialTab || 'login');
      setResetError('');
      setResetSuccess('');
      setShowPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleAuthCallback = (userObj) => {
    if (typeof onLoginSuccess === 'function') {
      onLoginSuccess(userObj, rememberMe);
    } else if (typeof onLogin === 'function') {
      onLogin(userObj, rememberMe);
    }
  };

  const handleSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const userObj = {
      name: name.trim() || (email ? email.split('@')[0] : 'Study Scholar'),
      email: email.trim() || 'scholar@study.ai',
      role: 'Student Researcher',
      authenticated: true,
    };

    if (rememberMe) {
      try {
        localStorage.setItem('study_auth_user', JSON.stringify(userObj));
      } catch (err) {}
    }

    handleAuthCallback(userObj);
    onClose();
  };

  const handleResetPassword = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setResetError('');

    if (!email.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    if (newPassword.length < 4) {
      setResetError('Password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    // Update password in local storage & create updated session
    const userObj = {
      name: email.split('@')[0],
      email: email.trim(),
      role: 'Student Researcher',
      authenticated: true,
      lastPasswordReset: new Date().toISOString(),
    };

    try {
      localStorage.setItem('study_auth_user', JSON.stringify(userObj));
    } catch (err) {}

    setResetSuccess('Password updated successfully! Redirecting to workspace...');
    setTimeout(() => {
      handleAuthCallback(userObj);
      onClose();
    }, 900);
  };

  const handleGuestLogin = () => {
    const guestObj = {
      name: 'Guest Scholar',
      email: 'guest@study.ai',
      role: 'Demo Mode',
      authenticated: true,
    };
    if (rememberMe) {
      try {
        localStorage.setItem('study_auth_user', JSON.stringify(guestObj));
      } catch (err) {}
    }
    handleAuthCallback(guestObj);
    onClose();
  };

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', zIndex: 1100 }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div
          className={`modal-content rounded-3xl border shadow-2xl ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* Modal Header */}
          <div className="modal-header border-bottom-0 pb-0 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle bg-primary text-white p-2 d-flex align-items-center justify-content-center">
                {tab === 'forgot' ? <KeyRound size={20} /> : <ShieldCheck size={20} />}
              </div>
              <h5 className="modal-title fw-bold mb-0">
                {tab === 'login' && 'Welcome Back'}
                {tab === 'register' && 'Create Workspace Account'}
                {tab === 'forgot' && 'Reset Password'}
              </h5>
            </div>
            <button
              type="button"
              className={`btn-close ${isDark ? 'btn-close-white' : ''}`}
              onClick={onClose}
              aria-label="Close"
            />
          </div>

          <div className="modal-body p-4 pt-2">
            <p className="small text-muted mb-3">
              {tab === 'login' &&
                'Sign in to access your multi-resource library, concept flowchart, and deep research tools.'}
              {tab === 'register' &&
                'Join now to save up to 50 study materials and sync with Obsidian & Google Calendar.'}
              {tab === 'forgot' &&
                'Enter your account email and specify a new secure password to restore full access.'}
            </p>

            {/* Mode Tabs (Sign In / Register) */}
            {tab !== 'forgot' ? (
              <div className="btn-group w-100 mb-3.5 p-1 rounded-pill bg-slate-100 border">
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-semibold ${
                    tab === 'login' ? 'btn-primary text-white shadow-sm' : 'btn-link text-muted text-decoration-none'
                  }`}
                  onClick={() => setTab('login')}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`btn btn-sm rounded-pill fw-semibold ${
                    tab === 'register' ? 'btn-primary text-white shadow-sm' : 'btn-link text-muted text-decoration-none'
                  }`}
                  onClick={() => setTab('register')}
                >
                  Register
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setTab('login')}
                className="btn btn-sm btn-link text-decoration-none p-0 d-inline-flex align-items-center gap-1.5 text-muted mb-3"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </button>
            )}

            {/* ================= FORGOT PASSWORD FORM ================= */}
            {tab === 'forgot' ? (
              <form onSubmit={handleResetPassword} className="d-flex flex-column gap-3">
                {resetError && (
                  <div className="alert alert-danger py-2 px-3 small rounded-2xl d-flex align-items-center gap-2 mb-0">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{resetError}</span>
                  </div>
                )}
                {resetSuccess && (
                  <div className="alert alert-success py-2 px-3 small rounded-2xl d-flex align-items-center gap-2 mb-0">
                    <Check size={16} className="flex-shrink-0" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div>
                  <label className="form-label small fw-medium mb-1">Your Registered Email:</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-medium mb-1">New Password:</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : ''
                      }`}
                      placeholder="Enter at least 4 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn btn-sm input-group-text border-start-0 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          : 'bg-transparent text-slate-500 hover:text-dark'
                      }`}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      title={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label small fw-medium mb-1">Confirm New Password:</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : ''
                      }`}
                      placeholder="Re-type new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className={`btn btn-sm input-group-text border-start-0 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          : 'bg-transparent text-slate-500 hover:text-dark'
                      }`}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      title={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary rounded-pill py-2.5 mt-1 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  <span>Update Password & Open Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* ================= LOGIN & REGISTER FORM ================= */
              <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                {tab === 'register' && (
                  <div>
                    <label className="form-label small fw-medium mb-1">Your Full Name:</label>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent">
                        <User size={16} />
                      </span>
                      <input
                        type="text"
                        className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                        placeholder="e.g. Alex Sharma"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="form-label small fw-medium mb-1">Email Address:</label>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent">
                      <Mail size={16} />
                    </span>
                    <input
                      type="email"
                      className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <label className="form-label small fw-medium mb-0">Password:</label>
                    {tab === 'login' && (
                      <button
                        type="button"
                        onClick={() => setTab('forgot')}
                        className="btn btn-link p-0 small text-decoration-none text-primary fw-medium"
                        style={{ fontSize: '0.8rem' }}
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent">
                      <Lock size={16} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`form-control border-end-0 ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : ''
                      }`}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    {/* Eye Show/Hide Password Button */}
                    <button
                      type="button"
                      className={`btn btn-sm input-group-text border-start-0 ${
                        isDark
                          ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                          : 'bg-transparent text-slate-500 hover:text-dark'
                      }`}
                      onClick={() => setShowPassword(!showPassword)}
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Toggle */}
                <div className="d-flex justify-content-between align-items-center mt-1">
                  <div
                    className="d-flex align-items-center gap-2 cursor-pointer user-select-none"
                    onClick={() => setRememberMe(!rememberMe)}
                    style={{ cursor: 'pointer' }}
                  >
                    {rememberMe ? (
                      <CheckSquare size={18} className="text-primary" />
                    ) : (
                      <Square size={18} className="text-muted" />
                    )}
                    <span className="small fw-medium">Remember me on this device</span>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary rounded-pill py-2.5 mt-1 fw-semibold shadow-sm d-flex align-items-center justify-content-center gap-2"
                >
                  <span>{tab === 'login' ? 'Sign In & Open Dashboard' : 'Create Account & Start'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}

            <div className="text-center my-3 position-relative">
              <hr className="my-2" />
              <span
                className={`small px-2 position-absolute top-50 start-50 translate-middle ${
                  isDark ? 'bg-slate-900 text-muted' : 'bg-white text-muted'
                }`}
              >
                or
              </span>
            </div>

            <button
              type="button"
              onClick={handleGuestLogin}
              className={`btn btn-sm w-100 rounded-pill py-2 border fw-medium ${
                isDark ? 'btn-outline-secondary' : 'btn-outline-dark'
              }`}
            >
              Continue as Guest (1-Click Instant Demo)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
