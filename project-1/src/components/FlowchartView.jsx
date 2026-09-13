import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Info, GitFork, ArrowDown } from 'lucide-react';

export default function FlowchartView({ data, isDark = false }) {
  const [scale, setScale] = useState(1);
  const [activeNode, setActiveNode] = useState(null);

  if (!data || !data.nodes || data.nodes.length === 0) {
    return null;
  }

  const { nodes, edges } = data;

  const getNodeColor = (type) => {
    switch (type) {
      case 'prerequisite':
        return isDark ? 'border-amber-500 bg-amber-950/40 text-amber-200' : 'border-amber-400 bg-amber-50 text-amber-900';
      case 'core':
        return isDark ? 'border-indigo-500 bg-indigo-950/40 text-indigo-200' : 'border-indigo-400 bg-indigo-50 text-indigo-900';
      case 'advanced':
        return isDark ? 'border-purple-500 bg-purple-950/40 text-purple-200' : 'border-purple-400 bg-purple-50 text-purple-900';
      case 'review':
        return isDark ? 'border-emerald-500 bg-emerald-950/40 text-emerald-200' : 'border-emerald-400 bg-emerald-50 text-emerald-900';
      default:
        return isDark ? 'border-slate-600 bg-slate-800 text-slate-200' : 'border-slate-300 bg-slate-50 text-slate-800';
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'prerequisite':
        return 'bg-warning text-dark';
      case 'core':
        return 'bg-primary text-white';
      case 'advanced':
        return 'bg-secondary text-white';
      case 'review':
        return 'bg-success text-white';
      default:
        return 'bg-light text-dark';
    }
  };

  return (
    <div className={`mt-4 p-4 rounded-2xl border shadow-sm ${isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center gap-2">
          <GitFork className="text-primary" size={22} />
          <h5 className="mb-0 fw-bold">Interactive Concept & Study Flowchart</h5>
        </div>
        <div className="d-flex gap-1 align-items-center">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-lg"
            onClick={() => setScale((s) => Math.max(0.7, s - 0.1))}
            title="Zoom Out"
          >
            <ZoomOut size={16} />
          </button>
          <span className="small px-1">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-lg"
            onClick={() => setScale((s) => Math.min(1.4, s + 0.1))}
            title="Zoom In"
          >
            <ZoomIn size={16} />
          </button>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary p-1 rounded-lg ms-1"
            onClick={() => setScale(1)}
            title="Reset Zoom"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="overflow-auto p-4 border rounded-xl bg-slate-50/50" style={{ maxHeight: '420px' }}>
        <div
          style={{
            transform: `scale(${scale})`,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease-out',
            minWidth: '280px',
          }}
          className="d-flex flex-column align-items-center gap-2"
        >
          {nodes.map((node, i) => (
            <React.Fragment key={node.id}>
              <div
                onClick={() => setActiveNode(node)}
                className={`p-3 rounded-xl border-2 shadow-sm text-center cursor-pointer transition-all hover:scale-105 ${getNodeColor(node.type)}`}
                style={{ width: '100%', maxWidth: '380px', cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <span className={`badge rounded-pill text-uppercase px-2 py-0.5 small ${getBadgeColor(node.type)}`}>
                    {node.type}
                  </span>
                  <Info size={14} className="opacity-75" />
                </div>
                <div className="fw-bold fs-6">{node.label}</div>
                <div className="small opacity-75 mt-1 text-truncate">{node.description}</div>
              </div>

              {i < nodes.length - 1 && (
                <div className="d-flex flex-column align-items-center my-1 text-muted">
                  <span className="small text-xs opacity-75 mb-0.5">
                    {edges[i]?.label || 'leads to'}
                  </span>
                  <ArrowDown size={18} className="text-secondary" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {activeNode && (
        <div className={`mt-3 p-3 rounded-xl border ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-light border-slate-200'}`}>
          <div className="d-flex justify-content-between align-items-center mb-1">
            <span className="fw-bold">{activeNode.label}</span>
            <button
              type="button"
              className="btn btn-sm btn-link text-muted p-0 text-decoration-none"
              onClick={() => setActiveNode(null)}
            >
              Close
            </button>
          </div>
          <p className="small mb-0 text-secondary">{activeNode.description}</p>
        </div>
      )}
    </div>
  );
}
