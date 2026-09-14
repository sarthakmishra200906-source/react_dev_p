import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Square, FastForward, Scale, Sparkles, RefreshCw, Trash2 } from 'lucide-react';
import FlowchartView from './FlowchartView';
import QuizFlashcards from './QuizFlashcards';
import StudySchedule from './StudySchedule';

export default function Report({
  tasks = [],
  notes = [],
  isDark = false,
  accessCode = '',
  isGuest = false,
  onRequireAuth,
  onAddResource,
  onWipeAllData,
  onOpenStudyMode,
  user = null,
  isAdmin = false,
}) {
  const isPaid = Boolean(isAdmin || user?.is_paid || user?.tier === 'paid' || user?.role === 'admin');
  const [reportData, setReportData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('study_report_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [chatHistory, setChatHistory] = useState(() => {
    try {
      const saved = sessionStorage.getItem('study_chat_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Multi-Modal Interactive States
  const [flowchartData, setFlowchartData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('study_flowchart_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [quizData, setQuizData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('study_quiz_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [scheduleData, setScheduleData] = useState(() => {
    try {
      const saved = sessionStorage.getItem('study_schedule_data');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [icsContent, setIcsContent] = useState('');

  // Persist report data into sessionStorage so it survives tab switching and refresh
  useEffect(() => {
    try {
      if (reportData) sessionStorage.setItem('study_report_data', JSON.stringify(reportData));
      else sessionStorage.removeItem('study_report_data');
    } catch {}
  }, [reportData]);

  useEffect(() => {
    try {
      if (chatHistory && chatHistory.length > 0) sessionStorage.setItem('study_chat_history', JSON.stringify(chatHistory));
      else sessionStorage.removeItem('study_chat_history');
    } catch {}
  }, [chatHistory]);

  useEffect(() => {
    try {
      if (flowchartData) sessionStorage.setItem('study_flowchart_data', JSON.stringify(flowchartData));
      else sessionStorage.removeItem('study_flowchart_data');
    } catch {}
  }, [flowchartData]);

  useEffect(() => {
    try {
      if (quizData) sessionStorage.setItem('study_quiz_data', JSON.stringify(quizData));
      else sessionStorage.removeItem('study_quiz_data');
    } catch {}
  }, [quizData]);

  useEffect(() => {
    try {
      if (scheduleData) sessionStorage.setItem('study_schedule_data', JSON.stringify(scheduleData));
      else sessionStorage.removeItem('study_schedule_data');
    } catch {}
  }, [scheduleData]);

  // Dual-Model Comparison State
  const [compareMode, setCompareMode] = useState(false);
  const [compareResults, setCompareResults] = useState(null);
  const [comparing, setComparing] = useState(false);

  // Web Speech API State
  const supportsSpeech = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isPausedAudio, setIsPausedAudio] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const utteranceRef = useRef(null);

  // Component cleanup only - DO NOT wipe backend database on tab mount
  useEffect(() => {
    return () => {
      if (supportsSpeech && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setPdfFile(e.target.files[0]);
    }
  };

  const getHeaders = () => {
    const headers = {};
    if (user?.token) {
      headers['Authorization'] = `Bearer ${user.token}`;
      headers['x-user-token'] = user.token;
    }
    if (user?.email) {
      headers['x-user-email'] = user.email;
    }
    if (accessCode) {
      headers['x-access-code'] = accessCode;
    }
    return headers;
  };

  // Fetch ancillary interactive data (Flowchart, Quiz, Schedule)
  const fetchInteractiveFeatures = async (textContent) => {
    try {
      const fd = new FormData();
      fd.append('text_content', textContent);
      const [fcRes, qzRes, scRes] = await Promise.all([
        fetch('/api/generate-flowchart', { method: 'POST', headers: getHeaders(), body: fd }).catch(() => null),
        fetch('/api/generate-quiz', { method: 'POST', headers: getHeaders(), body: fd }).catch(() => null),
        fetch('/api/generate-schedule', { method: 'POST', headers: getHeaders(), body: fd }).catch(() => null),
      ]);

      if (fcRes && fcRes.ok) {
        const ct = fcRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const fc = await fcRes.json();
          setFlowchartData(fc.data);
        }
      }
      if (qzRes && qzRes.ok) {
        const ct = qzRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const qz = await qzRes.json();
          setQuizData(qz.data);
        }
      }
      if (scRes && scRes.ok) {
        const ct = scRes.headers.get('content-type') || '';
        if (ct.includes('application/json')) {
          const sc = await scRes.json();
          setScheduleData(sc.schedule);
          setIcsContent(sc.ics_content);
        }
      }
    } catch (e) {
      console.warn('Interactive data fetch error:', e);
    }
  };

  const handleGenerateReport = async (e, overridePrompt = null) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setLoading(true);

    const activePrompt = typeof overridePrompt === 'string' ? overridePrompt.trim() : customPrompt.trim();

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
      const response = await fetch('/api/generate-report', {
        method: 'POST',
        headers: getHeaders(),
        body: formData,
      });

      const contentType = response.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) {
        data = await response.json();
      } else {
        const text = await response.text();
        throw new Error(text.slice(0, 150) || `Server returned status ${response.status}`);
      }

      if (!response.ok) {
        throw new Error(data.detail || `Server returned status ${response.status}`);
      }

      const resultText = data.result || 'No response received.';

      if (data.resource && onAddResource) {
        onAddResource(data.resource);
      }

      setReportData({
        summary: resultText,
        totalItems: tasks.length + notes.length,
        hasPdf: !!pdfFile,
        generatedAt: new Date().toLocaleTimeString(),
        isCustomPrompt: Boolean(activePrompt),
      });

      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: activePrompt || 'Default 7-Line Summary & Task Guidance' },
        { role: 'assistant', content: resultText },
      ]);

      // Automatically fetch interactive flowchart, quiz, and study schedule
      fetchInteractiveFeatures(textContent);
    } catch (error) {
      console.error('RAG Pipeline error:', error);
      const isConn = error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError');
      const errorMsg = isConn
        ? 'Could not connect to the backend server. Please verify backend is running on port 8000.'
        : `AI Generation Notice: ${error.message}`;
      setReportData({
        summary: errorMsg,
        totalItems: tasks.length + notes.length,
        hasPdf: !!pdfFile,
        generatedAt: new Date().toLocaleTimeString(),
        isCustomPrompt: false,
      });
    } finally {
      setLoading(false);
    }
  };

  // Dual-Model Parallel Comparison Execution
  const handleCompareModels = async () => {
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    setComparing(true);
    setCompareResults(null);

    const textContent = `
=== TASKS ===
${tasks.map((t, i) => `${i + 1}. ${t}`).join('\n') || 'None'}

=== NOTES ===
${notes.map((n, i) => `${i + 1}. ${n}`).join('\n') || 'None'}
    `.trim();

    const fd = new FormData();
    fd.append('prompt', customPrompt.trim() || 'Provide a 5-line prioritized revision strategy.');
    fd.append('text_content', textContent);
    if (pdfFile) {
      fd.append('pdf', pdfFile);
    }

    try {
      const res = await fetch('/api/compare-models', {
        method: 'POST',
        headers: getHeaders(),
        body: fd,
      });
      if (res.ok) {
        const data = await res.json();
        setCompareResults(data.comparison);
      }
    } catch (e) {
      console.error('Comparison error:', e);
    } finally {
      setComparing(false);
    }
  };

  // Web Speech API Controls
  const handlePlayAudio = () => {
    if (!supportsSpeech || !reportData?.summary) return;

    if (isPausedAudio) {
      window.speechSynthesis.resume();
      setIsPausedAudio(false);
      setIsPlayingAudio(true);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean emojis & formatting for smooth TTS reading
    const cleanSpeech = reportData.summary
      .replace(/[\u{1F600}-\u{1F64F}|\u{1F300}-\u{1F5FF}|\u{1F680}-\u{1F6FF}|\u{2600}-\u{26FF}]/gu, '')
      .replace(/[#*]/g, '');

    const utterance = new SpeechSynthesisUtterance(cleanSpeech);
    utterance.rate = playbackSpeed;
    utterance.onend = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };
    utterance.onerror = () => {
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlayingAudio(true);
    setIsPausedAudio(false);
  };

  const handlePauseAudio = () => {
    if (supportsSpeech && window.speechSynthesis && isPlayingAudio) {
      window.speechSynthesis.pause();
      setIsPausedAudio(true);
      setIsPlayingAudio(false);
    }
  };

  const handleStopAudio = () => {
    if (supportsSpeech && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      setIsPausedAudio(false);
    }
  };

  const handleSpeedChange = (newSpeed) => {
    setPlaybackSpeed(newSpeed);
    if (isPlayingAudio) {
      handleStopAudio();
    }
  };

  return (
    <div className={`w-100 max-w-3xl mx-auto my-4 p-4 border rounded-2xl shadow-sm transition-colors duration-200 ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-900'
    }`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="fw-bold mb-0">AI Multi-Modal RAG Assistant</h3>
        <div className="form-check form-switch mb-0">
          <input
            className="form-check-input cursor-pointer"
            type="checkbox"
            role="switch"
            id="compareToggle"
            checked={compareMode}
            onChange={(e) => setCompareMode(e.target.checked)}
          />
          <label className="form-check-label small fw-medium ms-1" htmlFor="compareToggle">
            Dual Comparison Mode
          </label>
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label fw-medium text-secondary">
          Upload PDF Document (Multi-Modal Visual Context):
        </label>
        <input
          type="file"
          accept=".pdf"
          className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
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
          className={`form-control ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
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
            ? 'Mode: Custom prompt -> 5-line focused response'
            : tasks.length === 0 && notes.length === 0
            ? 'Mode: Empty Workspace -> 8-line App Onboarding & Study Guide'
            : 'Mode: Default -> 7-line report (3-line summary of usert.txt + 4-line task guidance)'}
        </small>
      </div>

      <div className="d-flex justify-content-center gap-3 mb-4">
        <button
          type="button"
          className="btn btn-primary rounded-pill px-4 shadow-sm"
          onClick={(e) => handleGenerateReport(e)}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
              Processing RAG & Generating...
            </>
          ) : (
            'Generate AI Report'
          )}
        </button>

        {compareMode && (
          <button
            type="button"
            className="btn btn-outline-primary rounded-pill px-3 shadow-sm d-flex align-items-center gap-1"
            onClick={handleCompareModels}
            disabled={comparing}
          >
            <Scale size={16} />
            {comparing ? 'Comparing Cloud & Local...' : 'Run Parallel Comparison'}
          </button>
        )}

        {onWipeAllData && (
          <button
            type="button"
            className="btn btn-outline-danger rounded-pill px-3 shadow-sm d-flex align-items-center gap-1.5"
            onClick={() => {
              onWipeAllData();
              setReportData(null);
              setPdfFile(null);
              setCustomPrompt('');
              setChatHistory([]);
              setCompareResults(null);
              setFlowchartData(null);
              setQuizData(null);
              setScheduleData(null);
            }}
            title="Clear current workspace documents and analysis results"
          >
            <Trash2 size={16} />
            Clear Resources
          </button>
        )}
      </div>

      {/* Parallel Dual Model Comparison Card */}
      {compareMode && compareResults && (
        <div className={`p-4 rounded-xl border mb-4 shadow-sm ${isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
            <Scale className="text-primary" size={20} />
            <h5 className="mb-0 fw-bold">Cloud vs. Local Model Comparison</h5>
          </div>
          <div className="row g-3">
            {compareResults.map((item, idx) => (
              <div key={idx} className="col-12 col-md-6">
                <div className={`p-3 rounded-xl border h-100 ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-bold fs-6">{item.model}</span>
                    <span className="badge bg-secondary">{item.latency_ms} ms</span>
                  </div>
                  <div className="small" style={{ whiteSpace: 'pre-line', lineHeight: '1.6' }}>
                    {item.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main RAG Report Card */}
      {reportData && (
        <div className={`report-container p-4 rounded-xl border shadow-sm ${isDark ? 'bg-slate-800/90 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-3 pb-2 border-bottom">
            <h5 className="mb-0 fw-bold">
              {reportData.isCustomPrompt
                ? 'Custom AI Answer (5 Lines)'
                : reportData.totalItems === 0 && !reportData.hasPdf
                ? 'App Onboarding & Study Guide (8 Lines)'
                : 'RAG Report & Task Guidance (7 Lines)'}
            </h5>
            <div className="d-flex align-items-center gap-2">
              <span className="badge bg-secondary">Items: {reportData.totalItems}</span>
              {reportData.hasPdf && <span className="badge bg-info text-dark">PDF Attached</span>}

              {/* Audio Companion (Web Speech API) */}
              {supportsSpeech && (
                <div className="d-flex align-items-center gap-1 ms-2 p-1 rounded-pill bg-slate-100 border">
                  {!isPlayingAudio ? (
                    <button
                      type="button"
                      onClick={handlePlayAudio}
                      className="btn btn-sm btn-link text-primary p-1"
                      title="Listen to Report"
                    >
                      <Play size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handlePauseAudio}
                      className="btn btn-sm btn-link text-warning p-1"
                      title="Pause Audio"
                    >
                      <Pause size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="btn btn-sm btn-link text-danger p-1"
                    title="Stop Audio"
                  >
                    <Square size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeedChange(playbackSpeed === 1 ? 1.25 : playbackSpeed === 1.25 ? 1.5 : 1)}
                    className="btn btn-sm btn-link text-dark p-0 px-1 text-decoration-none small fw-bold"
                    title="Change Speed"
                  >
                    {playbackSpeed}x
                  </button>
                </div>
              )}
            </div>
          </div>

          <div
            className={`report-body my-3 p-3 rounded-xl border ${
              isDark ? 'bg-slate-900 border-slate-700 text-slate-100' : 'bg-light border-slate-200 text-slate-900'
            }`}
            style={{ whiteSpace: 'pre-line', lineHeight: '1.7' }}
          >
            {reportData.summary
              .split('\n')
              .filter((line) => line.trim().length > 0)
              .map((line, idx) => (
                <p key={idx} className="mb-2 fw-normal" style={{ wordBreak: 'break-word' }}>
                  {line}
                </p>
              ))}
          </div>

          <div className="mt-3 pt-2 text-end text-muted small border-top">
            Generated at {reportData.generatedAt}
          </div>

          <div className="mt-3 d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm rounded-pill px-3"
              onClick={() => {
                setReportData(null);
                setChatHistory([]);
                setFlowchartData(null);
                setQuizData(null);
                setScheduleData(null);
                handleStopAudio();
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="btn btn-outline-primary btn-sm rounded-pill px-3"
              onClick={(e) => handleGenerateReport(e)}
              disabled={loading}
            >
              Regenerate
            </button>
          </div>
        </div>
      )}

      {/* Quick Link to Dedicated Study Mode */}
      {onOpenStudyMode && (
        <div className={`mt-4 p-3 px-4 rounded-2xl border d-flex justify-content-between align-items-center flex-wrap gap-2 ${
          isDark ? 'bg-indigo-950/40 border-indigo-500/30 text-indigo-200' : 'bg-indigo-50/80 border-indigo-200 text-indigo-950'
        }`}>
          <div className="d-flex align-items-center gap-2">
            <Sparkles size={16} className="text-indigo-400" />
            <span className="small fw-semibold">
              Want to customize study tools by specific uploaded resources and unlock up to 50 active recall cards?
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenStudyMode}
            className="btn btn-sm btn-primary rounded-pill px-3 py-1 fw-semibold shadow-sm"
          >
            Open Study Mode Suite →
          </button>
        </div>
      )}

      {/* Interactive Concept Mind Map & Flowchart */}
      <FlowchartView data={flowchartData} isDark={isDark} />

      {/* PDF Visual Flashcards & Quiz */}
      <QuizFlashcards data={quizData} isDark={isDark} isPaid={isPaid} isAdmin={isAdmin} />

      {/* Interactive Study Schedule & iCal Export */}
      <StudySchedule schedule={scheduleData} icsContent={icsContent} isDark={isDark} />
    </div>
  );
}