import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Sparkles, FileText } from 'lucide-react';

export default function ChatDrawer({ isDark = false, accessCode = '' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Document & Study Tutor. Ask me any follow-up questions about your uploaded documents or study tasks!',
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasDoc, setHasDoc] = useState(false);
  const [docName, setDocName] = useState('');

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanMsg = inputMessage.trim();
    if (!cleanMsg || loading) return;

    const userEntry = { role: 'user', text: cleanMsg };
    setMessages((prev) => [...prev, userEntry]);
    setInputMessage('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('message', cleanMsg);
      formData.append('chat_history', JSON.stringify(messages.map((m) => ({ role: m.role, content: m.text }))));

      const headers = {};
      if (accessCode) {
        headers['x-access-code'] = accessCode;
      }

      const res = await fetch('/api/document-chat', {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }

      const data = await res.json();
      setHasDoc(data.has_document);
      if (data.doc_name) setDocName(data.doc_name);

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: data.reply || 'No response returned.' },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: 'Error connecting to Document Chat service. Ensure the backend server is running.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating trigger button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="btn btn-primary rounded-circle shadow-lg d-flex align-items-center justify-content-center position-fixed"
          style={{
            bottom: '24px',
            right: '24px',
            width: '56px',
            height: '56px',
            zIndex: 1050,
            transition: 'transform 0.2s',
          }}
          title="Open Document Chat Tutor"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          className={`position-fixed shadow-2xl rounded-2xl border d-flex flex-column ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
          style={{
            bottom: '24px',
            right: '24px',
            width: '380px',
            maxWidth: 'calc(100vw - 48px)',
            height: '540px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 1050,
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white rounded-top-2xl">
            <div className="d-flex align-items-center gap-2">
              <Sparkles size={18} />
              <div>
                <div className="fw-bold fs-6">Document Chat Tutor</div>
                <div className="small text-xs opacity-75">
                  {hasDoc ? `Synced with ${docName}` : 'Grounded in Workspace Context'}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-link text-white p-0"
              onClick={() => setIsOpen(false)}
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages body */}
          <div className="flex-grow-1 p-3 overflow-auto d-flex flex-column gap-3" style={{ fontSize: '0.9rem' }}>
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`d-flex gap-2 ${m.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
              >
                {m.role === 'assistant' && (
                  <div className="rounded-circle bg-primary text-white p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                    <Bot size={16} />
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-bottom-right-none'
                      : isDark ? 'bg-slate-800 text-slate-100 rounded-bottom-left-none border border-slate-700' : 'bg-slate-100 text-slate-800 rounded-bottom-left-none'
                  }`}
                  style={{ maxWidth: '82%', whiteSpace: 'pre-line', lineHeight: '1.5' }}
                >
                  {m.text}
                </div>
                {m.role === 'user' && (
                  <div className="rounded-circle bg-secondary text-white p-1 d-flex align-items-center justify-content-center" style={{ width: '28px', height: '28px', flexShrink: 0 }}>
                    <User size={16} />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="d-flex gap-2 align-items-center text-muted small">
                <div className="spinner-border spinner-border-sm text-primary" role="status" />
                <span>AI Tutor is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-top d-flex gap-2 align-items-center">
            <input
              type="text"
              className={`form-control form-control-sm rounded-pill px-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              placeholder="Ask about document, formula, or tasks..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center p-2"
              style={{ width: '36px', height: '36px', flexShrink: 0 }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
