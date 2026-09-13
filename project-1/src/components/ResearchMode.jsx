import React, { useState, useEffect, useMemo } from 'react';
import {
  Microscope,
  Search,
  Sparkles,
  BookOpen,
  ExternalLink,
  Copy,
  Check,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Calendar,
  FileText,
  StickyNote,
  ChevronRight,
  HelpCircle,
  Clock,
  FolderPlus,
} from 'lucide-react';

export default function ResearchMode({
  isDark = false,
  accessCode = '',
  resources = [],
  isGuest = false,
  onRequireAuth,
  onSaveNote,
  onAddResource,
}) {
  const [query, setQuery] = useState('');
  const [researchReport, setResearchReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'saved'
  const [saveStatus, setSaveStatus] = useState(null); // 'saved' | 'note_saved' | 'resource_saved'
  const [selectedReportModal, setSelectedReportModal] = useState(null);
  const [searchFilter, setSearchFilter] = useState('');

  // Persistent Saved Research Briefs from localStorage
  const [savedReports, setSavedReports] = useState(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem('study_saved_research');
        if (stored) return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Unable to load saved research from storage:', e);
    }
    return [];
  });

  // Save to localStorage when savedReports changes
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('study_saved_research', JSON.stringify(savedReports));
      }
    } catch (e) {}
  }, [savedReports]);

  // Dynamic Question Suggestions derived from uploaded resources
  const dynamicSuggestions = useMemo(() => {
    const list = [];
    if (resources && resources.length > 0) {
      resources.slice(0, 4).forEach((r) => {
        const title = (r.title || 'Material').replace(/\.[^/.]+$/, '').trim();
        list.push(`Synthesize core theorems, definitions, and equations from "${title}"`);
        list.push(`Formulate high-yield exam practice questions based on "${title}"`);
      });
      if (resources.length >= 2) {
        const t1 = (resources[0].title || 'Resource 1').replace(/\.[^/.]+$/, '').trim();
        const t2 = (resources[1].title || 'Resource 2').replace(/\.[^/.]+$/, '').trim();
        list.push(`Contrast methodology & core findings between "${t1}" and "${t2}"`);
      }
    }
    // Fallback standard academic research questions
    if (list.length < 3) {
      list.push('Synthesize Transformer Attention Mechanisms and Multi-Head Scaling laws');
      list.push('Analyze Relational Algebra optimization algorithms and B-Tree indexing');
      list.push('Conduct a structured literature review on distributed consensus protocols');
      list.push('Explain Gradient Descent convergence bounds with mathematical derivation');
    }
    return list.slice(0, 5);
  }, [resources]);

  const handleRunResearch = async (e, customQ = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const targetQ = typeof customQ === 'string' ? customQ.trim() : query.trim();
    if (!targetQ || loading) return;

    if (customQ) setQuery(customQ);
    setLoading(true);
    setResearchReport(null);
    setSaveStatus(null);
    setActiveTab('studio');

    try {
      const formData = new FormData();
      formData.append('query', targetQ);

      const headers = {};
      if (accessCode) {
        headers['x-access-code'] = accessCode;
      }

      const res = await fetch('/api/research', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }

      const data = await res.json();
      setResearchReport(data);
    } catch (err) {
      console.error('Deep Research error:', err);
      setResearchReport({
        query: targetQ,
        research_report: `Error executing deep research query.\n\nPlease ensure your backend is running on port 8000 and Gemini API key is configured.\nDetails: ${err.message}`,
        resources_consulted: resources.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save Current Research to Library
  const handleSaveToLibrary = () => {
    if (!researchReport?.research_report) return;
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    const newEntry = {
      id: Date.now().toString(),
      query: researchReport.query || query,
      report: researchReport.research_report,
      resourcesCount: researchReport.resources_consulted || resources.length,
      timestamp: new Date().toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }),
    };

    setSavedReports((prev) => [newEntry, ...prev.filter((item) => item.query !== newEntry.query)]);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  // Save to Important Notes (Obsidian sync)
  const handleSaveToNotes = (itemToSave) => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const reportItem = itemToSave || researchReport;
    if (!reportItem) return;

    if (onSaveNote) {
      const formattedNote = `[Research Synthesis] ${reportItem.query || query}\n\n${
        reportItem.report || reportItem.research_report
      }`;
      onSaveNote(formattedNote);
      setSaveStatus('note_saved');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  // Save to 50-Item Resource Hub
  const handleSaveAsResource = (itemToSave) => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const reportItem = itemToSave || researchReport;
    if (!reportItem) return;

    if (onAddResource) {
      const newRes = {
        id: Date.now().toString(),
        title: `Research Brief: ${(reportItem.query || query).slice(0, 45)}`,
        type: 'text',
        source: 'Gemini Deep Research',
        date: new Date().toISOString(),
        preview: (reportItem.report || reportItem.research_report).slice(0, 200) + '...',
        content: reportItem.report || reportItem.research_report,
      };
      onAddResource(newRes);
      setSaveStatus('resource_saved');
      setTimeout(() => setSaveStatus(null), 3000);
    }
  };

  const handleDeleteSavedReport = (id) => {
    setSavedReports((prev) => prev.filter((item) => item.id !== id));
    if (selectedReportModal?.id === id) {
      setSelectedReportModal(null);
    }
  };

  const filteredSavedReports = savedReports.filter(
    (item) =>
      !searchFilter.trim() ||
      item.query.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.report.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div
      className={`p-4 rounded-3xl border shadow-sm transition-colors ${
        isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}
    >
      {/* Top Header with Mode Switcher Pills */}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-4 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-3">
          <div className="rounded-2xl bg-primary text-white p-2.5 d-flex align-items-center justify-content-center shadow-sm">
            <Microscope size={22} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0">Gemini Deep Research Notebook</h4>
              <span className="badge bg-primary/10 text-primary border border-primary/20 rounded-pill small">
                {resources.length} Source{resources.length === 1 ? '' : 's'} Active
              </span>
            </div>
            <p className="small text-muted mb-0">
              Conduct literature syntheses, save research briefs, and explore AI-suggested questions grounded in your materials.
            </p>
          </div>
        </div>

        {/* View Switcher: Studio vs Saved Library */}
        <div className="btn-group p-1 rounded-pill bg-slate-100 dark:bg-neutral-800 border">
          <button
            type="button"
            className={`btn btn-sm rounded-pill fw-semibold px-3.5 d-flex align-items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'btn-primary text-white shadow-sm'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-dark'
            }`}
            onClick={() => setActiveTab('studio')}
          >
            <Sparkles size={14} />
            <span>Research Studio</span>
          </button>
          <button
            type="button"
            className={`btn btn-sm rounded-pill fw-semibold px-3.5 d-flex align-items-center gap-1.5 ${
              activeTab === 'saved'
                ? 'btn-primary text-white shadow-sm'
                : isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-dark'
            }`}
            onClick={() => setActiveTab('saved')}
          >
            <Bookmark size={14} />
            <span>Saved Briefs</span>
            {savedReports.length > 0 && (
              <span className="badge bg-white text-primary rounded-pill small py-0.5 px-1.5 ms-1">
                {savedReports.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ================= VIEW 1: RESEARCH STUDIO ================= */}
      {activeTab === 'studio' && (
        <div>
          {/* Dynamic Question Suggestions based on Uploaded Resources */}
          <div className="mb-4">
            <div className="d-flex align-items-center gap-1.5 mb-2 small fw-semibold text-muted">
              <HelpCircle size={14} className="text-primary" />
              <span>Suggested Questions Based on Your Uploaded Resources:</span>
            </div>
            <div className="d-flex flex-wrap gap-2">
              {dynamicSuggestions.map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleRunResearch(null, suggestion)}
                  className={`btn btn-sm rounded-pill text-start small border transition-all py-1.5 px-3 d-flex align-items-center gap-2 ${
                    isDark
                      ? 'border-neutral-800 bg-neutral-900 text-slate-300 hover:bg-neutral-800 hover:text-white'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-dark'
                  }`}
                  title="Click to ask this research question immediately"
                >
                  <span className="text-primary fw-bold">Q:</span>
                  <span>{suggestion}</span>
                  <ChevronRight size={13} className="text-muted ms-auto opacity-75" />
                </button>
              ))}
            </div>
          </div>

          {/* Research Query Bar */}
          <form onSubmit={handleRunResearch} className="mb-4">
            <div className="input-group input-group-lg shadow-sm">
              <input
                type="text"
                className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : ''}`}
                placeholder="Ask a deep research question, request proof derivations, or synthesize cross-chapter relationships..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!query.trim() || loading}
                className="btn btn-primary px-4 d-flex align-items-center gap-2 fw-semibold"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" />
                    <span>Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span>Deep Research</span>
                  </>
                )}
              </button>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2 px-1 small text-muted">
              <span>Unrestricted academic reasoning across uploaded lecture PDFs, notes, and text materials.</span>
              <span>Grounding Sources: {resources.length} / 50</span>
            </div>
          </form>

          {/* Save Status Notification Feedback */}
          {saveStatus && (
            <div className="alert alert-success py-2.5 px-3.5 small rounded-2xl d-flex align-items-center gap-2 mb-3 shadow-sm">
              <Check size={16} />
              <span>
                {saveStatus === 'saved' && '✓ Successfully saved research report to your Saved Briefs Library!'}
                {saveStatus === 'note_saved' && '✓ Saved as note in Important Notes (Synchronized with Obsidian).'}
                {saveStatus === 'resource_saved' && '✓ Saved into your 50-Item Multi-Resource Hub!'}
              </span>
            </div>
          )}

          {/* Active Research Report Output */}
          {researchReport && (
            <div
              className={`p-4 rounded-2xl border mt-3 ${
                isDark
                  ? 'bg-slate-800/80 border-slate-700 text-slate-100 shadow-xl'
                  : 'bg-slate-50 border-slate-200 text-slate-900 shadow-sm'
              }`}
            >
              <div className="d-flex justify-content-between align-items-start flex-wrap gap-2 mb-3 pb-3 border-bottom">
                <div>
                  <div className="d-flex align-items-center gap-2 mb-1">
                    <BookOpen className="text-primary" size={20} />
                    <h5 className="mb-0 fw-bold">Research Synthesis Brief</h5>
                  </div>
                  <span className="small text-muted">
                    Prompt: <strong>"{researchReport.query || query}"</strong>
                  </span>
                </div>

                {/* Report Action Buttons */}
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleSaveToLibrary}
                    className="btn btn-sm btn-primary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5 shadow-sm"
                    title="Save to your permanent Saved Research Library"
                  >
                    <Bookmark size={14} />
                    <span>Save to Library</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveToNotes(researchReport)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5"
                    title="Save this brief directly into Important Notes (Obsidian sync)"
                  >
                    <StickyNote size={14} />
                    <span>Save as Note</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveAsResource(researchReport)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5"
                    title="Save this brief as a reusable document in your Resource Hub"
                  >
                    <FolderPlus size={14} />
                    <span>Save as Resource</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(researchReport.research_report)}
                    className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 d-flex align-items-center gap-1"
                    title="Copy report text"
                  >
                    {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div
                className="research-content"
                style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '0.96rem' }}
              >
                {researchReport.research_report}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= VIEW 2: SAVED RESEARCH ARCHIVE ================= */}
      {activeTab === 'saved' && (
        <div>
          {/* Header Controls: Search filter & count */}
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2">
            <div>
              <h5 className="fw-bold mb-0">Saved Research Briefs Archive</h5>
              <span className="small text-muted">
                {savedReports.length} research brief{savedReports.length === 1 ? '' : 's'} saved locally on this device.
              </span>
            </div>
            <div style={{ maxWidth: '280px', width: '100%' }}>
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-transparent">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
                  placeholder="Filter saved research..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          {filteredSavedReports.length === 0 ? (
            <div className="text-center py-5 border rounded-3xl p-4">
              <BookOpen size={40} className="text-muted mb-2 opacity-50" />
              <h6 className="fw-bold mb-1">No Saved Research Briefs Yet</h6>
              <p className="small text-muted mb-3">
                When you generate in-depth reports in Gemini Research Studio, tap "Save to Library" to archive them here.
              </p>
              <button
                type="button"
                onClick={() => setActiveTab('studio')}
                className="btn btn-sm btn-primary rounded-pill px-4 fw-semibold shadow-sm"
              >
                Start New Research
              </button>
            </div>
          ) : (
            <div className="row g-3">
              {filteredSavedReports.map((item) => (
                <div key={item.id} className="col-12">
                  <div
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isDark
                        ? 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="d-flex justify-content-between align-items-start gap-3 mb-2">
                      <div>
                        <span className="badge bg-primary-subtle text-primary rounded-pill small px-2.5 py-0.5 mb-1.5 fw-semibold">
                          Research Synthesis
                        </span>
                        <h6 className="fw-bold mb-1">{item.query}</h6>
                        <div className="d-flex align-items-center gap-3 small text-muted">
                          <span className="d-flex align-items-center gap-1">
                            <Clock size={12} /> {item.timestamp}
                          </span>
                          <span>•</span>
                          <span>{item.resourcesCount || 0} resources analyzed</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="d-flex align-items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedReportModal(item)}
                          className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-medium"
                          title="View Full Report"
                        >
                          View Full Brief
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveToNotes(item)}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                          title="Save to Important Notes"
                        >
                          <StickyNote size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.report)}
                          className="btn btn-sm btn-outline-secondary rounded-pill px-2.5 py-1"
                          title="Copy Report"
                        >
                          <Copy size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSavedReport(item.id)}
                          className="btn btn-sm btn-outline-danger rounded-pill px-2 py-1"
                          title="Delete from Library"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>

                    <p
                      className="small text-muted mb-0 line-clamp-2"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.6',
                      }}
                    >
                      {item.report}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ================= FULL REPORT MODAL ================= */}
      {selectedReportModal && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center p-3"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.75)', zIndex: 9999, backdropFilter: 'blur(8px)' }}
          onClick={() => setSelectedReportModal(null)}
        >
          <div
            className="p-4 p-md-5 rounded-3xl shadow-2xl position-relative"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '750px',
              width: '100%',
              maxHeight: '88vh',
              overflowY: 'auto',
              backgroundColor: isDark ? '#0d1117' : '#ffffff',
              border: isDark ? '1px solid rgba(255, 255, 255, 0.15)' : '1px solid #cbd5e1',
              color: isDark ? '#ffffff' : '#0f172a',
            }}
          >
            <div className="d-flex justify-content-between align-items-start gap-2 mb-3 pb-3 border-bottom">
              <div>
                <span className="badge bg-primary text-white rounded-pill px-3 py-1 mb-2 small fw-semibold">
                  Saved Research Brief
                </span>
                <h4 className="fw-bold mb-1">{selectedReportModal.query}</h4>
                <span className="small text-muted">
                  Saved on {selectedReportModal.timestamp} • {selectedReportModal.resourcesCount} sources consulted
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className={`btn btn-sm rounded-circle p-1.5 border-0 ${
                  isDark ? 'text-slate-300 hover:text-white bg-neutral-800' : 'text-slate-600 bg-slate-100'
                }`}
              >
                ✕
              </button>
            </div>

            <div
              className="p-3.5 rounded-2xl mb-4"
              style={{
                backgroundColor: isDark ? '#161b22' : '#f8fafc',
                whiteSpace: 'pre-line',
                lineHeight: '1.85',
                fontSize: '0.95rem',
              }}
            >
              {selectedReportModal.report}
            </div>

            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <div className="d-flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveToNotes(selectedReportModal)}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-medium d-flex align-items-center gap-1.5"
                >
                  <StickyNote size={14} /> Send to Notes
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveAsResource(selectedReportModal)}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-medium d-flex align-items-center gap-1.5"
                >
                  <FolderPlus size={14} /> Save to Resources
                </button>
                <button
                  type="button"
                  onClick={() => handleCopy(selectedReportModal.report)}
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3.5 py-1.5 fw-medium d-flex align-items-center gap-1.5"
                >
                  <Copy size={14} /> Copy
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReportModal(null)}
                className="btn btn-primary rounded-pill px-4 py-1.5 fw-semibold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
