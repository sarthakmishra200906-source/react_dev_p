import React from 'react';
import {
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  GraduationCap,
  Microscope,
  Folder,
  CheckSquare,
  StickyNote,
} from 'lucide-react';
import Report from './report';
import ResearchMode from './ResearchMode';
import ResourceHub from './ResourceHub';
import StandardTaskManager from './StandardTaskManager';
import ImportantNotes from './ImportantNotes';
import StudyDashboard from './StudyDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard({
  user,
  onLogout,
  onOpenAuth,
  isDark = false,
  tasks = [],
  notes = [],
  resources = [],
  onSaveNote,
  onSaveTask,
  onDeleteNote,
  onDeleteTask,
  onEditNote,
  onAddResource,
  onDeleteResource,
  onWipeAllData,
  accessCode = '',
  activeTab = 'rag',
  onTabChange,
  searchQuery = '',
  onLogoutAdmin,
}) {
  // Guest / Demo mode restriction check
  const isGuest = !user || user.isDemo || user.role === 'Demo User' || user.role === 'Demo Mode';
  const isAdmin = user?.role === 'admin' || user?.is_admin;

  const onRequireAuth = () => {
    if (onOpenAuth) onOpenAuth('login');
  };

  const guardAction = (actionFn) => (...args) => {
    if (isGuest) {
      onRequireAuth();
      return;
    }
    if (actionFn) actionFn(...args);
  };

  // Live filter across all workspace data based on top navbar search
  const [selectedResourceId, setSelectedResourceId] = React.useState(() => resources[0]?.id || null);

  React.useEffect(() => {
    if (resources.length > 0 && (!selectedResourceId || !resources.some((r) => r.id === selectedResourceId))) {
      setSelectedResourceId(resources[0].id);
    } else if (resources.length === 0) {
      setSelectedResourceId(null);
    }
  }, [resources, selectedResourceId]);

  const filteredTasks = tasks.filter((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotes = notes.filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredResources = resources.filter((r) =>
    (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.preview && r.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const dashboardTabs = [
    { id: 'rag', label: 'AI RAG Studio', icon: <LayoutDashboard size={16} /> },
    { id: 'study', label: 'Study Mode', icon: <GraduationCap size={16} />, badge: 'Custom Resource Scope' },
    { id: 'research', label: 'Gemini Research', icon: <Microscope size={16} /> },
    { id: 'resources', label: 'Sources Hub', icon: <Folder size={16} />, count: resources.length },
    { id: 'tasks', label: 'Task Manager', icon: <CheckSquare size={16} />, count: tasks.length },
    { id: 'notes', label: 'Important Notes', icon: <StickyNote size={16} />, count: notes.length },
    ...(isAdmin ? [{ id: 'admin', label: 'Admin Portal', icon: <ShieldCheck size={16} />, badge: 'Secure Root' }] : []),
  ];

  return (
    <div className="dashboard-notebooklm w-100 py-1">
      {/* Guest Preview Mode Restriction Banner */}
      {isGuest && (
        <div
          className={`p-3 px-4 rounded-3xl border mb-3.5 d-flex justify-content-between align-items-center flex-wrap gap-3 shadow-sm ${
            isDark
              ? 'bg-amber-950/40 border-amber-500/40 text-amber-200 shadow-[0_4px_20px_rgba(245,158,11,0.15)]'
              : 'bg-amber-50 border-amber-300 text-amber-900'
          }`}
        >
          <div className="d-flex align-items-center gap-3">
            <div className="rounded-circle p-2 bg-amber-500/20 text-amber-400 d-flex align-items-center justify-content-center">
              <Lock size={18} />
            </div>
            <div>
              <div className="fw-bold small d-flex align-items-center gap-1.5">
                <span>Guest Preview Mode</span>
                <span className="badge bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-pill small">
                  Explore & Hover Only
                </span>
              </div>
              <span className="small opacity-90">
                You can browse tabs, preview layouts, and inspect tools. To run AI deep research, generate summaries, or save tasks & notes, please sign in.
              </span>
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth('login')}
              className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold shadow-sm d-flex align-items-center gap-1"
            >
              <span>Sign In to Unlock</span>
              <ArrowRight size={14} />
            </button>
            <button
              type="button"
              onClick={() => onOpenAuth && onOpenAuth('register')}
              className={`btn btn-sm rounded-pill px-3 py-1.5 fw-medium border ${
                isDark ? 'btn-outline-light' : 'btn-outline-dark'
              }`}
            >
              Register Free
            </button>
          </div>
        </div>
      )}

      {/* Prominent Workspace Modes Navigation Bar */}
      <div className={`p-2 rounded-2xl border mb-3.5 shadow-sm d-flex gap-2 overflow-auto align-items-center ${
        isDark ? 'bg-neutral-900/90 border-neutral-800' : 'bg-slate-100/90 border-slate-200'
      }`}>
        <span className="small text-muted fw-bold text-uppercase px-2 d-none d-lg-inline" style={{ fontSize: '0.72rem' }}>
          Workspace Modes:
        </span>
        {dashboardTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const isTabAdmin = tab.id === 'admin';
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange && onTabChange(tab.id)}
              className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-2 flex-shrink-0 transition-all ${
                isActive
                  ? isTabAdmin ? 'btn-danger text-white shadow-sm' : 'btn-primary text-white shadow-sm'
                  : isDark
                  ? 'btn-dark border-neutral-800 text-slate-300 hover:bg-neutral-800'
                  : 'btn-white border text-slate-700 bg-white hover:bg-slate-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`badge rounded-pill small px-2 py-0.5 ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : isTabAdmin
                    ? 'bg-danger-subtle text-danger border border-danger-subtle'
                    : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {tab.badge}
                </span>
              )}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={`badge rounded-pill small ${
                  isActive ? 'bg-white/20 text-white' : 'bg-secondary-subtle text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search Filter Metrics Banner (Only when searching) */}
      {searchQuery && (
        <div className={`p-2.5 px-3 rounded-2xl border mb-3 small d-flex gap-3 align-items-center flex-wrap shadow-sm ${
          isDark ? 'bg-neutral-900/80 border-neutral-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
        }`}>
          <span>Filtering workspace by: <strong className="text-primary">"{searchQuery}"</strong></span>
          <span>Matching Tasks: <strong className="text-primary">{filteredTasks.length}</strong></span>
          <span>Matching Notes: <strong className="text-amber-500">{filteredNotes.length}</strong></span>
          <span>Matching Sources: <strong className="text-success">{filteredResources.length}</strong></span>
        </div>
      )}

      {/* Main Studio Viewport - Keep panes mounted to preserve state across tab switches */}
      <div className="notebook-viewport w-100">
        {/* VIEW 1: AI RAG Studio */}
        <div className="studio-pane" style={{ display: activeTab === 'rag' ? 'block' : 'none' }}>
          <Report
            tasks={searchQuery ? filteredTasks : tasks}
            notes={searchQuery ? filteredNotes : notes}
            isDark={isDark}
            accessCode={accessCode}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onAddResource={guardAction(onAddResource)}
            onWipeAllData={onWipeAllData}
            onOpenStudyMode={() => onTabChange && onTabChange('study')}
            user={user}
            isAdmin={isAdmin}
          />
        </div>

        {/* VIEW 2: Gemini Deep Research */}
        <div className="studio-pane" style={{ display: activeTab === 'research' ? 'block' : 'none' }}>
          <ResearchMode
            isDark={isDark}
            accessCode={accessCode}
            resources={searchQuery ? filteredResources : resources}
            user={user}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onSaveNote={guardAction(onSaveNote)}
            onAddResource={guardAction(onAddResource)}
            onWipeAllData={onWipeAllData}
            selectedResourceId={selectedResourceId}
            onSelectResource={setSelectedResourceId}
            onOpenResources={() => onTabChange && onTabChange('resources')}
          />
        </div>

        {/* VIEW 3: Sources & Resource Hub */}
        <div className="studio-pane" style={{ display: activeTab === 'resources' ? 'block' : 'none' }}>
          <ResourceHub
            resources={searchQuery ? filteredResources : resources}
            onAddResource={guardAction(onAddResource)}
            onDeleteResource={guardAction(onDeleteResource)}
            isDark={isDark}
            accessCode={accessCode}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onWipeAllData={onWipeAllData}
            user={user}
            isAdmin={isAdmin}
          />
        </div>

        {/* VIEW 4: Standard Task Manager */}
        <div className="studio-pane" style={{ display: activeTab === 'tasks' ? 'block' : 'none' }}>
          <StandardTaskManager
            tasks={searchQuery ? filteredTasks : tasks}
            onSaveTask={guardAction(onSaveTask)}
            onDeleteTask={guardAction(onDeleteTask)}
            isDark={isDark}
            accessCode={accessCode}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onWipeAllData={onWipeAllData}
          />
        </div>

        {/* VIEW 5: Important Notes & Vault */}
        <div className="studio-pane" style={{ display: activeTab === 'notes' ? 'block' : 'none' }}>
          <ImportantNotes
            notes={searchQuery ? filteredNotes : notes}
            onSaveNote={guardAction(onSaveNote)}
            onDeleteNote={guardAction(onDeleteNote)}
            onEditNote={guardAction(onEditNote)}
            isDark={isDark}
            accessCode={accessCode}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onWipeAllData={onWipeAllData}
          />
        </div>

        {/* VIEW 6: Study Mode Dashboard (All Footer Study Tools) */}
        <div className="studio-pane" style={{ display: activeTab === 'study' ? 'block' : 'none' }}>
          <StudyDashboard
            isDark={isDark}
            tasks={searchQuery ? filteredTasks : tasks}
            notes={searchQuery ? filteredNotes : notes}
            resources={searchQuery ? filteredResources : resources}
            onSaveTask={guardAction(onSaveTask)}
            onDeleteTask={guardAction(onDeleteTask)}
            onSaveNote={guardAction(onSaveNote)}
            onDeleteNote={guardAction(onDeleteNote)}
            onEditNote={guardAction(onEditNote)}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
            onOpenResearch={() => onTabChange && onTabChange('research')}
            onOpenResources={() => onTabChange && onTabChange('resources')}
            user={user}
            isAdmin={isAdmin}
          />
        </div>

        {/* VIEW 7: Administrator Control Portal */}
        {isAdmin && (
          <div className="studio-pane" style={{ display: activeTab === 'admin' ? 'block' : 'none' }}>
            <AdminDashboard
              adminUser={user}
              onLogoutAdmin={onLogoutAdmin}
              onSwitchToUserPortal={() => onTabChange && onTabChange('rag')}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
}
