import React from 'react';
import { Brain } from 'lucide-react';

export default function Header({ title = "StudyAI Platform", isDark = false }) {
  return (
    <div className="d-flex align-items-center gap-2.5 cursor-pointer user-select-none">
      <div
        className="rounded-xl text-white p-2 d-flex align-items-center justify-content-center shadow-sm"
        style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
      >
        <Brain size={20} />
      </div>
      <div className="d-flex flex-column text-start">
        <span className={`fw-bold fs-5 tracking-tight lh-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </span>
        <span className="text-muted lh-1 mt-1 d-none d-sm-inline" style={{ fontSize: '0.75rem' }}>
          Multi-Modal Study & Research Engine
        </span>
      </div>
    </div>
  );
}