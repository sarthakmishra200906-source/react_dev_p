import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, AlertCircle, Sparkles, User, Mail, FileText } from 'lucide-react';

export default function AccessRequestModal({
  isOpen,
  onClose,
  isDark = false,
  prefillEmail = '',
  prefillName = '',
  onOpenRegister,
}) {
  const [name, setName] = useState(prefillName || '');
  const [email, setEmail] = useState(prefillEmail || '');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      if (prefillEmail) setEmail(prefillEmail);
      if (prefillName) setName(prefillName);
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen, prefillEmail, prefillName]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!reason.trim()) {
      setErrorMsg('Please state your research or study purpose.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/request-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason: reason.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Could not submit access request.');
      }

      setSuccessMsg(data.message || 'Access request received! An administrator will review your application.');
      setName('');
      setEmail('');
      setReason('');
    } catch (err) {
      setErrorMsg(err.message || 'Network error while submitting access request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
      style={{
        zIndex: 1060,
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div
        className={`w-100 rounded-3xl border shadow-2xl p-4 transition-all ${
          isDark ? 'bg-neutral-950 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        style={{ maxWidth: '520px' }}
      >
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
          <div className="d-flex align-items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h5 className="fw-bold mb-0">Request Server Access</h5>
              <span className="small text-muted">StudyAI Secured Node Gateway</span>
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

        {/* Informative Security Banner */}
        <div className={`p-3 rounded-2xl border mb-3 small ${
          isDark ? 'bg-slate-900/80 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <div className="d-flex align-items-center gap-2 fw-semibold text-primary mb-1">
            <Sparkles size={15} />
            <span>Host Server Permission Protocol</span>
          </div>
          Submit your details to obtain approved access to the Multi-Vector RAG Engine and Deep Research features.
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small rounded-2xl mb-3">
            <CheckCircle2 size={18} className="flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="alert alert-danger d-flex flex-column gap-1 py-2 px-3 small rounded-2xl mb-3">
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.toLowerCase().includes('register') && typeof onOpenRegister === 'function' && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegister();
                }}
                className="btn btn-sm btn-outline-danger rounded-pill mt-1 py-1 text-decoration-none fw-semibold align-self-start"
              >
                Create Account / Register First →
              </button>
            )}
          </div>
        )}

        {/* Request Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1.5 mb-1">
              <User size={14} /> Full Name
            </label>
            <input
              type="text"
              required
              className={`form-control form-control-sm rounded-xl ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              placeholder="e.g. Dr. Alex Vance"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="mb-3">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1.5 mb-1">
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              required
              className={`form-control form-control-sm rounded-xl ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              placeholder="alex@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="mb-4">
            <label className="form-label small fw-semibold text-muted d-flex align-items-center gap-1.5 mb-1">
              <FileText size={14} /> Reason for Access / Research Topic
            </label>
            <textarea
              rows={3}
              required
              className={`form-control form-control-sm rounded-xl ${
                isDark ? 'bg-neutral-900 border-neutral-700 text-white' : 'bg-slate-50 border-slate-200'
              }`}
              placeholder="Describe what academic resources, theorem synthesis, or course materials you will be studying..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={submitting}
            />
          </div>

          <div className="d-flex justify-content-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-medium ${
                isDark ? 'btn-dark border-neutral-700 text-slate-300' : 'btn-light border'
              }`}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary rounded-pill px-4 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
              disabled={submitting}
            >
              <Send size={14} />
              <span>{submitting ? 'Submitting...' : 'Send Access Request'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
