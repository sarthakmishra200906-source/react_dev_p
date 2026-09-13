import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import {
  Sun,
  Moon,
  LogIn,
  UserPlus,
  LayoutDashboard,
  Home,
  LogOut,
  Menu,
  X,
  Microscope,
  Folder,
  CheckSquare,
  StickyNote,
  ChevronDown,
  Search
} from 'lucide-react';
import Header from './components/header';
import Footer from './components/footer';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthModal from './components/AuthModal';
import ChatDrawer from './components/ChatDrawer';
import './App.css';

export default function App() {
  const [notes, setNotes] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [resources, setResources] = useState([]);

  // Navbar Search State (Specific for Dashboard vs. Home Page)
  const [dashboardSearch, setDashboardSearch] = useState('');
  const [homeSearch, setHomeSearch] = useState('');

  // Authentication State with "Remember Me" localStorage persistence
  const [user, setUser] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('study_auth_user');
        if (saved) return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Unable to load saved user session:', e);
    }
    return null;
  });

  // Current View: always starts on 'landing' on initial load or reload
  const [currentView, setCurrentView] = useState('landing');

  // Active feature tab in Dashboard
  const [activeDashboardTab, setActiveDashboardTab] = useState('rag');

  // Dashboard hamburger switcher menu dropdown state with hover buffer
  const [featureMenuOpen, setFeatureMenuOpen] = useState(false);
  const menuTimerRef = React.useRef(null);

  const handleMenuMouseEnter = () => {
    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
    setFeatureMenuOpen(true);
  };

  const handleMenuMouseLeave = () => {
    menuTimerRef.current = setTimeout(() => {
      setFeatureMenuOpen(false);
    }, 300);
  };

  // Mobile menu collapse
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth Modal State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('login');

  // Theme Mode with localStorage persistence (Default: white / light)
  const [theme, setTheme] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return localStorage.getItem('study_theme_mode') || 'light';
      }
    } catch (e) {}
    return 'light';
  });

  const isDark = theme === 'dark';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.body.className = isDark ? 'dark-mode' : 'light-mode';
    }
  }, [theme, isDark]);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('study_theme_mode', nextTheme);
      }
    } catch (e) {}
  };

  // Auth Handlers
  const handleLoginSuccess = (userData, rememberMe) => {
    setUser(userData);
    setCurrentView('dashboard');
    setIsAuthOpen(false);
    setMobileMenuOpen(false);

    try {
      if (rememberMe && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('study_auth_user', JSON.stringify(userData));
      }
    } catch (e) {}
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView('landing');
    setMobileMenuOpen(false);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('study_auth_user');
      }
    } catch (e) {}
  };

  const openAuth = (tab = 'login') => {
    setAuthTab(tab);
    setIsAuthOpen(true);
    setMobileMenuOpen(false);
  };

  const launchDemoUser = () => {
    handleLoginSuccess(
      { name: 'Guest Scholar', email: 'guest@study.ai', role: 'Demo User' },
      false
    );
  };

  const navigateToDashboardTab = (tabName) => {
    if (!user) {
      launchDemoUser();
    }
    setActiveDashboardTab(tabName);
    setCurrentView('dashboard');
    setFeatureMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Note Handlers
  const handleSaveNote = (newNote) => {
    setNotes((prevNotes) => [...prevNotes, newNote]);
  };

  const handleDeleteNote = (indexToDelete) => {
    setNotes((prevNotes) => prevNotes.filter((_, index) => index !== indexToDelete));
  };

  const handleEditNote = (indexToEdit, updatedText) => {
    setNotes((prevNotes) =>
      prevNotes.map((note, index) => (index === indexToEdit ? updatedText : note))
    );
  };

  // Task Handlers
  const handleSaveTask = (newTask) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
  };

  const handleDeleteTask = (indexToDelete) => {
    setTasks((prevTasks) => prevTasks.filter((_, index) => index !== indexToDelete));
  };

  // Resource Handlers (50 limit)
  const handleAddResource = (resource) => {
    setResources((prev) => {
      if (prev.length >= 50) return prev;
      return [resource, ...prev];
    });
  };

  const handleDeleteResource = (resourceId) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
  };

  // Dashboard Feature Metadata for indicator & switcher
  const dashboardFeatures = [
    { id: 'rag', label: 'AI RAG Studio', icon: <LayoutDashboard size={15} /> },
    { id: 'research', label: 'Gemini Research', icon: <Microscope size={15} /> },
    { id: 'resources', label: 'Sources Hub', icon: <Folder size={15} /> },
    { id: 'tasks', label: 'Task Manager', icon: <CheckSquare size={15} /> },
    { id: 'notes', label: 'Important Notes', icon: <StickyNote size={15} /> },
  ];

  const currentFeature = dashboardFeatures.find((f) => f.id === activeDashboardTab) || dashboardFeatures[0];

  // Match dashboard search query to workspace tab
  const resolveDashboardTab = (query) => {
    if (!query) return null;
    const q = query.toLowerCase().trim();
    if (!q) return null;
    if (/gemini|gemni|deep|deap|research|reserch|synthesis|paper|literature|academic|flash\s*3/i.test(q)) {
      return 'research';
    }
    if (/task|todo|to-do|reminder|schedule|agenda|sprint/i.test(q)) {
      return 'tasks';
    }
    if (/note|notes|scratchpad|memo|important|obsidian/i.test(q)) {
      return 'notes';
    }
    if (/resource|source|file|pdf|doc|upload|hub|library|context/i.test(q)) {
      return 'resources';
    }
    if (/rag|studio|flowchart|flashcard|quiz|mindmap|mind\s*map|report|diagram/i.test(q)) {
      return 'rag';
    }
    return null;
  };

  const handleDashboardSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const matched = resolveDashboardTab(dashboardSearch);
      if (matched) {
        setActiveDashboardTab(matched);
      }
    }
  };

  const handleDashboardSearchSubmit = () => {
    const matched = resolveDashboardTab(dashboardSearch);
    if (matched) {
      setActiveDashboardTab(matched);
    }
  };

  const handleHomeSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const featuresEl = document.getElementById('features');
      if (featuresEl) {
        featuresEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const matchedDashboardTab = resolveDashboardTab(dashboardSearch);
  const matchedFeatureObj = dashboardFeatures.find((f) => f.id === matchedDashboardTab);

  return (
    <div
      className={`App d-flex flex-column min-vh-100 transition-colors duration-200 ${
        isDark ? 'bg-black text-slate-100' : 'bg-white text-slate-900'
      }`}
      style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
    >
      {/* Top Navbar with Navigation, Auth, Specific Search & Theme Controls */}
      <nav
        className={`d-flex justify-content-between align-items-center px-4 py-2.5 border-bottom sticky-top transition-all ${
          isDark ? 'border-neutral-800/80 shadow-2xl' : 'bg-white/95 border-slate-200 shadow-sm'
        }`}
        style={{
          backgroundColor: isDark ? 'rgba(8, 10, 16, 0.88)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          zIndex: 1020,
        }}
      >
        {/* Left Side: Brand Logo + Active Feature Badge (When in Dashboard) */}
        <div className="d-flex align-items-center gap-3">
          <div
            className="cursor-pointer"
            onClick={() => {
              setCurrentView('landing');
              setMobileMenuOpen(false);
            }}
          >
            <Header title="StudyAI Platform" isDark={isDark} />
          </div>

          {/* Active Dashboard Feature Indicator in Navbar */}
          {currentView === 'dashboard' && (
            <div className="d-none d-lg-flex align-items-center gap-1.5 px-3 py-1 rounded-pill border bg-indigo-500/10 text-indigo-400 border-indigo-500/30 small fw-semibold shadow-sm">
              {currentFeature.icon}
              <span>{currentFeature.label}</span>
            </div>
          )}
        </div>

        {/* Middle Vacant Space: Dedicated Context-Specific Search Bar */}
        <div className="flex-grow-1 mx-3 d-none d-md-block" style={{ maxWidth: '480px' }}>
          {currentView === 'dashboard' ? (
            /* Dashboard Search: Real-time filter & Enter-to-open tools like Gemini Deep Research */
            <div className="input-group input-group-sm">
              <button
                type="button"
                className={`input-group-text border-end-0 rounded-start-pill ${
                  isDark ? 'bg-neutral-900 border-neutral-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-300 text-slate-500 hover:text-dark'
                }`}
                onClick={handleDashboardSearchSubmit}
                title="Search or press Enter to navigate"
              >
                <Search size={14} />
              </button>
              <input
                type="text"
                className={`form-control border-start-0 ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
                placeholder="Search tools (e.g. Gemini Deep Research) or workspace..."
                value={dashboardSearch}
                onChange={(e) => setDashboardSearch(e.target.value)}
                onKeyDown={handleDashboardSearchKeyDown}
              />
              {matchedFeatureObj && (
                <button
                  type="button"
                  className="btn btn-sm btn-primary py-0 px-2.5 fw-semibold d-flex align-items-center gap-1 small"
                  onClick={() => setActiveDashboardTab(matchedFeatureObj.id)}
                  title={`Open ${matchedFeatureObj.label} (or press Enter)`}
                >
                  <span>Open {matchedFeatureObj.label}</span>
                  <span className="opacity-75 small">↵</span>
                </button>
              )}
              {dashboardSearch && (
                <button
                  type="button"
                  className={`btn btn-sm border border-start-0 rounded-end-pill ${
                    isDark ? 'bg-neutral-800 border-neutral-700 text-slate-300' : 'bg-slate-200 border-slate-300'
                  }`}
                  onClick={() => setDashboardSearch('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          ) : (
            /* Home Page Search: Filter platform tools, capabilities, and features */
            <div className="input-group input-group-sm">
              <button
                type="button"
                className={`input-group-text border-end-0 rounded-start-pill ${
                  isDark ? 'bg-neutral-900 border-neutral-700 text-slate-400' : 'bg-slate-100 border-slate-300 text-slate-500'
                }`}
                onClick={() => {
                  const featuresEl = document.getElementById('features');
                  if (featuresEl) featuresEl.scrollIntoView({ behavior: 'smooth' });
                }}
                title="Filter features"
              >
                <Search size={14} />
              </button>
              <input
                type="text"
                className={`form-control border-start-0 ${
                  isDark
                    ? 'bg-neutral-900 border-neutral-700 text-white placeholder-slate-400'
                    : 'bg-slate-100 border-slate-300 text-slate-900'
                }`}
                placeholder="Search study tools, features, or models..."
                value={homeSearch}
                onChange={(e) => setHomeSearch(e.target.value)}
                onKeyDown={handleHomeSearchKeyDown}
              />
              {homeSearch && (
                <button
                  type="button"
                  className={`btn btn-sm border border-start-0 rounded-end-pill ${
                    isDark ? 'bg-neutral-800 border-neutral-700 text-slate-300' : 'bg-slate-200 border-slate-300'
                  }`}
                  onClick={() => setHomeSearch('')}
                  title="Clear search"
                >
                  <X size={13} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="d-flex align-items-center gap-2">
          {currentView === 'dashboard' ? (
            /* ================= DASHBOARD NAVBAR CONTROLS ================= */
            <div className="d-flex align-items-center gap-2">
              {/* Feature Switcher Dropdown (Click or Hover with Grace Period) */}
              <div
                className="position-relative"
                onMouseEnter={handleMenuMouseEnter}
                onMouseLeave={handleMenuMouseLeave}
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (menuTimerRef.current) clearTimeout(menuTimerRef.current);
                    setFeatureMenuOpen((prev) => !prev);
                  }}
                  className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1.5 border transition-all ${
                    featureMenuOpen
                      ? 'bg-primary text-white border-primary shadow-sm'
                      : isDark
                      ? 'border-neutral-700 text-slate-200 bg-neutral-900/80 hover:bg-neutral-800'
                      : 'btn-light border text-slate-700'
                  }`}
                  title="Switch Dashboard Features"
                >
                  <Menu size={16} />
                  <span className="d-none d-md-inline">Features</span>
                  <ChevronDown size={14} className={`transition-transform ${featureMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu directly attached without gap */}
                {featureMenuOpen && (
                  <div
                    className="position-absolute end-0 pt-1 z-50"
                    style={{ top: '100%', minWidth: '240px' }}
                    onMouseEnter={handleMenuMouseEnter}
                    onMouseLeave={handleMenuMouseLeave}
                  >
                    <div
                      className={`p-2 rounded-2xl shadow-2xl border transition-all ${
                        isDark ? 'bg-neutral-950 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
                      }`}
                      style={{ backdropFilter: 'blur(20px)' }}
                    >
                      <div className="px-3 py-1 text-uppercase small text-muted fw-bold" style={{ fontSize: '0.68rem' }}>
                        Switch Workspace View
                      </div>

                      {dashboardFeatures.map((f) => {
                        const isSelected = activeDashboardTab === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => {
                              setActiveDashboardTab(f.id);
                              setFeatureMenuOpen(false);
                            }}
                            className={`w-100 border-0 rounded-xl px-3 py-2 d-flex align-items-center gap-2.5 small fw-medium transition-all text-start ${
                              isSelected
                                ? 'bg-primary text-white'
                                : isDark
                                ? 'text-slate-200 hover:bg-neutral-900 bg-transparent'
                                : 'text-slate-700 hover:bg-slate-100 bg-transparent'
                            }`}
                          >
                            {f.icon}
                            <span>{f.label}</span>
                            {isSelected && <span className="ms-auto small">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Written "Home" Button */}
              <button
                type="button"
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold border transition-all ${
                  isDark
                    ? 'border-neutral-700 text-slate-200 bg-neutral-900/80 hover:bg-neutral-800'
                    : 'btn-light border text-slate-700'
                }`}
                onClick={() => setCurrentView('landing')}
              >
                Home
              </button>

              {/* Written "Logout" Button */}
              <button
                type="button"
                onClick={handleLogout}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-semibold d-flex align-items-center gap-1 border shadow-sm ${
                  isDark ? 'btn-outline-danger' : 'btn-outline-danger'
                }`}
                title="Logout"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          ) : (
            /* ================= LANDING PAGE NAVBAR CONTROLS ================= */
            <div className="d-flex align-items-center gap-2">
              {user ? (
                <button
                  type="button"
                  className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 shadow-sm"
                  onClick={() => setCurrentView('dashboard')}
                >
                  <LayoutDashboard size={15} /> Open Workspace
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => openAuth('login')}
                    className={`btn btn-sm rounded-pill px-3.5 py-1.5 d-flex align-items-center gap-1.5 ${
                      isDark ? 'btn-dark border-neutral-700 text-slate-200' : 'btn-light border'
                    }`}
                  >
                    <LogIn size={14} /> Sign In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuth('register')}
                    className="btn btn-sm btn-primary rounded-pill px-3.5 py-1.5 d-flex align-items-center gap-1.5 shadow-sm"
                  >
                    <UserPlus size={14} /> Get Started
                  </button>
                </>
              )}
            </div>
          )}

          {/* Theme Switcher Button */}
          <button
            type="button"
            onClick={toggleTheme}
            className={`btn btn-sm rounded-pill d-flex align-items-center gap-1.5 px-3 py-1.5 shadow-sm border transition-all ${
              isDark
                ? 'border-neutral-700 text-warning bg-neutral-900/80 hover:border-neutral-600'
                : 'btn-light border-slate-300 text-dark'
            }`}
            title={`Switch to ${isDark ? 'Light (White)' : 'Dark'} Mode`}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
            <span className="small fw-semibold d-none d-md-inline">{isDark ? 'Light' : 'Dark'}</span>
          </button>
        </div>
      </nav>

      {/* Main App View Routing */}
      {currentView === 'landing' ? (
        <div>
          <LandingPage
            user={user}
            onOpenAuth={openAuth}
            onGetStarted={() => setCurrentView('dashboard')}
            onGoToDashboard={() => setCurrentView('dashboard')}
            onLogin={() => openAuth('login')}
            onLaunchDemo={launchDemoUser}
            onOpenDemo={launchDemoUser}
            isDark={isDark}
            searchQuery={homeSearch}
          />
        </div>
      ) : (
        <main className="container-fluid px-lg-5 my-3 flex-grow-1">
          <Dashboard
            user={user}
            onLogout={handleLogout}
            onOpenAuth={openAuth}
            isDark={isDark}
            tasks={tasks}
            notes={notes}
            resources={resources}
            onSaveNote={handleSaveNote}
            onSaveTask={handleSaveTask}
            onDeleteNote={handleDeleteNote}
            onDeleteTask={handleDeleteTask}
            onEditNote={handleEditNote}
            onAddResource={handleAddResource}
            onDeleteResource={handleDeleteResource}
            activeTab={activeDashboardTab}
            onTabChange={setActiveDashboardTab}
            searchQuery={dashboardSearch}
          />
        </main>
      )}

      {/* Global Interactive Tutor Chat Drawer */}
      <ChatDrawer isDark={isDark} />

      {/* Customized Responsive Footer (Modal Content & Explanations Only) */}
      <Footer
        isDark={isDark}
        onOpenAuth={openAuth}
      />

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        onLogin={handleLoginSuccess}
        isDark={isDark}
        initialTab={authTab}
      />
    </div>
  );
}