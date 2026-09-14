import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Users,
  Lock,
  Unlock,
  Activity,
  Sliders,
  RefreshCw,
  LogOut,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Wifi,
  FileText,
  Search,
  HardDrive,
  Database,
  Sparkles,
  Globe,
  DollarSign,
  Terminal,
  Settings,
  Copy,
  Check,
} from 'lucide-react';

export default function AdminDashboard({
  adminUser,
  onLogoutAdmin,
  onSwitchToUserPortal,
  isDark = false,
}) {
  const [requests, setRequests] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('requests'); // 'requests' | 'cms' | 'connections' | 'logs'
  const [filterQuery, setFilterQuery] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  const [actionError, setActionError] = useState('');
  const [copiedCli, setCopiedCli] = useState(false);

  // Site CMS & Global Hosting State
  const [cmsConfig, setCmsConfig] = useState({
    live_notice_enabled: true,
    live_schedule_text: 'Live Daily for 2 Hours (18:00 - 20:00 Local Time)',
    live_status: 'ONLINE',
    domain_url: 'https://study.longbrother.org',
    notice_message: '🌐 StudyAI Global Node is live for 2 hours daily! Enjoy fast localized AI study assistance.',
    hero_title: 'Transform Complex Study Materials into Mastery & Action',
    hero_subtitle: 'Next-generation localized RAG study intelligence with zero cloud data leaks and multi-modal synthesis.',
    pricing_tiers: [
      {
        id: 'tier-free',
        name: 'Freemium Starter',
        price: '$0',
        resource_limit: 10,
        query_limit: 10,
        storage_limit_gb: 10,
        features: ['10 Uploaded PDFs & Resources', '10 Active Flashcards & Quiz Items', '10 Deep AI Summaries / Queries', '10 GB Isolated Local Storage']
      },
      {
        id: 'tier-pro',
        name: 'Pro Scholar',
        price: '$9/mo',
        resource_limit: 50,
        query_limit: 100,
        storage_limit_gb: 25,
        features: ['50 Uploaded Study Resources', '100 Daily Deep AI Queries', '50 Flashcards & Quizzes', '25 GB Isolated Storage', 'Obsidian & Markdown Export']
      },
      {
        id: 'tier-unlimited',
        name: 'Enterprise Unlimited',
        price: '$29/mo',
        resource_limit: 9999,
        query_limit: 9999,
        storage_limit_gb: 100,
        features: ['Infinite Resources & PDFs', 'Unlimited Deep AI Synthesis', 'Full Dual-Engine Fallback', '100 GB Isolated Disk Space', '24/7 Priority Support & Access']
      }
    ]
  });

  // Editing limits & time-window state
  const [editLimitModal, setEditLimitModal] = useState(null); // request object being edited
  const [editLimitVal, setEditLimitVal] = useState(50);
  const [editCanUpload, setEditCanUpload] = useState(true);
  const [editIsActive, setEditIsActive] = useState(true);
  const [editTimeWindowEnabled, setEditTimeWindowEnabled] = useState(false);
  const [editStartHour, setEditStartHour] = useState(9);
  const [editEndHour, setEditEndHour] = useState(21);
  const [editIsPaid, setEditIsPaid] = useState(false);
  const [editTier, setEditTier] = useState('tier-free');

  const token = adminUser?.token || (typeof window !== 'undefined' ? localStorage.getItem('study_admin_token') : '');

  const getHeaders = () => {
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setActionError('');
    try {
      const [reqRes, logRes, connRes, cfgRes] = await Promise.all([
        fetch('/api/admin/requests', { headers: getHeaders() }).catch(() => null),
        fetch('/api/admin/audit-logs', { headers: getHeaders() }).catch(() => null),
        fetch('/api/admin/connections', { headers: getHeaders() }).catch(() => null),
        fetch('/api/site-config').catch(() => null),
      ]);

      if (reqRes && reqRes.ok) {
        const reqData = await reqRes.json();
        setRequests(reqData.requests || []);
      }
      if (logRes && logRes.ok) {
        const logData = await logRes.json();
        setAuditLogs(logData.logs || []);
      }
      if (connRes && connRes.ok) {
        const connData = await connRes.json();
        setConnections(connData.connections || []);
      }
      if (cfgRes && cfgRes.ok) {
        const cfgData = await cfgRes.json();
        if (cfgData.config) setCmsConfig(cfgData.config);
        else if (cfgData.live_status) setCmsConfig(cfgData);
      }
    } catch (err) {
      setActionError('Could not load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCmsConfig = async () => {
    setActionError('');
    setActionSuccess('');
    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(cmsConfig),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to save site CMS config.');
      setActionSuccess('Platform CMS, 2-hour schedule, and pricing settings saved successfully!');
    } catch (err) {
      setActionError(err.message);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleUpdatePermission = async (
    requestId,
    status,
    dailyLimit = 50,
    canUpload = true,
    isActive = true,
    timeWindowEnabled = false,
    startHour = 0,
    endHour = 23,
    tier = null,
    isPaid = null
  ) => {
    setActionError('');
    setActionSuccess('');
    try {
      const payload = {
        request_id: requestId,
        status: status,
        daily_query_limit: dailyLimit,
        can_upload: canUpload,
        is_active: isActive,
        time_window_enabled: timeWindowEnabled,
        start_hour: startHour,
        end_hour: endHour,
      };

      if (tier !== null) {
        payload.tier = tier;
        payload.is_paid = tier === 'tier-pro' || tier === 'tier-unlimited' || tier === 'paid';
      } else if (isPaid !== null) {
        payload.is_paid = Boolean(isPaid);
        payload.tier = isPaid ? 'tier-pro' : 'tier-free';
      }

      const res = await fetch('/api/admin/permissions', {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to update permissions.');

      setActionSuccess(`Permissions & plan quotas successfully updated for user.`);
      await fetchAdminData();
      setEditLimitModal(null);
    } catch (err) {
      setActionError(err.message);
    }
  };

  const filteredRequests = requests.filter((r) =>
    !filterQuery.trim() ||
    (r.name && r.name.toLowerCase().includes(filterQuery.toLowerCase())) ||
    (r.email && r.email.toLowerCase().includes(filterQuery.toLowerCase())) ||
    (r.reason && r.reason.toLowerCase().includes(filterQuery.toLowerCase()))
  );

  return (
    <div className={`p-4 rounded-3xl border shadow-lg transition-all ${
      isDark ? 'bg-neutral-950 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Top Admin Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-2xl p-3 text-white d-flex align-items-center justify-content-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #f97316 100%)' }}
          >
            <ShieldCheck size={28} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0">Secure Administrator Portal</h4>
              <span className="badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill small px-2.5 py-1">
                Dual-Admin Gatekeeper
              </span>
            </div>
            <p className="small text-muted mb-0">
              Logged in as <strong>{adminUser?.email || 'Authenticated Admin'}</strong> • Per-User Isolated Storage Node
            </p>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          {onSwitchToUserPortal && (
            <button
              type="button"
              onClick={onSwitchToUserPortal}
              className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
              title="Switch to User Workspace View"
            >
              <span>Switch to User Portal</span>
            </button>
          )}
          <button
            type="button"
            onClick={fetchAdminData}
            disabled={loading}
            className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={onLogoutAdmin}
            className="btn btn-sm btn-outline-danger rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
          >
            <LogOut size={14} />
            <span>Exit Admin Mode</span>
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionSuccess && (
        <div className="alert alert-success d-flex align-items-center gap-2 py-2 px-3 small rounded-2xl mb-3">
          <CheckCircle2 size={16} />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="alert alert-danger d-flex align-items-center gap-2 py-2 px-3 small rounded-2xl mb-3">
          <AlertTriangle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {/* Stats Counter Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-md-4">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-muted fw-semibold">Pending Requests</span>
              <Users size={16} className="text-amber-500" />
            </div>
            <h3 className="fw-bold mt-1 text-amber-500 mb-0">
              {requests.filter((r) => r.status === 'pending').length}
            </h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-muted fw-semibold">Approved Users</span>
              <ShieldCheck size={16} className="text-success" />
            </div>
            <h3 className="fw-bold mt-1 text-success mb-0">
              {requests.filter((r) => r.status === 'approved').length}
            </h3>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className={`p-3 rounded-2xl border ${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
            <div className="d-flex align-items-center justify-content-between">
              <span className="small text-muted fw-semibold">Active Client IPs</span>
              <Wifi size={16} className="text-primary" />
            </div>
            <h3 className="fw-bold mt-1 text-primary mb-0">
              {connections.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className={`btn rounded-start-pill px-3.5 py-1.5 fw-semibold ${
              activeTab === 'requests' ? 'btn-primary text-white' : isDark ? 'btn-dark border-secondary' : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('requests')}
          >
            Access Requests ({requests.length})
          </button>
          <button
            type="button"
            className={`btn px-3.5 py-1.5 fw-semibold ${
              activeTab === 'cms' ? 'btn-primary text-white' : isDark ? 'btn-dark border-secondary' : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('cms')}
          >
            <Globe size={13} className="me-1" />
            Hosting & Pricing CMS
          </button>
          <button
            type="button"
            className={`btn px-3.5 py-1.5 fw-semibold ${
              activeTab === 'connections' ? 'btn-primary text-white' : isDark ? 'btn-dark border-secondary' : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('connections')}
          >
            Active Connections ({connections.length})
          </button>
          <button
            type="button"
            className={`btn rounded-end-pill px-3.5 py-1.5 fw-semibold ${
              activeTab === 'logs' ? 'btn-primary text-white' : isDark ? 'btn-dark border-secondary' : 'btn-outline-secondary'
            }`}
            onClick={() => setActiveTab('logs')}
          >
            Security Audit Logs
          </button>
        </div>

        {activeTab === 'requests' && (
          <div className="d-flex align-items-center gap-2" style={{ maxWidth: '280px' }}>
            <div className="input-group input-group-sm">
              <span className={`input-group-text ${isDark ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-100'}`}>
                <Search size={13} />
              </span>
              <input
                type="text"
                placeholder="Filter requests..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* TAB 1: ACCESS REQUESTS */}
      {activeTab === 'requests' && (
        <div className="table-responsive rounded-2xl border">
          <table className={`table table-hover align-middle mb-0 small ${isDark ? 'table-dark' : ''}`}>
            <thead className={isDark ? 'bg-neutral-900' : 'bg-light'}>
              <tr>
                <th>User Details</th>
                <th>Local Storage & Quota</th>
                <th>Tier & Paid Override</th>
                <th>Status & State</th>
                <th>Time Window</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-4 text-muted">
                    No access requests found matching your filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((r) => {
                  const isPaidUser = Boolean(r.is_paid || r.tier === 'paid');
                  const resCount = r.resource_count || 0;
                  const storageStr = r.storage_used || '0 B';

                  return (
                    <tr key={r.id}>
                      <td>
                        <div className="fw-bold">{r.name}</div>
                        <div className="text-muted small">{r.email}</div>
                        <div className="text-muted" style={{ fontSize: '0.72rem' }}>
                          Reason: {r.reason || 'Study workspace access'}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <div className="d-flex align-items-center gap-1.5 fw-semibold">
                            <HardDrive size={13} className="text-indigo-500" />
                            <span>{storageStr} / {r.storage_max || '10 GB'}</span>
                          </div>
                          <div className="d-flex align-items-center gap-1.5 small text-muted">
                            <Database size={12} />
                            <span>
                              {resCount} / {r.resource_limit >= 9000 ? '∞' : (r.resource_limit || 10)} resources used
                            </span>
                            {r.resource_limit < 9000 && resCount >= (r.resource_limit || 10) && (
                              <span className="badge bg-danger-subtle text-danger rounded-pill px-1.5 py-0.5" style={{ fontSize: '0.65rem' }}>
                                CAP REACHED
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1.5 align-items-start">
                          <span className={`badge rounded-pill small px-2.5 py-1 fw-bold ${
                            r.tier === 'tier-unlimited'
                              ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30'
                              : r.tier === 'tier-pro'
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                          }`}>
                            {r.tier === 'tier-unlimited'
                              ? '👑 UNLIMITED (100 GB)'
                              : r.tier === 'tier-pro'
                              ? '★ PRO SCHOLAR (25 GB)'
                              : 'FREEMIUM (10 GB)'}
                          </span>
                          <select
                            className={`form-select form-select-xs rounded-pill px-2 py-0.5 small ${
                              isDark ? 'bg-neutral-900 text-white border-neutral-700' : 'bg-light border'
                            }`}
                            style={{ fontSize: '0.72rem', minWidth: '130px' }}
                            value={r.tier || 'tier-free'}
                            onChange={(e) =>
                              handleUpdatePermission(
                                r.id,
                                r.status,
                                r.daily_query_limit || 50,
                                r.can_upload !== false,
                                r.is_active !== false,
                                r.time_window_enabled,
                                r.start_hour || 0,
                                r.end_hour || 23,
                                e.target.value
                              )
                            }
                          >
                            <option value="tier-free">Freemium (10 / 10GB)</option>
                            <option value="tier-pro">Pro Scholar (50 / 25GB)</option>
                            <option value="tier-unlimited">Unlimited (9999 / 100GB)</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className={`badge rounded-pill small px-2.5 py-1 ${
                            r.status === 'approved'
                              ? 'bg-success-subtle text-success border border-success-subtle'
                              : r.status === 'revoked'
                              ? 'bg-danger-subtle text-danger border border-danger-subtle'
                              : 'bg-warning-subtle text-warning border border-warning-subtle'
                          }`}>
                            {r.status?.toUpperCase() || 'PENDING'}
                          </span>
                          <span className={`badge rounded-pill small px-2 py-0.5 ${
                            r.is_active !== false
                              ? 'bg-primary-subtle text-primary'
                              : 'bg-secondary-subtle text-secondary'
                          }`}>
                            {r.is_active !== false ? 'ACTIVE' : 'DEACTIVATED'}
                          </span>
                        </div>
                      </td>
                      <td>
                        {r.time_window_enabled ? (
                          <span className="badge bg-info-subtle text-info border border-info-subtle rounded-pill">
                            <Clock size={11} className="me-1" />
                            {String(r.start_hour || 0).padStart(2, '0')}:00 - {String(r.end_hour || 23).padStart(2, '0')}:00
                          </span>
                        ) : (
                          <span className="badge bg-secondary-subtle text-secondary rounded-pill">
                            24/7 Unlimited
                          </span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="btn-group btn-group-sm">
                          {r.status !== 'approved' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdatePermission(r.id, 'approved', r.daily_query_limit || 50, true, true, r.time_window_enabled, r.start_hour || 0, r.end_hour || 23, isPaidUser)}
                              className="btn btn-sm btn-outline-success rounded-pill px-2.5 py-1 d-flex align-items-center gap-1"
                              title="Approve User Access"
                            >
                              <Unlock size={13} /> Approve
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdatePermission(r.id, 'revoked', 0, false, false, r.time_window_enabled, r.start_hour || 0, r.end_hour || 23, isPaidUser)}
                              className="btn btn-sm btn-outline-danger rounded-pill px-2.5 py-1 d-flex align-items-center gap-1"
                              title="Revoke User Access"
                            >
                              <Lock size={13} /> Revoke
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setEditLimitModal(r);
                              setEditLimitVal(r.daily_query_limit || 50);
                              setEditCanUpload(r.can_upload !== false);
                              setEditIsActive(r.is_active !== false);
                              setEditTimeWindowEnabled(Boolean(r.time_window_enabled));
                              setEditStartHour(r.start_hour !== undefined ? r.start_hour : 9);
                              setEditEndHour(r.end_hour !== undefined ? r.end_hour : 21);
                              setEditTier(r.tier || (r.is_paid ? 'tier-pro' : 'tier-free'));
                              setEditIsPaid(Boolean(r.is_paid || r.tier === 'tier-pro' || r.tier === 'tier-unlimited'));
                            }}
                            className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1 ms-1 d-flex align-items-center gap-1"
                            title="Configure Quotas and Time Windows"
                          >
                            <Sliders size={13} /> Gatekeeping
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB: GLOBAL HOSTING & PRICING CMS */}
      {activeTab === 'cms' && (
        <div className="d-flex flex-column gap-4">
          {/* Section 1: Global Domain & 2-Hour Daily Operating Window */}
          <div className={`p-4 rounded-3xl border shadow-sm ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-2xl p-2.5 bg-primary text-white">
                  <Globe size={20} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">Global Domain & 2-Hour Daily Operating Window</h5>
                  <p className="small text-muted mb-0">
                    Live HTTPS reverse proxy mapped to <strong>{cmsConfig.domain_url || 'https://study.longbrother.org'}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveCmsConfig}
                className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-bold shadow-sm"
              >
                Save Platform CMS Settings
              </button>
            </div>

            <div className="row g-3">
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">Custom Domain URL:</label>
                <input
                  type="text"
                  className={`form-control form-control-sm rounded-xl ${isDark ? 'bg-neutral-950 text-white border-neutral-700' : ''}`}
                  value={cmsConfig.domain_url || ''}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, domain_url: e.target.value })}
                  placeholder="https://study.longbrother.org"
                />
              </div>
              <div className="col-12 col-md-6">
                <label className="form-label small fw-semibold">2-Hour Daily Operating Schedule Text:</label>
                <input
                  type="text"
                  className={`form-control form-control-sm rounded-xl ${isDark ? 'bg-neutral-950 text-white border-neutral-700' : ''}`}
                  value={cmsConfig.live_schedule_text || ''}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, live_schedule_text: e.target.value })}
                  placeholder="Live Daily for 2 Hours (18:00 - 20:00 Local Time)"
                />
              </div>

              <div className="col-12 col-md-8">
                <label className="form-label small fw-semibold">Landing Page Notice Message (Below Navbar):</label>
                <input
                  type="text"
                  className={`form-control form-control-sm rounded-xl ${isDark ? 'bg-neutral-950 text-white border-neutral-700' : ''}`}
                  value={cmsConfig.notice_message || ''}
                  onChange={(e) => setCmsConfig({ ...cmsConfig, notice_message: e.target.value })}
                  placeholder="🌐 StudyAI Global Node is live for 2 hours daily! Enjoy fast localized AI study assistance."
                />
              </div>

              <div className="col-12 col-md-4 d-flex align-items-center mt-md-4">
                <div className="form-check form-switch pt-2">
                  <input
                    type="checkbox"
                    id="liveNoticeSwitch"
                    className="form-check-input"
                    checked={Boolean(cmsConfig.live_notice_enabled)}
                    onChange={(e) => setCmsConfig({ ...cmsConfig, live_notice_enabled: e.target.checked })}
                  />
                  <label htmlFor="liveNoticeSwitch" className="form-check-label small fw-semibold ms-1">
                    Show Live Notice on Landing Page
                  </label>
                </div>
              </div>
            </div>

            {/* Quick Terminal Command Runner Box */}
            <div className={`mt-3 p-3 rounded-2xl border d-flex justify-content-between align-items-center flex-wrap gap-2 ${
              isDark ? 'bg-black/50 border-neutral-800 text-slate-200' : 'bg-white border-slate-200'
            }`}>
              <div className="d-flex align-items-center gap-2">
                <Terminal size={16} className="text-primary" />
                <span className="small font-monospace">
                  python start_global.py &nbsp;&nbsp;<span className="text-muted">(Runs for 2 hours with live terminal link & auto-timer)</span>
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText('python start_global.py');
                  setCopiedCli(true);
                  setTimeout(() => setCopiedCli(false), 2000);
                }}
                className="btn btn-xs btn-outline-secondary rounded-pill px-2.5 py-1 small d-flex align-items-center gap-1"
              >
                {copiedCli ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                <span>{copiedCli ? 'Copied!' : 'Copy CLI Command'}</span>
              </button>
            </div>
          </div>

          {/* Section 2: 3-Tier Monetization & Pricing Category Limits */}
          <div className={`p-4 rounded-3xl border shadow-sm ${
            isDark ? 'bg-neutral-900/60 border-neutral-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="rounded-2xl p-2.5 bg-amber-500 text-white">
                  <DollarSign size={20} />
                </div>
                <div>
                  <h5 className="fw-bold mb-0">3-Tier Monetization & Storage Quota CMS</h5>
                  <p className="small text-muted mb-0">
                    Configure limits, storage quotas, and pricing for your 3 tiers displayed to all users
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveCmsConfig}
                className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-bold shadow-sm"
              >
                Save Pricing Categories
              </button>
            </div>

            <div className="row g-3">
              {(cmsConfig.pricing_tiers || []).map((tier, idx) => (
                <div key={tier.id || idx} className="col-12 col-lg-4">
                  <div className={`p-3 rounded-2xl border h-100 d-flex flex-column justify-content-between ${
                    isDark ? 'bg-neutral-950/80 border-neutral-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    <div>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-primary-subtle text-primary rounded-pill small">
                          Tier {idx + 1}
                        </span>
                        <span className="fw-bold text-success fs-6">{tier.price}</span>
                      </div>

                      <div className="mb-2">
                        <label className="small text-muted fw-semibold">Tier Name:</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                          value={tier.name}
                          onChange={(e) => {
                            const newTiers = [...cmsConfig.pricing_tiers];
                            newTiers[idx].name = e.target.value;
                            setCmsConfig({ ...cmsConfig, pricing_tiers: newTiers });
                          }}
                        />
                      </div>

                      <div className="mb-2">
                        <label className="small text-muted fw-semibold">Price String:</label>
                        <input
                          type="text"
                          className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                          value={tier.price}
                          onChange={(e) => {
                            const newTiers = [...cmsConfig.pricing_tiers];
                            newTiers[idx].price = e.target.value;
                            setCmsConfig({ ...cmsConfig, pricing_tiers: newTiers });
                          }}
                        />
                      </div>

                      <div className="row g-2 mb-2">
                        <div className="col-6">
                          <label className="small text-muted fw-semibold">Max Resources:</label>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                            value={tier.resource_limit}
                            onChange={(e) => {
                              const newTiers = [...cmsConfig.pricing_tiers];
                              newTiers[idx].resource_limit = parseInt(e.target.value) || 10;
                              setCmsConfig({ ...cmsConfig, pricing_tiers: newTiers });
                            }}
                          />
                        </div>
                        <div className="col-6">
                          <label className="small text-muted fw-semibold">Storage Quota (GB):</label>
                          <input
                            type="number"
                            className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                            value={tier.storage_limit_gb}
                            onChange={(e) => {
                              const newTiers = [...cmsConfig.pricing_tiers];
                              newTiers[idx].storage_limit_gb = parseInt(e.target.value) || 10;
                              setCmsConfig({ ...cmsConfig, pricing_tiers: newTiers });
                            }}
                          />
                        </div>
                      </div>

                      <div className="mb-2">
                        <label className="small text-muted fw-semibold">Daily Queries Cap:</label>
                        <input
                          type="number"
                          className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                          value={tier.query_limit}
                          onChange={(e) => {
                            const newTiers = [...cmsConfig.pricing_tiers];
                            newTiers[idx].query_limit = parseInt(e.target.value) || 10;
                            setCmsConfig({ ...cmsConfig, pricing_tiers: newTiers });
                          }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-top small text-muted">
                      {tier.resource_limit >= 9000 ? 'Infinite' : tier.resource_limit} resources • {tier.storage_limit_gb} GB disk quota
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ACTIVE CONNECTIONS TELEMETRY */}
      {activeTab === 'connections' && (
        <div className="table-responsive rounded-2xl border">
          <table className={`table table-hover align-middle mb-0 small ${isDark ? 'table-dark' : ''}`}>
            <thead className={isDark ? 'bg-neutral-900' : 'bg-light'}>
              <tr>
                <th>Client IP</th>
                <th>Request Count</th>
                <th>Last Accessed Endpoint</th>
                <th>First Seen</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {connections.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-4 text-muted">
                    No active incoming connection telemetry recorded yet.
                  </td>
                </tr>
              ) : (
                connections.map((c, i) => (
                  <tr key={i}>
                    <td>
                      <span className="fw-mono fw-bold">{c.ip}</span>
                    </td>
                    <td>
                      <span className="badge bg-primary-subtle text-primary rounded-pill">
                        {c.request_count} calls
                      </span>
                    </td>
                    <td>
                      <code>{c.last_endpoint}</code>
                    </td>
                    <td>
                      <span className="text-muted">{c.first_seen}</span>
                    </td>
                    <td>
                      <span className="badge bg-success-subtle text-success rounded-pill px-2 py-0.5">
                        Connected
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: SECURITY AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className={`p-3 rounded-2xl border font-mono small ${
          isDark ? 'bg-black text-emerald-400 border-neutral-800' : 'bg-dark text-light border-slate-700'
        }`} style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {auditLogs.length === 0 ? (
            <div className="text-muted">No security audit logs available.</div>
          ) : (
            auditLogs.map((log, idx) => (
              <div key={idx} className="mb-1 text-break">
                {log}
              </div>
            ))
          )}
        </div>
      )}

      {/* MODAL: EDIT PERMISSION LIMITS & TIME WINDOW GATEKEEPING */}
      {editLimitModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ zIndex: 1070, backgroundColor: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
        >
          <div className={`p-4 rounded-3xl border shadow-2xl w-100 ${
            isDark ? 'bg-neutral-950 border-neutral-800 text-white' : 'bg-white text-dark'
          }`} style={{ maxWidth: '460px' }}>
            <h5 className="fw-bold mb-1">Time-Window & Permission Gatekeeping</h5>
            <p className="small text-muted mb-3">Configuring controls for {editLimitModal.email}</p>

            <div className="mb-3 form-check form-switch">
              <input
                type="checkbox"
                id="activeStatusCheck"
                className="form-check-input"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
              />
              <label htmlFor="activeStatusCheck" className="form-check-label small fw-semibold ms-1">
                Account Active (Uncheck to pause/suspend user access)
              </label>
            </div>

            <div className="mb-3">
              <label className="form-label small fw-semibold">Daily Query Cap</label>
              <input
                type="number"
                min={1}
                max={500}
                className={`form-control form-control-sm rounded-xl ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                value={editLimitVal}
                onChange={(e) => setEditLimitVal(parseInt(e.target.value) || 1)}
              />
              <span className="small text-muted">Max AI RAG queries allowed in 24 hours.</span>
            </div>

            <div className="mb-3 form-check">
              <input
                type="checkbox"
                id="canUploadCheck"
                className="form-check-input"
                checked={editCanUpload}
                onChange={(e) => setEditCanUpload(e.target.checked)}
              />
              <label htmlFor="canUploadCheck" className="form-check-label small fw-semibold ms-1">
                Allow PDF & Resource Uploads to Isolated Directory
              </label>
            </div>

            <div className="mb-3 p-3 rounded-2xl border bg-amber-500/5 border-amber-500/20">
              <label className="form-label small fw-bold text-amber-500 mb-1">
                Assigned Subscription Plan & Storage Limit:
              </label>
              <select
                className={`form-select form-select-sm rounded-xl mb-2 ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                value={editTier}
                onChange={(e) => {
                  setEditTier(e.target.value);
                  setEditIsPaid(e.target.value !== 'tier-free');
                }}
              >
                <option value="tier-free">Freemium Starter (10 Resources, 10 GB Storage, 10 Queries/day)</option>
                <option value="tier-pro">Pro Scholar (50 Resources, 25 GB Storage, 100 Queries/day)</option>
                <option value="tier-unlimited">Enterprise Unlimited (9999 Resources, 100 GB Storage, 9999 Queries/day)</option>
              </select>
              <div className="text-muted small" style={{ fontSize: '0.72rem' }}>
                Resource uploads, daily query caps, and storage limits will be strictly bound to this chosen plan.
              </div>
            </div>

            <div className="p-3 rounded-2xl border mb-3 bg-indigo-500/5 border-indigo-500/20">
              <div className="form-check form-switch mb-2">
                <input
                  type="checkbox"
                  id="timeWindowCheck"
                  className="form-check-input"
                  checked={editTimeWindowEnabled}
                  onChange={(e) => setEditTimeWindowEnabled(e.target.checked)}
                />
                <label htmlFor="timeWindowCheck" className="form-check-label small fw-semibold ms-1">
                  Enforce Accessibility Time Window
                </label>
              </div>

              {editTimeWindowEnabled && (
                <div className="row g-2 mt-1">
                  <div className="col-6">
                    <label className="small text-muted fw-semibold">Start Hour (0-23):</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                      value={editStartHour}
                      onChange={(e) => setEditStartHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    />
                  </div>
                  <div className="col-6">
                    <label className="small text-muted fw-semibold">End Hour (0-23):</label>
                    <input
                      type="number"
                      min={0}
                      max={23}
                      className={`form-control form-control-sm ${isDark ? 'bg-neutral-900 text-white border-neutral-700' : ''}`}
                      value={editEndHour}
                      onChange={(e) => setEditEndHour(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    />
                  </div>
                  <span className="small text-muted mt-1" style={{ fontSize: '0.72rem' }}>
                    Users querying outside {String(editStartHour).padStart(2, '0')}:00 - {String(editEndHour).padStart(2, '0')}:00 will receive 403 Forbidden.
                  </span>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-secondary rounded-pill px-3"
                onClick={() => setEditLimitModal(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold"
                onClick={() =>
                  handleUpdatePermission(
                    editLimitModal.id,
                    editLimitModal.status || 'approved',
                    editLimitVal,
                    editCanUpload,
                    editIsActive,
                    editTimeWindowEnabled,
                    editStartHour,
                    editEndHour,
                    editTier
                  )
                }
              >
                Save Gatekeeping Rules
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
