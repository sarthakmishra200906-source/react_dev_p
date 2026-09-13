import React, { useState } from 'react';
import { HelpCircle, Layers, CheckCircle2, XCircle, RotateCcw, ChevronLeft, ChevronRight, Award } from 'lucide-react';

export default function QuizFlashcards({ data, isDark = false }) {
  const [activeTab, setActiveTab] = useState('flashcards'); // 'flashcards' | 'mcqs'
  const [cardIndex, setCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  // MCQ state
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);

  if (!data || (!data.flashcards && !data.mcqs)) {
    return null;
  }

  const flashcards = data.flashcards || [];
  const mcqs = data.mcqs || [];

  const handleNextCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevCard = () => {
    setIsFlipped(false);
    setCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
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
    mcqs.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctIndex) {
        score += 1;
      }
    });
    return score;
  };

  return (
    <div className={`mt-4 p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
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
            Flashcards ({flashcards.length})
          </button>
          <button
            type="button"
            className={`btn ${activeTab === 'mcqs' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setActiveTab('mcqs')}
          >
            <Award size={14} className="me-1" />
            Quiz ({mcqs.length})
          </button>
        </div>
      </div>

      {activeTab === 'flashcards' && flashcards.length > 0 && (
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
            <span className="badge bg-secondary mb-2">
              Card {cardIndex + 1} of {flashcards.length} • {isFlipped ? 'Answer' : 'Question (Click to flip)'}
            </span>
            <div className="fs-5 fw-semibold px-2">
              {isFlipped ? flashcards[cardIndex]?.answer : flashcards[cardIndex]?.question}
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

      {activeTab === 'mcqs' && mcqs.length > 0 && (
        <div className="d-flex flex-column gap-3 py-2">
          {mcqs.map((q, qIndex) => (
            <div key={q.id} className={`p-3 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="fw-bold mb-2">
                Q{qIndex + 1}. {q.question}
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
                <div className="mt-2 small text-muted p-2 rounded bg-light border">
                  <strong>Explanation:</strong> {q.explanation}
                </div>
              )}
            </div>
          ))}

          <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top">
            <div>
              {showResults ? (
                <span className="fw-bold fs-6 text-primary">
                  Your Score: {calculateScore()} / {mcqs.length} ({Math.round((calculateScore() / mcqs.length) * 100)}%)
                </span>
              ) : (
                <span className="small text-muted">
                  Answered: {Object.keys(selectedAnswers).length} / {mcqs.length}
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
                  disabled={Object.keys(selectedAnswers).length === 0}
                  className="btn btn-sm btn-primary rounded-pill px-4"
                  onClick={() => setShowResults(true)}
                >
                  Submit & Check Answers
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
