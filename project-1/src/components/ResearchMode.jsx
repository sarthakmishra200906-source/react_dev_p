import React, { useState } from 'react';
import { Microscope, Search, Sparkles, BookOpen, ExternalLink, Copy, Check } from 'lucide-react';

export default function ResearchMode({
  isDark = false,
  accessCode = '',
  resources = [],
  isGuest = false,
  onRequireAuth,
}) {
  const [query, setQuery] = useState('');
  const [researchReport, setResearchReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleRunResearch = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    const cleanQ = query.trim();
    if (!cleanQ || loading) return;

    setLoading(true);
    setResearchReport(null);

    try {
      const formData = new FormData();
      formData.append('query', cleanQ);

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
        query: cleanQ,
        research_report: `Error executing deep research query.\n\nPlease ensure your backend is running on port 8000 and Gemini API key is configured.\nDetails: ${err.message}`,
        resources_consulted: resources.length,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!researchReport?.research_report) return;
    navigator.clipboard.writeText(researchReport.research_report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-3 pb-3 border-bottom">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-primary text-white p-2 d-flex align-items-center justify-content-center">
            <Microscope size={22} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Gemini Deep Research Mode</h4>
            <p className="small text-muted mb-0">
              Unrestricted, in-depth academic synthesis across all {resources.length} uploaded study materials.
            </p>
          </div>
        </div>
        <span className="badge bg-primary-subtle text-primary border border-primary px-3 py-2 rounded-pill small">
          Active Multi-Resource Engine
        </span>
      </div>

      {/* Query Bar */}
      <form onSubmit={handleRunResearch} className="mb-4">
        <div className="input-group input-group-lg shadow-sm">
          <input
            type="text"
            className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            placeholder="Ask a deep research question, request a proof, code, or comprehensive concept synthesis..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="btn btn-primary px-4 d-flex align-items-center gap-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm" role="status" />
                Synthesizing...
              </>
            ) : (
              <>
                <Sparkles size={18} />
                Deep Research
              </>
            )}
          </button>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2 px-1 small text-muted">
          <span>Synthesizes full textbook chapters, mathematical derivations, and multi-file relationships.</span>
          <span>Resources Consulted: {resources.length} / 50</span>
        </div>
      </form>

      {/* Research Output Console */}
      {researchReport && (
        <div className={`p-4 rounded-xl border mt-3 ${
          isDark ? 'bg-slate-800/80 border-slate-700 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
        }`}>
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <div className="d-flex align-items-center gap-2">
              <BookOpen className="text-primary" size={20} />
              <h5 className="mb-0 fw-bold">Research Synthesis Report</h5>
            </div>
            <div className="d-flex align-items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="btn btn-sm btn-outline-secondary rounded-pill px-3 d-flex align-items-center gap-1"
              >
                {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          <div
            className="research-content"
            style={{ whiteSpace: 'pre-line', lineHeight: '1.8', fontSize: '0.95rem' }}
          >
            {researchReport.research_report}
          </div>
        </div>
      )}
    </div>
  );
}
