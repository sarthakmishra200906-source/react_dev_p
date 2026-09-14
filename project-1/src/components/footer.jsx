import React, { useState } from 'react';
import { Brain, ShieldCheck, Check, Sparkles, Send, Info, X, ExternalLink, ArrowRight } from 'lucide-react';

export default function Footer({
  isDark = false,
  onNavigateTab,
  onOpenDemo,
  onOpenAuth,
}) {
  const [emailInput, setEmailInput] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [activeInfo, setActiveInfo] = useState(null);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSubscribed(true);
    setEmailInput('');
    setTimeout(() => setSubscribed(false), 4000);
  };

  // Educational Explanations & Credits for footer topics
  const infoData = {
    geminiDeepResearch: {
      title: 'Gemini Deep Research Mode',
      badge: 'Academic Synthesis',
      tab: 'research',
      about:
        'A comprehensive research reasoning pipeline powered by Google Gemini models designed to produce long-form, rigorous academic literature reviews, paper syntheses, and technical briefs without line-count constraints.',
      credit: 'Credit to Google DeepMind for the Gemini multimodal reasoning API.',
      howItWorks:
        'When active in your workspace, Gemini Deep Research analyzes all your uploaded study materials, citing sections, identifying contradictions, and generating publication-grade synthesis directly from your files.',
    },
    flowcharts: {
      title: 'Automated Concept Flowcharts & Mind Maps',
      badge: 'Visual Learning',
      tab: 'study',
      about:
        'A dynamic visual structuring engine that transforms dense textbook chapters and procedural steps into hierarchical Mermaid.js dependency diagrams.',
      credit: 'Credit to the Mermaid.js open-source community for vector diagram rendering.',
      howItWorks:
        'The AI parses prerequisites and causal relationships in your notes, automatically constructing zoomable SVG concept graphs so you visualize knowledge flow before exams.',
    },
    flashcards: {
      title: 'Active Recall 3D Flip Flashcards',
      badge: 'Cognitive Science',
      tab: 'study',
      about:
        'A spaced-repetition active-recall study system engineered with smooth CSS 3D perspective transforms and cognitive retrieval principles.',
      credit: 'Designed following Hermann Ebbinghaus forgetting curve research and modern CSS 3D transforms.',
      howItWorks:
        'Key definitions, formulas, and concepts are automatically isolated into interactive double-sided cards to test memory retention and accelerate revision.',
    },
    taskManager: {
      title: 'Standard Task & Sprint Manager',
      badge: 'Focus Sprint',
      tab: 'tasks',
      about:
        'A structured productivity tracker built for academic sprints, deadline management, and assignment milestone planning.',
      credit: 'Inspired by modern Kanban and GTD (Getting Things Done) methodologies.',
      howItWorks:
        'Organizes your exam preparations into prioritized tasks, tracking completion progress and syncing milestones directly into your local Obsidian study vault.',
    },
    ollama: {
      title: 'Local Ollama & Meta Llama 3',
      badge: 'Local AI Engine',
      tab: 'rag',
      about:
        'Ollama is an open-source framework that bundles model weights, configurations, and GPU acceleration into an easy local CLI. Llama 3 is Meta AI’s flagship open foundation model, recognized worldwide for its academic reasoning and math capability.',
      credit: 'Credit to Meta AI for the open Llama 3 weights and the Ollama community for the local inference engine.',
      howItWorks:
        'In our platform, Ollama runs directly on your machine. When you generate study summaries or break down tasks, the local Llama 3 model processes your requests completely offline. Your notes and exam materials never leave your device.',
    },
    dualFallback: {
      title: 'Dual-Engine Redundancy & Cascading Fallback',
      badge: 'System Reliability',
      tab: 'rag',
      about:
        'A resilient multi-model pipeline that combines high-throughput cloud vision models with local offline privacy fallback.',
      credit: 'Google DeepMind (Gemini 3.6/3.8 Flash) and Meta AI (Llama 3).',
      howItWorks:
        'When you ask a question or upload complex syllabus diagrams, the platform first queries Google Gemini Flash for instant visual comprehension. If your internet disconnects or API limits are hit, it automatically and silently switches to your local Llama 3 without interrupting your revision.',
    },
    resourceLib: {
      title: '50-Item Multi-Resource Hub',
      badge: 'Grounded Context',
      tab: 'resources',
      about:
        'A comprehensive in-memory and disk-grounded knowledge base supporting lecture PDFs, raw text equations, and external research URLs.',
      credit: 'Built using FastAPI file streams, PyPDF, and vector context slicing.',
      howItWorks:
        'Instead of hallucinating answers, the AI strictly reads from your 50 uploaded study items. When you ask exam questions, it cites formulas and chapter sections directly from your materials.',
    },
    obsidian: {
      title: 'Obsidian Desktop Sync & Markdown Export',
      badge: 'Productivity Tooling',
      tab: 'study',
      about:
        'Obsidian is a premier personal knowledge management (PKM) application that operates on a local folder of plain text Markdown files.',
      credit: 'Credit to the Obsidian.md team for championing local-first personal knowledge management.',
      howItWorks:
        'Every time you save an important note or milestone in this web app, it automatically writes a clean Markdown file with YAML frontmatter into backend/notes_export/study_workspace_notes.md, letting you edit or link notes inside Obsidian or VS Code immediately.',
    },
    privacy: {
      title: 'Zero Telemetry & Local Privacy Guard',
      badge: 'Data Security',
      tab: 'rag',
      about:
        'A commitment to student data sovereignty where your academic notes, grades, and coursework are never used for third-party model training.',
      credit: 'Local-first architecture inspired by modern privacy research.',
      howItWorks:
        'All PDF documents, personal study schedules, and notes remain stored strictly on your local disk. Offline mode routes 100% of intelligence through your local GPU, so sensitive coursework is completely private.',
    },
    precision: {
      title: 'Built for Academic Mastery',
      badge: 'Our Mission',
      tab: 'study',
      about:
        'Engineered to eliminate cognitive overload and help students, researchers, and engineers score maximum marks with minimum stress.',
      credit: 'Built with modern React, FastAPI, Tailwind, and deep agentic pair-programming.',
      howItWorks:
        'Combines concept dependency mind maps, active recall flashcards, and automated iCal sprint calendars so you spend time mastering concepts rather than organizing folders.',
    },
  };

  return (
    <>
      <footer
        className={`py-5 border-top transition-colors w-100 mt-auto ${
          isDark ? 'border-neutral-900 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}
        style={{ backgroundColor: isDark ? '#000000' : undefined }}
      >
        <div className="container px-4 mx-auto">
          <div className="row g-4 mb-5">
            {/* Brand & Mission Column */}
            <div className="col-12 col-lg-5 pe-lg-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <div
                  className="rounded-xl text-white p-2 d-flex align-items-center justify-content-center shadow-sm"
                  style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                >
                  <Brain size={22} />
                </div>
                <span className={`fw-bold fs-4 tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  StudyAI Platform
                </span>
              </div>

              <p className="small mb-3" style={{ lineHeight: '1.65' }}>
                An enterprise-grade, privacy-first AI study intelligence and automation engine. Built with hybrid Cloud-Local inference (Gemini 3.6/3.8 Flash + Local Ollama Llama 3), multi-modal OCR vision, active recall flashcards, and native Obsidian/iCal calendar synchronization.
              </p>

              <div
                onClick={() => setActiveInfo(infoData.privacy)}
                className="d-inline-flex align-items-center gap-2 small text-muted cursor-pointer hover:text-primary transition-colors"
                title="Click to learn about privacy architecture"
              >
                <ShieldCheck size={16} className="text-success flex-shrink-0" />
                <span className="text-decoration-underline text-decoration-dotted">Zero telemetry data leaks • Offline Llama 3 privacy fallback</span>
              </div>
            </div>

            {/* Platform Architecture Column */}
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className={`fw-bold text-uppercase small tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-dark'}`}>
                Architecture
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2.5 mb-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.geminiDeepResearch)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    Gemini Deep Research <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.ollama)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1 text-primary fw-medium"
                  >
                    Local Ollama Llama 3 <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.dualFallback)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    Dual-Engine Fallback <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.resourceLib)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    50-Item Resource Hub <Info size={13} className="opacity-75" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Interactive Learning Tools Column */}
            <div className="col-6 col-md-3 col-lg-2">
              <h6 className={`fw-bold text-uppercase small tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-dark'}`}>
                Study Tools
              </h6>
              <ul className="list-unstyled small d-flex flex-column gap-2.5 mb-0">
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.flowcharts)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    Concept Flowcharts <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.flashcards)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    3D Flip Flashcards <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.taskManager)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1"
                  >
                    Standard Task Manager <Info size={13} className="opacity-75" />
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => setActiveInfo(infoData.obsidian)}
                    className="btn btn-link p-0 text-decoration-none small text-reset text-start hover:text-primary d-flex align-items-center gap-1 text-primary fw-medium"
                  >
                    Obsidian Desktop Sync <Info size={13} className="opacity-75" />
                  </button>
                </li>
              </ul>
            </div>

            {/* Newsletter Subscription Column */}
            <div className="col-12 col-md-6 col-lg-3">
              <h6 className={`fw-bold text-uppercase small tracking-wider mb-3 ${isDark ? 'text-slate-200' : 'text-dark'}`}>
                Stay In Sync
              </h6>
              <p className="small mb-3">
                Subscribe for open-source study model weights, syllabus updates, and exam sprint templates.
              </p>

              {subscribed ? (
                <div className="alert alert-success py-2 px-3 small rounded-pill d-flex align-items-center gap-2 mb-0">
                  <Check size={16} /> Subscribed! Exam sprint templates incoming.
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="d-flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="Enter study email..."
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className={`form-control form-control-sm rounded-pill px-3 ${
                      isDark ? 'bg-neutral-900 border-neutral-800 text-white placeholder-slate-500' : 'bg-white border-slate-300'
                    }`}
                  />
                  <button type="submit" className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold d-flex align-items-center gap-1">
                    <Send size={13} /> Join
                  </button>
                </form>
              )}
            </div>
          </div>

          <hr className={`my-4 ${isDark ? 'border-neutral-800' : 'border-slate-200'}`} />

          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 small text-muted">
            <div>
              © 2026 AI Study & Automation Platform. All rights reserved.
            </div>
            <div
              onClick={() => setActiveInfo(infoData.precision)}
              className="d-flex align-items-center gap-1 cursor-pointer hover:text-primary transition-colors"
              title="Click to learn about project methodology"
            >
              <Sparkles size={14} className="text-primary" />
              <span>Built for student academic mastery (Learn more)</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Footer Info Modal (100% Opaque & High-Contrast) */}
      {activeInfo && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 9999,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
          }}
          onClick={() => setActiveInfo(null)}
        >
          <div
            className="p-4 p-md-5 rounded-3xl shadow-2xl position-relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: isDark ? '#0d1117' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              color: isDark ? '#ffffff' : '#0f172a',
              opacity: 1,
              boxShadow: isDark ? '0 25px 60px rgba(0, 0, 0, 0.95)' : '0 20px 45px rgba(0, 0, 0, 0.2)',
            }}
          >
            <div className="d-flex justify-content-between align-items-start gap-2 mb-3">
              <div>
                <span className="badge bg-primary text-white rounded-pill small px-3 py-1 mb-2 fw-semibold">
                  {activeInfo.badge}
                </span>
                <h3 className={`fw-bold mb-0 ${isDark ? 'text-white' : 'text-slate-900'}`}>{activeInfo.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveInfo(null)}
                className={`btn btn-sm p-1.5 rounded-circle border-0 ${
                  isDark ? 'text-slate-300 hover:text-white bg-neutral-800' : 'text-slate-600 hover:text-dark bg-slate-100'
                }`}
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* About & Credits (High Contrast) */}
            <div
              className="p-3.5 rounded-2xl border mb-3 small"
              style={{
                backgroundColor: isDark ? '#161b22' : '#f8fafc',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#e2e8f0',
                color: isDark ? '#e6edf3' : '#334155',
              }}
            >
              <p className="mb-2" style={{ lineHeight: '1.65', fontSize: '0.92rem' }}>
                {activeInfo.about}
              </p>
              <p className="mb-0 fw-semibold text-primary" style={{ fontSize: '0.82rem' }}>
                💡 {activeInfo.credit}
              </p>
            </div>

            {/* How It Works in Our Platform (High Contrast) */}
            <div className="mb-4">
              <h6 className={`fw-bold small text-uppercase tracking-wider mb-2 ${isDark ? 'text-indigo-400' : 'text-primary'}`}>
                How It Works In Your Study Workflow
              </h6>
              <p className="small mb-0" style={{ lineHeight: '1.7', fontSize: '0.92rem', color: isDark ? '#cbd5e1' : '#475569' }}>
                {activeInfo.howItWorks}
              </p>
            </div>

            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                onClick={() => setActiveInfo(null)}
                className={`btn btn-sm rounded-pill px-3.5 py-2 fw-medium ${
                  isDark ? 'btn-outline-light' : 'btn-outline-secondary'
                }`}
              >
                Close
              </button>
              {onNavigateTab && (
                <button
                  type="button"
                  onClick={() => {
                    const targetTab = activeInfo.tab || 'study';
                    setActiveInfo(null);
                    onNavigateTab(targetTab);
                  }}
                  className="btn btn-sm btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-1.5"
                >
                  <span>Open in Workspace</span>
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}