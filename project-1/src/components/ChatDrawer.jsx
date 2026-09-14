import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Bot,
  User,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Microscope,
  Folder,
  CheckSquare,
  StickyNote,
  LayoutDashboard,
  Compass,
} from 'lucide-react';

const MODE_MAP = {
  rag: { label: 'AI RAG Studio', icon: <LayoutDashboard size={13} /> },
  study: { label: 'Study Mode', icon: <GraduationCap size={13} /> },
  research: { label: 'Gemini Deep Research', icon: <Microscope size={13} /> },
  resources: { label: 'Sources Hub', icon: <Folder size={13} /> },
  tasks: { label: 'Task Manager', icon: <CheckSquare size={13} /> },
  notes: { label: 'Important Notes', icon: <StickyNote size={13} /> },
};

export default function ChatDrawer({
  isDark = false,
  accessCode = '',
  onNavigateTab,
  activeTab = 'rag',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hello! I am your AI Study & Workspace Guide.\n\nAsk me any academic question, or ask how to use and navigate this platform (e.g. "How many modes are there?", "Take me to Study Mode", "How to research PDFs?").',
      navTarget: null,
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

  const parseNavigationFromText = (rawText) => {
    let cleanText = rawText;
    let targetTab = null;

    const navMatch = rawText.match(/\[NAVIGATE:\s*([a-zA-Z0-9_]+)\]/);
    if (navMatch) {
      targetTab = navMatch[1].toLowerCase();
      cleanText = rawText.replace(navMatch[0], '').trim();
    } else {
      const low = rawText.toLowerCase();
      if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && low.includes('study')) {
        targetTab = 'study';
      } else if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && (low.includes('research') || low.includes('deep'))) {
        targetTab = 'research';
      } else if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && (low.includes('source') || low.includes('resource') || low.includes('upload'))) {
        targetTab = 'resources';
      } else if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && (low.includes('task') || low.includes('todo') || low.includes('sprint'))) {
        targetTab = 'tasks';
      } else if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && (low.includes('note') || low.includes('obsidian'))) {
        targetTab = 'notes';
      } else if ((low.includes('take me to') || low.includes('open ') || low.includes('go to ')) && (low.includes('rag') || low.includes('studio'))) {
        targetTab = 'rag';
      }
    }

    return { cleanText, targetTab };
  };

  const handleSendMessage = async (e, directQuery = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const cleanMsg = typeof directQuery === 'string' ? directQuery.trim() : inputMessage.trim();
    if (!cleanMsg || loading) return;

    const userEntry = { role: 'user', text: cleanMsg };
    setMessages((prev) => [...prev, userEntry]);
    if (!directQuery) setInputMessage('');
    setLoading(true);

    // Fast client-side intent intercept for direct navigation commands
    const lowMsg = cleanMsg.toLowerCase();
    if (lowMsg.includes('take me to') || lowMsg.startsWith('go to') || lowMsg.startsWith('open')) {
      let targetTab = null;
      let label = '';
      if (lowMsg.includes('study') || lowMsg.includes('flowchart') || lowMsg.includes('flashcard')) {
        targetTab = 'study';
        label = 'Study Mode';
      } else if (lowMsg.includes('research') || lowMsg.includes('deep')) {
        targetTab = 'research';
        label = 'Gemini Deep Research';
      } else if (lowMsg.includes('source') || lowMsg.includes('resource') || lowMsg.includes('upload') || lowMsg.includes('hub')) {
        targetTab = 'resources';
        label = 'Sources Hub';
      } else if (lowMsg.includes('task') || lowMsg.includes('todo') || lowMsg.includes('sprint')) {
        targetTab = 'tasks';
        label = 'Task Manager';
      } else if (lowMsg.includes('note') || lowMsg.includes('obsidian')) {
        targetTab = 'notes';
        label = 'Important Notes';
      } else if (lowMsg.includes('rag') || lowMsg.includes('studio') || lowMsg.includes('dual')) {
        targetTab = 'rag';
        label = 'AI RAG Studio';
      }

      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `Taking you to **${label}** right now! You can explore all its tools and features on your screen.`,
            navTarget: targetTab,
          },
        ]);
        setLoading(false);
        return;
      }
    }

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

      const { cleanText, targetTab } = parseNavigationFromText(data.reply || '');
      if (targetTab && onNavigateTab) {
        onNavigateTab(targetTab);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: cleanText || 'No response returned.',
          navTarget: targetTab,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'There are 6 workspace modes in StudyAI: AI RAG Studio, Study Mode, Gemini Research, Sources Hub, Task Manager, and Important Notes. Use the navigation buttons below to jump to any section.',
          navTarget: 'study',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'How many modes are there?', query: 'How many modes are there and what do they do?' },
    { label: 'Take me to Study Mode', query: 'Take me to Study Mode' },
    { label: 'Take me to Deep Research', query: 'Take me to Deep Research' },
    { label: 'How to upload PDFs?', query: 'How do I upload resources to ground my AI?' },
  ];

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
          title="Open AI Workspace & Document Tutor"
        >
          <MessageSquare size={26} />
        </button>
      )}

      {/* Slide-over Drawer */}
      {isOpen && (
        <div
          className={`position-fixed shadow-2xl rounded-3xl border d-flex flex-column ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
          style={{
            bottom: '24px',
            right: '24px',
            width: '400px',
            maxWidth: 'calc(100vw - 32px)',
            height: '580px',
            maxHeight: 'calc(100vh - 48px)',
            zIndex: 1050,
            boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
          }}
        >
          {/* Header */}
          <div className="p-3 border-bottom d-flex justify-content-between align-items-center bg-primary text-white rounded-top-3xl">
            <div className="d-flex align-items-center gap-2">
              <div className="rounded-circle p-1.5 bg-white/20 d-flex align-items-center justify-content-center">
                <Compass size={18} />
              </div>
              <div>
                <div className="fw-bold fs-6">AI Study & Workspace Guide</div>
                <div className="small text-xs opacity-85">
                  {hasDoc ? `Synced with ${docName}` : 'Website Navigation & Concept Tutor'}
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

          {/* Quick Help Chips */}
          <div className="p-2 border-bottom bg-slate-100/60 dark:bg-neutral-900/60 d-flex gap-1.5 overflow-auto flex-nowrap" style={{ fontSize: '0.75rem' }}>
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSendMessage(null, p.query)}
                className={`btn btn-xs rounded-pill px-2.5 py-1 flex-shrink-0 text-start border ${
                  isDark ? 'border-neutral-700 bg-neutral-800 text-slate-300 hover:bg-neutral-700' : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {p.label}
              </button>
            ))}
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
                  className={`p-3 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-bottom-right-none'
                      : isDark
                      ? 'bg-slate-800 text-slate-100 rounded-bottom-left-none border border-slate-700'
                      : 'bg-slate-100 text-slate-800 rounded-bottom-left-none'
                  }`}
                  style={{ maxWidth: '85%', whiteSpace: 'pre-line', lineHeight: '1.55' }}
                >
                  <div>{m.text}</div>

                  {/* Clickable Navigation Action Button */}
                  {m.navTarget && MODE_MAP[m.navTarget] && (
                    <div className="mt-2 pt-2 border-top border-white/20 d-flex align-items-center justify-content-between">
                      <span className="small opacity-90" style={{ fontSize: '0.76rem' }}>
                        Ready to navigate?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (onNavigateTab) onNavigateTab(m.navTarget);
                        }}
                        className="btn btn-xs btn-primary bg-white text-primary border-0 rounded-pill px-2.5 py-1 fw-bold shadow-sm d-flex align-items-center gap-1"
                        style={{ fontSize: '0.78rem' }}
                      >
                        {MODE_MAP[m.navTarget].icon}
                        <span>Open {MODE_MAP[m.navTarget].label}</span>
                        <ArrowRight size={11} />
                      </button>
                    </div>
                  )}
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

          {/* Quick Tab Jump Dock */}
          <div className="px-2 py-1.5 border-top d-flex justify-content-between align-items-center gap-1 flex-wrap bg-slate-50 dark:bg-neutral-950" style={{ fontSize: '0.72rem' }}>
            <span className="text-muted fw-semibold px-1">Jump to:</span>
            {Object.entries(MODE_MAP).map(([tabKey, info]) => (
              <button
                key={tabKey}
                type="button"
                onClick={() => {
                  if (onNavigateTab) onNavigateTab(tabKey);
                }}
                className={`btn btn-xs rounded-pill px-2 py-0.5 border ${
                  activeTab === tabKey
                    ? 'btn-primary text-white'
                    : isDark
                    ? 'border-neutral-800 text-slate-300 hover:bg-neutral-900'
                    : 'border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
                title={`Jump to ${info.label}`}
              >
                {info.label.split(' ')[0]}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-2.5 border-top d-flex gap-2 align-items-center">
            <input
              type="text"
              className={`form-control form-control-sm rounded-pill px-3 ${isDark ? 'bg-slate-800 border-slate-700 text-white' : ''}`}
              placeholder="Ask anything or 'take me to study mode'..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || loading}
              className="btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center p-2 shadow-sm"
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

