import React from 'react';
import { Sparkles, Brain, BookOpen, Layers, Calendar, ArrowRight, Microscope, Cpu, Search, CheckCircle, Zap, ShieldCheck } from 'lucide-react';
import Carsoul from './carsoul';

export default function LandingPage({
  user = null,
  siteConfig = null,
  onOpenAuth,
  onGetStarted,
  onGoToDashboard,
  onLaunchDemo,
  onOpenDemo,
  onLogin,
  onRequestAccess,
  isDark = false,
  searchQuery = '',
}) {
  const handleStart = () => {
    if (user) {
      if (onGoToDashboard) onGoToDashboard();
      else if (onGetStarted) onGetStarted();
    } else {
      if (onOpenAuth) onOpenAuth('register');
      else if (onGetStarted) onGetStarted();
    }
  };

  const handleDemo = () => {
    if (user) {
      if (onGoToDashboard) onGoToDashboard();
      else if (onGetStarted) onGetStarted();
    } else {
      if (onOpenAuth) onOpenAuth('login');
    }
  };

  const handleDashboardAction = () => {
    if (user) {
      if (onGoToDashboard) onGoToDashboard();
      else if (onGetStarted) onGetStarted();
    } else {
      if (onOpenAuth) onOpenAuth('login');
    }
  };

  const features = [
    {
      icon: <Microscope className="text-cyan-400" size={26} />,
      title: 'Gemini Deep Research Mode',
      desc: 'Unrestricted, rigorous academic synthesis across all 50 uploaded study materials without arbitrary line-count limits.',
      accent: 'border-cyan-500/20 bg-cyan-500/10'
    },
    {
      icon: <Brain className="text-purple-400" size={26} />,
      title: 'Multi-Modal Document Vision',
      desc: 'High-accuracy comprehension for handwritten lecture notes, scanned diagrammatic sheets, and complex syllabus PDFs.',
      accent: 'border-purple-500/20 bg-purple-500/10'
    },
    {
      icon: <Cpu className="text-indigo-400" size={26} />,
      title: 'Cloud vs. Local Comparison',
      desc: 'Dual-engine parallel execution comparing Google Gemini Cloud and Local Ollama Llama 3 with real-time latency benchmarks.',
      accent: 'border-indigo-500/20 bg-indigo-500/10'
    },
    {
      icon: <Layers className="text-emerald-400" size={26} />,
      title: 'Active Recall Quiz & Flashcards',
      desc: 'Interactive 3D flip flashcards and self-grading multiple-choice quizzes automatically extracted from your uploaded materials.',
      accent: 'border-emerald-500/20 bg-emerald-500/10'
    },
    {
      icon: <Calendar className="text-amber-400" size={26} />,
      title: 'Automated Calendar Sync (.ics)',
      desc: 'Generates structured focus sprint timelines with 1-click export to Google Calendar, Apple Calendar, and Outlook.',
      accent: 'border-amber-500/20 bg-amber-500/10'
    },
    {
      icon: <BookOpen className="text-rose-400" size={26} />,
      title: 'Obsidian & VS Code Auto-Sync',
      desc: 'All notes and tasks are automatically exported as clean markdown files with YAML frontmatter for seamless desktop editing.',
      accent: 'border-rose-500/20 bg-rose-500/10'
    },
  ];

  const filteredFeatures = features.filter((f) =>
    !searchQuery.trim() ||
    f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="landing-page w-100">
      {/* Hero Section */}
      <section className="py-5 text-center position-relative overflow-hidden">
        <div className="container py-4">
          <div
            className={`d-inline-flex align-items-center gap-2 px-3.5 py-1.5 rounded-pill border mb-4 small fw-semibold transition-all ${
              isDark
                ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-300 shadow-[0_0_18px_rgba(99,102,241,0.25)]'
                : 'bg-primary-subtle border-primary-subtle text-primary shadow-sm'
            }`}
          >
            <Sparkles size={16} className="text-indigo-400 animate-pulse" />
            <span>Next-Generation Multi-Modal AI Study Intelligence</span>
          </div>

          <h1
            className={`display-4 fw-black tracking-tight mb-3 mx-auto ${
              isDark ? 'gradient-title' : 'text-slate-900'
            }`}
            style={{ maxWidth: '860px', fontWeight: 800 }}
          >
            {siteConfig?.hero_title ? (
              siteConfig.hero_title
            ) : (
              <>
                Transform Complex Study Materials into <span className={isDark ? 'gradient-accent' : 'text-primary'}>Mastery & Action</span>
              </>
            )}
          </h1>

          <p
            className={`lead mx-auto mb-5 ${isDark ? 'text-slate-300' : 'text-muted'}`}
            style={{ maxWidth: '720px', fontSize: '1.15rem', lineHeight: '1.7' }}
          >
            {siteConfig?.hero_subtitle ||
              'An intelligent academic workspace combining Gemini 3.6/3.8 Flash visual comprehension, local Llama 3 privacy fallback, 50-resource multi-modal library, and interactive active-recall flashcards.'}
          </p>

          <div className="d-flex justify-content-center gap-3 flex-wrap mb-4">
            <button
              type="button"
              onClick={handleStart}
              className="btn btn-primary btn-lg rounded-pill px-5 shadow-lg d-flex align-items-center gap-2 fw-semibold"
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                border: 'none',
                boxShadow: isDark ? '0 10px 25px -5px rgba(99, 102, 241, 0.5)' : undefined
              }}
            >
              {user ? 'Continue to Dashboard' : 'Get Started Free'} <ArrowRight size={18} />
            </button>
            <button
              type="button"
              onClick={handleDemo}
              className={`btn btn-lg rounded-pill px-4.5 border fw-medium ${
                isDark
                  ? 'border-neutral-700 text-slate-200 bg-neutral-900/60 hover:bg-neutral-800'
                  : 'btn-outline-dark'
              }`}
            >
              {user ? 'Open Workspace' : 'Sign In to Workspace'}
            </button>
            <button
              type="button"
              onClick={() => {
                if (onRequestAccess) onRequestAccess();
              }}
              className={`btn btn-lg rounded-pill px-4.5 border fw-semibold d-flex align-items-center gap-2 ${
                isDark
                  ? 'border-indigo-500/40 text-indigo-300 bg-indigo-950/30 hover:bg-indigo-900/40 shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                  : 'btn-outline-primary'
              }`}
            >
              <span>Request Access</span>
            </button>
          </div>
        </div>
      </section>

      {/* Interactive Carousel Showcase */}
      <section className="container mb-5">
        <div className={`p-1 rounded-3xl overflow-hidden ${
          isDark
            ? 'border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.9)]'
            : 'border border-slate-200 shadow-2xl bg-white'
        }`}>
          <Carsoul />
        </div>
      </section>

      {/* Features Grid */}
      <section className="container py-4" id="features">
        <div className="text-center mb-4">
          <h2 className={`fw-bold fs-2 ${isDark ? 'text-white' : 'text-dark'}`}>
            Engineered for High-Yield Study Performance
          </h2>
          <p className={isDark ? 'text-slate-400' : 'text-muted'}>
            Built for students, researchers, and engineers demanding uncompromising depth, aesthetics, and speed.
          </p>
          {searchQuery && (
            <div className="d-inline-flex align-items-center gap-2 px-3 py-1 rounded-pill bg-primary/10 text-primary border border-primary/20 small fw-semibold mt-1">
              <Search size={14} /> Showing {filteredFeatures.length} matching feature{filteredFeatures.length === 1 ? '' : 's'} for "{searchQuery}"
            </div>
          )}
        </div>

        <div className="row g-4">
          {filteredFeatures.length === 0 ? (
            <div className="col-12 text-center py-5">
              <p className="text-muted">No features found matching "{searchQuery}". Try searching for "Gemini", "Flashcards", or "Obsidian".</p>
            </div>
          ) : (
            filteredFeatures.map((f, idx) => (
              <div key={idx} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`p-4 rounded-3xl h-100 transition-all ${
                    isDark
                      ? 'glass-panel text-slate-100'
                      : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                >
                  <div className={`p-3 rounded-2xl border d-inline-flex align-items-center justify-content-center mb-3 ${f.accent}`}>
                    {f.icon}
                  </div>
                  <h5 className={`fw-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{f.title}</h5>
                  <p className={`small mb-0 ${isDark ? 'text-slate-300' : 'text-muted'}`} style={{ lineHeight: '1.6' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 3-Tier Pricing & Quota Plans */}
      <section className="container py-5" id="pricing">
        <div className="text-center mb-5">
          <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-pill px-3 py-1 mb-2 small fw-semibold">
            Transparent Quotas & Limits
          </span>
          <h2 className={`fw-bold fs-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Flexible Study Plans & Resource Storage
          </h2>
          <p className={isDark ? 'text-slate-400' : 'text-muted'}>
            Configured directly by platform administrators for fair use, strict resource isolation, and offline performance.
          </p>
        </div>

        <div className="row g-4 justify-content-center">
          {(siteConfig?.pricing_tiers || [
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
          ]).map((tier, idx) => {
            const isPopular = tier.id === 'tier-pro' || idx === 1;
            return (
              <div key={tier.id || idx} className="col-12 col-md-6 col-lg-4">
                <div
                  className={`p-4 p-lg-5 rounded-3xl h-100 d-flex flex-column justify-content-between position-relative transition-all ${
                    isPopular
                      ? isDark
                        ? 'bg-gradient-to-b from-indigo-950/60 to-purple-950/40 border-2 border-indigo-500 shadow-[0_15px_40px_rgba(99,102,241,0.3)]'
                        : 'bg-white border-2 border-primary shadow-xl'
                      : isDark
                      ? 'glass-panel border-white/10 text-slate-100'
                      : 'bg-white border border-slate-200 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <div className="position-absolute top-0 start-50 translate-middle">
                      <span className="badge bg-primary text-white rounded-pill px-3 py-1 fw-bold shadow-sm" style={{ fontSize: '0.72rem' }}>
                        ⭐ MOST POPULAR
                      </span>
                    </div>
                  )}

                  <div>
                    <h4 className={`fw-bold mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{tier.name}</h4>
                    <div className="d-flex align-items-baseline gap-1 my-3">
                      <span className={`display-5 fw-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tier.price}</span>
                      <span className={`small ${isDark ? 'text-slate-400' : 'text-muted'}`}>/ account</span>
                    </div>

                    <div className="p-2.5 rounded-2xl mb-4 small fw-semibold" style={{ background: isDark ? 'rgba(255,255,255,0.04)' : '#f8fafc', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0' }}>
                      <div className="d-flex justify-content-between py-1">
                        <span className={isDark ? 'text-slate-400' : 'text-muted'}>Storage Limit:</span>
                        <span className="fw-bold text-primary">{tier.storage_limit_gb} GB</span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span className={isDark ? 'text-slate-400' : 'text-muted'}>PDF Resources:</span>
                        <span className="fw-bold">{tier.resource_limit >= 9000 ? 'Unlimited' : `${tier.resource_limit} Files`}</span>
                      </div>
                      <div className="d-flex justify-content-between py-1">
                        <span className={isDark ? 'text-slate-400' : 'text-muted'}>Daily AI Queries:</span>
                        <span className="fw-bold">{tier.query_limit >= 9000 ? 'Unlimited' : `${tier.query_limit} / day`}</span>
                      </div>
                    </div>

                    <ul className="list-unstyled d-flex flex-column gap-2 mb-4">
                      {tier.features?.map((feat, fIdx) => (
                        <li key={fIdx} className="d-flex align-items-center gap-2 small">
                          <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRequestAccess) onRequestAccess();
                      else handleStart();
                    }}
                    className={`btn w-100 rounded-pill py-2.5 fw-semibold transition-all ${
                      isPopular
                        ? 'btn-primary shadow-md'
                        : isDark
                        ? 'btn-outline-light'
                        : 'btn-outline-primary'
                    }`}
                  >
                    {tier.price === '$0' ? 'Get Started Free' : 'Request Access'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Mission & Automation Banner */}
      <section className="container my-5">
        <div className={`p-4 p-md-5 rounded-3xl border shadow-2xl ${
          isDark
            ? 'glass-panel border-white/10 text-slate-100'
            : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="row align-items-center g-4">
            <div className="col-12 col-md-8">
              <span className="badge bg-success rounded-pill px-3 py-1 mb-2">Our Platform Mission</span>
              <h3 className={`fw-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Eliminate Cognitive Friction in Exam & Research Preparation
              </h3>
              <p className={`mb-0 ${isDark ? 'text-slate-300' : 'text-slate-600'}`} style={{ lineHeight: '1.65' }}>
                Whether mastering DBMS relational algebra in a single sprint or conducting deep literature reviews, our hybrid cloud-local pipeline guarantees that your data stays private, accessible across all devices over Wi-Fi, and synchronized with your desktop workflow.
              </p>
            </div>
            <div className="col-12 col-md-4 text-md-end">
              <button
                type="button"
                onClick={handleDashboardAction}
                className="btn btn-primary rounded-pill px-4 py-2.5 fw-semibold shadow-lg"
                style={{
                  background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                  border: 'none'
                }}
              >
                {user ? 'Continue to Dashboard' : 'Go to Dashboard'}
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
