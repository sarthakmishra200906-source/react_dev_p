import React, { useState, useEffect } from 'react';

export default function Report({ tasks = [], notes = [] }) {
  const [reportData, setReportData] = useState(null);
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  // Compute dynamic API endpoint (routes through Vite proxy on localhost and any WiFi device)
  const getApiUrl = (endpoint) => {
    return endpoint;
  };

  // On initial mount / page refresh: clear backend docs to save space
  useEffect(() => {
    fetch(getApiUrl('/api/clear-session'), { method: 'POST' })
      .catch(() => {
        // Backend may still be spinning up
      });
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const handleGenerateReport = async (e, overridePrompt = null) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    setLoading(true);

    const activePrompt = (typeof overridePrompt === 'string')
      ? overridePrompt.trim()
      : customPrompt.trim();

    const textContent = `
=== TASKS ===
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None'}

=== NOTES ===
${notes.map((n, i) => `${i + 1}. ${n}`).join('\n') || 'None'}
    `.trim();

    const formData = new FormData();
    formData.append('prompt', activePrompt);
    formData.append('text_content', textContent);
    formData.append('chat_history', JSON.stringify(chatHistory));
    
    if (pdfFile) {
      formData.append('pdf', pdfFile);
    }

    try {
      let response;
      try {
        response = await fetch('/api/generate-report', {
          method: 'POST',
          body: formData,
        });
      } catch (err) {
        // Fallback directly to current host port 8000
        const host = window.location.hostname || 'localhost';
        response = await fetch(`http://${host}:8000/api/generate-report`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const resultText = data.result || "No response received.";

      setReportData({
        summary: resultText,
        totalItems: tasks.length + notes.length,
        hasPdf: !!pdfFile,
        generatedAt: new Date().toLocaleTimeString(),
        isCustomPrompt: Boolean(activePrompt),
      });

      // Update conversational history
      setChatHistory((prev) => [
        ...prev,
        { role: "user", content: activePrompt || "Default 7-Line Summary & Task Guidance" },
        { role: "assistant", content: resultText }
      ]);
    } catch (error) {
      console.error("RAG Pipeline error:", error);
      setReportData({
        summary: "Error connecting to RAG backend server on port 8000.\n\nPlease start the backend to listen on all WiFi interfaces:\ncd project-1/backend\npython -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload",
        totalItems: tasks.length + notes.length,
        hasPdf: !!pdfFile,
        generatedAt: new Date().toLocaleTimeString(),
        isCustomPrompt: false,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-100 max-w-2xl mx-auto my-4 p-4 border rounded-2xl bg-slate-50 shadow-sm">
      <h2 className="text-center fw-bold mb-3 text-dark">AI Multi-Modal RAG Report</h2>
      
      <div className="mb-3">
        <label className="form-label fw-medium text-secondary">
          Upload PDF Document (Optional Multi-Modal Context):
        </label>
        <input 
          type="file" 
          accept=".pdf" 
          className="form-control" 
          onChange={handleFileChange} 
        />
        {pdfFile && (
          <small className="text-success mt-1 d-block fw-semibold">
            Attached: {pdfFile.name} ({(pdfFile.size / 1024).toFixed(1)} KB)
          </small>
        )}
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium text-secondary">
          Custom Instruction / Query (Optional):
        </label>
        <input 
          type="text" 
          className="form-control" 
          placeholder="Leave blank for 7-line analysis, or type custom query for 5-line answer..."
          value={customPrompt} 
          onChange={(e) => setCustomPrompt(e.target.value)} 
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleGenerateReport(e);
            }
          }}
        />
        <small className="text-muted d-block mt-1">
          {customPrompt.trim() 
            ? "Mode: Custom prompt -> 5-line focused response" 
            : tasks.length === 0 && notes.length === 0
              ? "Mode: Empty Workspace -> 8-line App Onboarding & Study Guide"
              : "Mode: Default -> 7-line report (3-line summary of usert.txt + 4-line task guidance)"}
        </small>
      </div>

      <button 
        type="button"
        className="btn btn-primary d-block mx-auto rounded-pill px-4 mb-4 shadow-sm"
        onClick={(e) => handleGenerateReport(e)}
        disabled={loading}
      >
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Processing RAG & Generating...
          </>
        ) : (
          "Generate AI Report"
        )}
      </button>

      {reportData && (
        <div className="report-container bg-white p-4 rounded-xl border shadow-sm">
          <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
            <h5 className="mb-0 fw-bold text-dark">
              {reportData.isCustomPrompt 
                ? "Custom AI Answer (5 Lines)" 
                : reportData.totalItems === 0 && !reportData.hasPdf
                  ? "App Onboarding & Study Guide (8 Lines)"
                  : "RAG Report & Task Guidance (7 Lines)"}
            </h5>
            <div>
              <span className="badge bg-secondary me-2">Items: {reportData.totalItems}</span>
              {reportData.hasPdf && <span className="badge bg-info text-dark">PDF Attached</span>}
            </div>
          </div>

          <div className="report-body my-3 p-3 bg-light rounded border">
            <pre className="mb-0 text-wrap" style={{ fontFamily: 'inherit', whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
              {reportData.summary}
            </pre>
          </div>

          <div className="mt-3 pt-2 text-end text-muted small border-top">
            Generated at {reportData.generatedAt}
          </div>

          <div className="mt-3 d-flex justify-content-end gap-2">
            <button 
              type="button"
              className="btn btn-outline-secondary btn-sm" 
              onClick={() => {
                setReportData(null);
                setChatHistory([]);
              }}
            >
              Clear
            </button>
            <button 
              type="button"
              className="btn btn-outline-primary btn-sm" 
              onClick={(e) => handleGenerateReport(e)} 
              disabled={loading}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}