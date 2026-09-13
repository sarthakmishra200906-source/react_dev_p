import React, { useState } from 'react';
import { Folder, Upload, Link2, FileText, Trash2, Search, Plus, ExternalLink, CheckCircle } from 'lucide-react';

export default function ResourceHub({
  resources = [],
  onAddResource,
  onDeleteResource,
  isDark = false,
  accessCode = '',
  isGuest = false,
  onRequireAuth,
}) {
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'link' | 'text'
  const [title, setTitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [textContent, setTextContent] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');

  const handleUploadSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (isGuest) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (resources.length >= 50) {
      alert('Resource limit reached (maximum 50 resources). Please delete an item before adding more.');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('resource_type', activeTab);

    if (activeTab === 'pdf' && selectedFile) {
      formData.append('file', selectedFile);
    } else if (activeTab === 'link') {
      formData.append('url', linkUrl);
      formData.append('content', textContent);
    } else {
      formData.append('content', textContent);
    }

    try {
      const headers = {};
      if (accessCode) headers['x-access-code'] = accessCode;

      const res = await fetch('/api/resources/upload', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Upload failed with status ${res.status}`);
      }

      const data = await res.json();
      if (onAddResource && data.resource) {
        onAddResource(data.resource);
      }

      // Reset form
      setTitle('');
      setLinkUrl('');
      setTextContent('');
      setSelectedFile(null);
    } catch (err) {
      console.error('Resource upload error:', err);
      alert('Failed to upload resource: ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  const filteredResources = resources.filter((r) => {
    const q = filterQuery.toLowerCase();
    return (
      (r.title && r.title.toLowerCase().includes(q)) ||
      (r.type && r.type.toLowerCase().includes(q)) ||
      (r.preview && r.preview.toLowerCase().includes(q))
    );
  });

  return (
    <div className={`p-4 rounded-2xl border shadow-sm transition-colors ${
      isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-2">
        <div className="d-flex align-items-center gap-2">
          <div className="rounded-circle bg-primary text-white p-2 d-flex align-items-center justify-content-center">
            <Folder size={22} />
          </div>
          <div>
            <h4 className="fw-bold mb-0">Multi-Resource Library & Research Hub</h4>
            <p className="small text-muted mb-0">
              Upload up to 50 study materials (PDFs, handwritten notes, URLs, and texts) to ground your AI assistant.
            </p>
          </div>
        </div>
        <span className={`badge px-3 py-2 rounded-pill fs-6 ${
          resources.length >= 45 ? 'bg-warning text-dark' : 'bg-primary text-white'
        }`}>
          {resources.length} / 50 Resources
        </span>
      </div>

      {/* Upload Form Box */}
      <div className={`p-3 rounded-xl border mb-4 ${isDark ? 'bg-slate-800/70 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="fw-bold mb-0">Add New Study Material</h6>
          <div className="btn-group btn-group-sm">
            <button
              type="button"
              className={`btn ${activeTab === 'pdf' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('pdf')}
            >
              <Upload size={14} className="me-1" /> PDF / Document
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'link' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('link')}
            >
              <Link2 size={14} className="me-1" /> Web Link / Video
            </button>
            <button
              type="button"
              className={`btn ${activeTab === 'text' ? 'btn-primary' : 'btn-outline-secondary'}`}
              onClick={() => setActiveTab('text')}
            >
              <FileText size={14} className="me-1" /> Text Snippet
            </button>
          </div>
        </div>

        <form onSubmit={handleUploadSubmit} className="row g-3">
          <div className="col-12 col-md-6">
            <label className="form-label small fw-medium">Resource Title / Topic Name:</label>
            <input
              type="text"
              className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
              placeholder="e.g. DBMS Module 1 Lecture Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {activeTab === 'pdf' && (
            <div className="col-12 col-md-6">
              <label className="form-label small fw-medium">Select PDF / File:</label>
              <input
                type="file"
                accept=".pdf,.txt,.doc,.docx"
                className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                required
              />
            </div>
          )}

          {activeTab === 'link' && (
            <div className="col-12 col-md-6">
              <label className="form-label small fw-medium">Research Link URL:</label>
              <input
                type="url"
                className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
                placeholder="https://..."
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                required
              />
            </div>
          )}

          {(activeTab === 'text' || activeTab === 'link') && (
            <div className="col-12">
              <label className="form-label small fw-medium">
                {activeTab === 'link' ? 'Key Takeaways / Highlights from Link (Optional):' : 'Notes / Content Snippet:'}
              </label>
              <textarea
                rows={2}
                className={`form-control form-control-sm ${isDark ? 'bg-slate-900 border-slate-700 text-white' : ''}`}
                placeholder="Paste key notes, formulas, or excerpts..."
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                required={activeTab === 'text'}
              />
            </div>
          )}

          <div className="col-12 text-end">
            <button
              type="submit"
              disabled={uploading || resources.length >= 50}
              className="btn btn-primary btn-sm rounded-pill px-4 shadow-sm"
            >
              {uploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" />
                  Processing & Indexing...
                </>
              ) : (
                <>
                  <Plus size={16} className="me-1" /> Add to Library
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Search and List */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h6 className="fw-bold mb-0">Attached Library ({filteredResources.length})</h6>
        <div className="input-group input-group-sm" style={{ maxWidth: '240px' }}>
          <span className="input-group-text bg-transparent border-end-0">
            <Search size={14} />
          </span>
          <input
            type="text"
            className={`form-control border-start-0 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
            placeholder="Filter library..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredResources.length === 0 ? (
        <div className="text-center py-5 border rounded-xl text-muted">
          <Folder size={36} className="mx-auto mb-2 opacity-50" />
          <p className="mb-0">No resources stored yet. Upload your first PDF, text snippet, or web link above.</p>
        </div>
      ) : (
        <div className="row g-3" style={{ maxHeight: '480px', overflowY: 'auto' }}>
          {filteredResources.map((res) => (
            <div key={res.id} className="col-12 col-md-6">
              <div className={`p-3 rounded-xl border h-100 d-flex flex-column justify-content-between transition-all ${
                isDark ? 'bg-slate-800/80 border-slate-700' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <span className={`badge rounded-pill text-uppercase px-2 py-0.5 small ${
                      res.type === 'pdf' ? 'bg-danger text-white' : res.type === 'link' ? 'bg-info text-dark' : 'bg-secondary text-white'
                    }`}>
                      {res.type}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDeleteResource && onDeleteResource(res.id)}
                      className="btn btn-sm btn-link text-danger p-0"
                      title="Delete Resource"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="fw-bold fs-6 text-truncate mb-1">{res.title}</div>
                  {res.url && (
                    <a href={res.url} target="_blank" rel="noreferrer" className="small text-primary d-flex align-items-center gap-1 mb-2 text-decoration-none">
                      <ExternalLink size={12} /> {res.url}
                    </a>
                  )}
                  <p className="small text-muted mb-0" style={{ maxHeight: '60px', overflow: 'hidden' }}>
                    {res.preview || 'Indexed text context active.'}
                  </p>
                </div>
                <div className="small text-muted border-top pt-2 mt-2 text-end" style={{ fontSize: '0.75rem' }}>
                  Added {res.created_at}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
