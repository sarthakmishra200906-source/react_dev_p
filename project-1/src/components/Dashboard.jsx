import React from 'react';
import { Lock, ShieldAlert, Sparkles, ArrowRight } from 'lucide-react';
import Report from './report';
import ResearchMode from './ResearchMode';
import ResourceHub from './ResourceHub';
import StandardTaskManager from './StandardTaskManager';
import ImportantNotes from './ImportantNotes';

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
  accessCode = '',
  activeTab = 'rag',
  onTabChange,
  searchQuery = '',
}) {
  // Guest / Demo mode restriction check
  const isGuest = !user || user.isDemo || user.role === 'Demo User' || user.role === 'Demo Mode';

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
  const filteredTasks = tasks.filter((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredNotes = notes.filter((n) => n.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredResources = resources.filter((r) =>
    (r.title && r.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.preview && r.preview.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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

      {/* Main Studio Viewport */}
      <div className="notebook-viewport w-100">
        {/* VIEW 1: AI RAG Studio */}
        {activeTab === 'rag' && (
          <div className="studio-pane">
            <Report
              tasks={searchQuery ? filteredTasks : tasks}
              notes={searchQuery ? filteredNotes : notes}
              isDark={isDark}
              accessCode={accessCode}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
            />
          </div>
        )}

        {/* VIEW 2: Gemini Deep Research */}
        {activeTab === 'research' && (
          <div className="studio-pane">
            <ResearchMode
              isDark={isDark}
              accessCode={accessCode}
              resources={searchQuery ? filteredResources : resources}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
            />
          </div>
        )}

        {/* VIEW 3: Sources & Resource Hub */}
        {activeTab === 'resources' && (
          <div className="studio-pane">
            <ResourceHub
              resources={searchQuery ? filteredResources : resources}
              onAddResource={guardAction(onAddResource)}
              onDeleteResource={guardAction(onDeleteResource)}
              isDark={isDark}
              accessCode={accessCode}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
            />
          </div>
        )}

        {/* VIEW 4: Standard Task Manager */}
        {activeTab === 'tasks' && (
          <div className="studio-pane">
            <StandardTaskManager
              tasks={searchQuery ? filteredTasks : tasks}
              onSaveTask={guardAction(onSaveTask)}
              onDeleteTask={guardAction(onDeleteTask)}
              isDark={isDark}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
            />
          </div>
        )}

        {/* VIEW 5: Important Notes Hub */}
        {activeTab === 'notes' && (
          <div className="studio-pane">
            <ImportantNotes
              notes={searchQuery ? filteredNotes : notes}
              onSaveNote={guardAction(onSaveNote)}
              onDeleteNote={guardAction(onDeleteNote)}
              onEditNote={guardAction(onEditNote)}
              isDark={isDark}
              isGuest={isGuest}
              onRequireAuth={onRequireAuth}
            />
          </div>
        )}
      </div>
    </div>
  );
}
