import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HelpCircle,
  Layers,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Award,
  SlidersHorizontal,
  TrendingUp,
  LineChart,
  Sparkles,
} from 'lucide-react';
import { Chart } from 'chart.js/auto';

export default function QuizFlashcards({ data, isDark = false, isPaid = false, isAdmin = false }) {
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'mcqs'
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // User Customizable Display Limit: Default is 5
  const [displayLimit, setDisplayLimit] = useState(5);

  // MCQ state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [showGraph, setShowGraph] = useState(true);

  // Chart ref & instance
  const chartCanvasRef = useRef(null);
  const chartInstanceRef = useRef(null);

  if (!data || (!data.flashcards && !data.mcqs)) {
    return null;
  }

  const isPro = Boolean(isAdmin || isPaid || data.is_paid || !data.is_capped && isPaid);
  const hardCap = isPro ? 50 : 10;

  const rawFlashcards = data.flashcards || [];
  const rawMcqs = data.mcqs || [];

  // Constrain effective limit between 1 and hardCap (10 for free users, 50 for pro)
  const effectiveLimit = Math.min(hardCap, Math.max(1, Number(displayLimit) || 5));

  // Sliced flashcards and quiz questions based on customized limit
  const visibleFlashcards = useMemo(() => {
    return rawFlashcards.slice(0, effectiveLimit);
  }, [rawFlashcards, effectiveLimit]);

  const visibleMcqs = useMemo(() => {
    return rawMcqs.slice(0, effectiveLimit);
  }, [rawMcqs, effectiveLimit]);

  const safeCardIndex = cardIndex >= visibleFlashcards.length ? 0 : cardIndex;

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % visibleFlashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + visibleFlashcards.length) % visibleFlashcards.length);
  };

  const handleSelectOption = (qId, optionIdx) => {
    if (showResults) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qId]: optionIdx,
    }));
  };

  const calculateScore = () => {
    let score = 0;
    visibleMcqs.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  const calculateIncorrect = () => {
    let wrong = 0;
    visibleMcqs.forEach((q) => {
      if (selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctIndex) {
        wrong += 1;
      }
    });
    return wrong;
  };

  const handleLimitChange = (val) => {
    const num = Math.min(hardCap, Math.max(1, Number(val) || 1));
    setDisplayLimit(num);
    setCardIndex(0);
    setIsFlipped(false);
  };

  // Build progressive data for Chart.js
  const chartDataPoints = useMemo(() => {
    const labels = visibleMcqs.map((_, idx) => `Q${idx + 1}`);
    let cumulativeMarks = 0;
    let cumulativeIncorrect = 0;
    const marks = [];
    const accuracy = [];
    const incorrect = [];

    visibleMcqs.forEach((q) => {
      const isAnswered = selectedAnswers[q.id] !== undefined;
      const isCorrect = isAnswered && selectedAnswers[q.id] === q.correctIndex;
      const isWrong = isAnswered && !isCorrect;

      if (isCorrect) cumulativeMarks += 1;
      if (isWrong) cumulativeIncorrect += 1;

      marks.push(cumulativeMarks);
      incorrect.push(cumulativeIncorrect);

      const totalAttempted = cumulativeMarks + cumulativeIncorrect;
      const acc = totalAttempted > 0 ? Math.round((cumulativeMarks / totalAttempted) * 100) : 0;
      accuracy.push(acc);
    });

    return { labels, marks, accuracy, incorrect, cumulativeMarks, cumulativeIncorrect };
  }, [visibleMcqs, selectedAnswers]);

  // Render & update Chart.js 3-line plot
  useEffect(() => {
    if (activeTab !== 'mcqs' || !chartCanvasRef.current) {
      return;
    }

    // Destroy existing chart instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const ctx = chartCanvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: chartDataPoints.labels,
        datasets: [
          {
            label: 'Accuracy (%)',
            data: chartDataPoints.accuracy,
            borderColor: '#3b82f6', // Blue as requested
            backgroundColor: 'rgba(59, 130, 246, 0.12)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            yAxisID: 'yAccuracy',
            pointBackgroundColor: '#3b82f6',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Marks Scored (Correct)',
            data: chartDataPoints.marks,
            borderColor: '#10b981', // Green as requested (1 mark per question)
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            yAxisID: 'yCount',
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
          {
            label: 'Incorrect Answers',
            data: chartDataPoints.incorrect,
            borderColor: '#ef4444', // Red as requested
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            borderWidth: 2.5,
            tension: 0.35,
            fill: true,
            yAxisID: 'yCount',
            pointBackgroundColor: '#ef4444',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: isDark ? '#e2e8f0' : '#1e293b',
              font: { weight: 'bold', size: 12 },
              usePointStyle: true,
              padding: 14,
            },
          },
          title: {
            display: true,
            text: 'Quiz Performance: Accuracy (Blue), Marks (Green), Incorrect (Red)',
            color: isDark ? '#f1f5f9' : '#0f172a',
            font: { size: 13, weight: 'bold' },
            padding: { top: 4, bottom: 10 },
          },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            titleColor: isDark ? '#f8fafc' : '#0f172a',
            bodyColor: isDark ? '#e2e8f0' : '#334155',
            borderColor: isDark ? '#334155' : '#cbd5e1',
            borderWidth: 1,
            padding: 10,
            callbacks: {
              label: function (context) {
                if (context.dataset.yAxisID === 'yAccuracy') {
                  return ` ${context.dataset.label}: ${context.raw}%`;
                }
                return ` ${context.dataset.label}: ${context.raw} / ${context.dataIndex + 1}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            },
            ticks: {
              color: isDark ? '#94a3b8' : '#64748b',
              font: { size: 11 },
            },
          },
          yCount: {
            type: 'linear',
            display: true,
            position: 'left',
            title: {
              display: true,
              text: 'Marks / Mistakes (1 mark per Q)',
              color: isDark ? '#94a3b8' : '#64748b',
              font: { size: 11, weight: 'bold' },
            },
            min: 0,
            suggestedMax: Math.max(3, visibleMcqs.length),
            ticks: {
              stepSize: 1,
              color: isDark ? '#94a3b8' : '#64748b',
            },
            grid: {
              color: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)',
            },
          },
          yAccuracy: {
            type: 'linear',
            display: true,
            position: 'right',
            title: {
              display: true,
              text: 'Accuracy (%)',
              color: '#3b82f6',
              font: { size: 11, weight: 'bold' },
            },
            min: 0,
            max: 100,
            ticks: {
              callback: (value) => `${value}%`,
              color: '#3b82f6',
            },
            grid: {
              drawOnChartArea: false, // Prevents clash with left gridlines
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [activeTab, chartDataPoints, isDark, visibleMcqs.length]);

  // Simulation test action for immediate visual demonstration
  const handleRandomizeSimulation = () => {
    const simulatedAnswers = {};
    visibleMcqs.forEach((q) => {
      // 70% chance of picking correct answer for realistic graph
      const pickCorrect = Math.random() > 0.3;
      if (pickCorrect) {
        simulatedAnswers[q.id] = q.correctIndex;
      } else {
        const wrongIndices = q.options
          .map((_, i) => i)
          .filter((i) => i !== q.correctIndex);
        simulatedAnswers[q.id] = wrongIndices[Math.floor(Math.random() * wrongIndices.length)] ?? 0;
      }
    });
    setSelectedAnswers(simulatedAnswers);
    setShowResults(true);
    setShowGraph(true);
  };

  const currentScore = calculateScore();
  const currentIncorrect = calculateIncorrect();
  const currentAttempted = Object.keys(selectedAnswers).filter((id) =>
    visibleMcqs.some((q) => q.id === id)
  ).length;
  const currentAccuracy = currentAttempted > 0 ? Math.round((currentScore / currentAttempted) * 100) : 0;

  return (
    <div className={`mt-4 p-4 rounded-2xl border shadow-sm ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header with Switcher and Limits */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <HelpCircle className="text-primary" size={22} />
          <h5 className="mb-0 fw-bold">Active Recall Quiz & Flashcards</h5>
        </div>

        <div className="btn-group btn-group-sm">
          <button
            type="button"
            className={`btn ${activeTab === 'flashcards' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('flashcards')}
          >
            <Layers size={14} className="me-1" />
            Flashcards ({visibleFlashcards.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'mcqs' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('mcqs')}
          >
            <Award size={14} className="me-1" />
            Quiz ({visibleMcqs.length})
          </button>
        </div>
      </div>

      {/* User Customizable Limit Bar (Default: 5, Freemium: 10, Pro: 50) */}
      <div className={`p-2.5 rounded-xl border mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2 ${
        isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="d-flex align-items-center gap-2 flex-wrap">
          <SlidersHorizontal size={14} className="text-primary" />
          <span className="small fw-semibold">
            Study Cap: <span className="text-primary">{effectiveLimit}</span> / {hardCap} Active Items
          </span>
          <span className={`badge rounded-pill small px-2.5 py-0.5 ${
            isPro
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
              : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30'
          }`}>
            {isPro ? '★ PRO UNLIMITED' : 'FREEMIUM (10 CAP)'}
          </span>
          <span className="badge bg-secondary-subtle text-secondary small rounded-pill">
            Pool: {rawFlashcards.length} cards • {rawMcqs.length} Qs
          </span>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span className="small text-muted d-none d-sm-inline">Presets:</span>
          <div className="btn-group btn-group-sm">
            {(isPro ? [5, 10, 15, 25, 50] : [5, 10]).map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleLimitChange(num)}
                className={`btn btn-sm ${
                  effectiveLimit === num
                    ? 'btn-primary text-white fw-bold shadow-sm'
                    : isDark
                    ? 'btn-dark border-slate-700 text-slate-300 hover:bg-slate-700'
                    : 'btn-light border text-slate-700 hover:bg-slate-200'
                }`}
              >
                {num} {num === 5 ? '(Default)' : num === 10 && !isPro ? '(Cap)' : ''}
              </button>
            ))}
          </div>

          <div className="d-flex align-items-center gap-1 ms-1">
            <input
              type="number"
              min={1}
              max={hardCap}
              value={effectiveLimit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className={`form-control form-control-sm text-center fw-semibold ${
                isDark ? 'bg-slate-900 text-slate-100 border-slate-700' : 'bg-white'
              }`}
              style={{ width: '60px' }}
              title={`Enter custom count (1-${hardCap})`}
            />
            <span className="small text-muted">/{hardCap}</span>
          </div>
        </div>
      </div>

      {/* FLASHCARDS VIEW */}
      {activeTab === 'flashcards' && visibleFlashcards.length > 0 && (
        <div className="d-flex flex-column align-items-center py-2">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className={`p-4 rounded-2xl border-2 shadow-sm text-center cursor-pointer transition-all duration-300 w-100 max-w-lg d-flex flex-column justify-content-center align-items-center ${
              isFlipped
                ? isDark ? 'bg-indigo-950/60 border-indigo-500' : 'bg-indigo-50/80 border-indigo-400'
                : isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'
            }`}
            style={{ minHeight: '220px', cursor: 'pointer' }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-secondary">
                Card {safeCardIndex + 1} of {visibleFlashcards.length}
              </span>
              <span className={`badge ${isFlipped ? 'bg-success' : 'bg-primary'}`}>
                {isFlipped ? 'Answer' : 'Question (Click to flip)'}
              </span>
            </div>
            <div className="fs-5 fw-semibold px-2">
              {isFlipped ? visibleFlashcards[safeCardIndex]?.answer : visibleFlashcards[safeCardIndex]?.question}
            </div>
            <div className="small text-muted mt-3">
              {isFlipped ? 'Tap to view question' : 'Tap to reveal answer'}
            </div>
          </div>

          <div className="d-flex align-items-center gap-3 mt-3">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={handlePrevCard}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-primary rounded-pill px-3"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <RotateCcw size={14} className="me-1" /> Flip
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary rounded-pill px-3"
              onClick={handleNextCard}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MCQS / QUIZ VIEW WITH CHART.JS 3-LINE PLOT */}
      {activeTab === 'mcqs' && visibleMcqs.length > 0 && (
        <div className="d-flex flex-column gap-3 py-2">
          {/* CHART.JS 3-LINE PROGRESSION PLOT */}
          <div className={`p-3 rounded-2xl border shadow-sm ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
              <div className="d-flex align-items-center gap-2">
                <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-500">
                  <LineChart size={18} />
                </div>
                <div>
                  <h6 className="fw-bold mb-0 small">Performance Analytics (Chart.js 3-Line Plot)</h6>
                  <span className="small text-muted" style={{ fontSize: '0.72rem' }}>
                    1 Mark per question • Accuracy in Blue, Marks in Green, Incorrect in Red
                  </span>
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                {/* Metric Badges */}
                <span className="badge bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 rounded-pill small px-2.5 py-1">
                  Marks: {currentScore} / {visibleMcqs.length}
                </span>
                <span className="badge bg-blue-500/15 text-blue-600 border border-blue-500/30 rounded-pill small px-2.5 py-1">
                  Accuracy: {currentAccuracy}%
                </span>
                <span className="badge bg-rose-500/15 text-rose-600 border border-rose-500/30 rounded-pill small px-2.5 py-1">
                  Incorrect: {currentIncorrect}
                </span>

                <button
                  type="button"
                  onClick={handleRandomizeSimulation}
                  className="btn btn-sm btn-outline-primary rounded-pill px-2.5 py-1 small d-flex align-items-center gap-1"
                  title="Generate a sample test simulation on the graph"
                >
                  <Sparkles size={13} />
                  <span>Simulate Test</span>
                </button>
              </div>
            </div>

            {/* Canvas Container */}
            <div style={{ position: 'relative', height: '260px', width: '100%' }}>
              <canvas ref={chartCanvasRef} />
            </div>
          </div>

          {/* QUESTIONS LIST */}
          {visibleMcqs.map((q, qIndex) => (
            <div key={q.id} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="fw-bold mb-2">
                Q{qIndex + 1} of {visibleMcqs.length}. {q.question} <span className="small text-muted fw-normal">(1 Mark)</span>
              </div>
              <div className="d-flex flex-column gap-2">
                {q.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[q.id] === optIdx;
                  const isCorrect = q.correctIndex === optIdx;
                  let btnClass = isDark ? 'btn-outline-secondary' : 'btn-outline-dark';

                  if (showResults) {
                    if (isCorrect) {
                      btnClass = 'btn-success text-white';
                    } else if (isSelected && !isCorrect) {
                      btnClass = 'btn-danger text-white';
                    }
                  } else if (isSelected) {
                    btnClass = 'btn-primary text-white';
                  }

                  return (
                    <button
                      key={optIdx}
                      type="button"
                      disabled={showResults}
                      onClick={() => handleSelectOption(q.id, optIdx)}
                      className={`btn btn-sm text-start py-2 px-3 rounded-lg d-flex justify-content-between align-items-center ${btnClass}`}
                    >
                      <span>{opt}</span>
                      {showResults && isCorrect && <CheckCircle2 size={16} className="text-white" />}
                      {showResults && isSelected && !isCorrect && <XCircle size={16} className="text-white" />}
                    </button>
                  );
                })}
              </div>

              {showResults && q.explanation && (
                <div className={`mt-2 small p-2 rounded border ${
                  isDark ? 'bg-slate-900/80 text-slate-300 border-slate-700' : 'bg-light text-muted border-slate-200'
                }`}>
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          {/* FOOTER ACTIONS & SCORING */}
          <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top flex-wrap gap-2">
            <div>
              {showResults ? (
                <span className="fw-bold fs-6 text-primary">
                  Final Score: {currentScore} / {visibleMcqs.length} Marks • Accuracy: {currentAccuracy}% • Incorrect: {currentIncorrect}
                </span>
              ) : (
                <span className="small text-muted">
                  Answered: {currentAttempted} / {visibleMcqs.length} questions
                </span>
              )}
            </div>
            <div className="d-flex gap-2">
              {showResults ? (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary rounded-pill px-3"
                  onClick={() => {
                    setSelectedAnswers({});
                    setShowResults(false);
                  }}
                >
                  <RotateCcw size={14} className="me-1" /> Retake Quiz
                </button>
              ) : (
                <button
                  type="button"
                  disabled={currentAttempted === 0}
                  className="btn btn-sm btn-primary rounded-pill px-4"
                  onClick={() => {
                    setShowResults(true);
                    setShowGraph(true);
                  }}
                >
                  Submit & Plot Score Graph
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
