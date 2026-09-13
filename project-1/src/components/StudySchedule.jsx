import React from 'react';
import { Calendar, Download, Clock, BookOpen } from 'lucide-react';

export default function StudySchedule({ schedule = [], icsContent = '', isDark = false }) {
  if (!schedule || schedule.length === 0) {
    return null;
  }

  const handleDownloadCalendar = () => {
    if (!icsContent) return;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'ai_study_schedule.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`mt-4 p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <Calendar className="text-primary" size={22} />
          <h5 className="mb-0 fw-bold">Optimized Study Schedule</h5>
        </div>
        <button
          type="button"
          onClick={handleDownloadCalendar}
          disabled={!icsContent}
          className="btn btn-sm btn-outline-primary rounded-pill px-3 d-flex align-items-center gap-1 shadow-sm"
          title="Export schedule to Google Calendar, Apple Calendar, or Outlook"
        >
          <Download size={14} />
          Export to Calendar (.ics)
        </button>
      </div>

      <div className="d-flex flex-column gap-2">
        {schedule.map((session, idx) => (
          <div
            key={session.id || idx}
            className={`p-3 rounded-xl border d-flex justify-content-between align-items-center flex-wrap gap-2 ${
              isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="d-flex align-items-center gap-3">
              <span className="badge bg-primary rounded-pill p-2">
                <Clock size={16} />
              </span>
              <div>
                <div className="fw-bold fs-6">{session.title}</div>
                <div className="small text-muted">{session.description}</div>
              </div>
            </div>
            <div className="text-end">
              <span className="badge bg-secondary me-2">{session.timeSlot}</span>
              <span className="badge bg-info text-dark">{session.durationMinutes} min</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
