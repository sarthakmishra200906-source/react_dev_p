import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  GitFork,
  HelpCircle,
  CheckSquare,
  StickyNote,
  Calendar,
  Layers,
  Sparkles,
  BookOpen,
  ArrowRight,
  SlidersHorizontal,
  FileText,
  RotateCcw,
  Check,
  Globe,
} from 'lucide-react';
import FlowchartView from './FlowchartView';
import QuizFlashcards from './QuizFlashcards';
import StandardTaskManager from './StandardTaskManager';
import ImportantNotes from './ImportantNotes';
import StudySchedule from './StudySchedule';
import { comprehensiveFlashcardsPool, comprehensiveMcqsPool } from './studyDataPool';

export default function StudyDashboard({
  isDark = false,
  tasks = [],
  notes = [],
  resources = [],
  onSaveTask,
  onDeleteTask,
  onSaveNote,
  onDeleteNote,
  onEditNote,
  isGuest = false,
  onRequireAuth,
  onOpenResearch,
  onOpenResources,
  user = null,
  isAdmin = false,
}) {
  const isPaid = Boolean(isAdmin || user?.is_paid || user?.tier === 'paid' || user?.role === 'admin');
  const [activeStudyTool, setActiveStudyTool] = useState('all'); // 'all' | 'flowcharts' | 'flashcards' | 'tasks' | 'notes' | 'schedule'
  const [selectedResourceId, setSelectedResourceId] = useState('all'); // 'all' | resource_id

  const availableResources = useMemo(() => resources || [], [resources]);

  // Current active resource item
  const currentResource = useMemo(() => {
    if (selectedResourceId === 'all') return null;
    return availableResources.find((r) => String(r.id) === String(selectedResourceId)) || null;
  }, [selectedResourceId, availableResources]);

  // Helper to strip messy OCR / PDF markers
  const getCleanDescription = (rawText, fallback = 'Core syllabus topic and curriculum guide.') => {
    if (!rawText) return fallback;
    const cleaned = rawText
      .replace(/=== EXTRACTED PDF DOCUMENT CONTENT ===/gi, '')
      .replace(/--- PDF Page \d+ ---/gi, '')
      .replace(/NIST University/gi, '')
      .replace(/Dr Jagannath Panda/gi, '')
      .replace(/Module-\d+/gi, '')
      .replace(/[•\t\r\n]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 160) {
      return cleaned.slice(0, 160).replace(/[,.;:\s]+$/, '') + '...';
    }
    return cleaned || fallback;
  };

  // Dynamic Flowchart data customized based strictly on Resource Hub contents
  const activeFlowchartData = useMemo(() => {
    if (!availableResources || availableResources.length === 0) {
      return { nodes: [], edges: [] };
    }

    // Single Resource Deep Breakdown
    if (currentResource && selectedResourceId !== 'all') {
      const text = (currentResource.text || currentResource.preview || '').toLowerCase();
      const title = currentResource.title || 'Selected Resource';

      const nodes = [
        {
          id: 'c-1',
          label: `${title}: Scope & Taxonomy`,
          type: 'prerequisite',
          description: text.includes('renewable') 
            ? 'Classification of natural resources into renewable (infinite/recoverable) vs non-renewable (exhaustible fossil/mineral stocks).'
            : 'Core definitions, foundational baseline concepts, and module curriculum outline.',
        },
        {
          id: 'c-2',
          label: 'Land & Soil Dynamics',
          type: 'core',
          description: text.includes('erosion') || text.includes('soil')
            ? 'Land degradation drivers (waterlogging, salinization), accelerated soil erosion mechanisms, and conservation tillage practices.'
            : 'Primary theoretical frameworks and environmental evidence documented in resource.',
        },
        {
          id: 'c-3',
          label: 'Forests & Ecosystem Valuation',
          type: 'advanced',
          description: text.includes('forest') || text.includes('tribal')
            ? 'Significance of forest resources: commercial products, tribal livelihoods, global carbon sequestration, and overexploitation rates.'
            : 'Empirical formulations, quantitative data parameters, and structural methodologies.',
        },
        {
          id: 'c-4',
          label: 'Water Conflicts & Watersheds',
          type: 'core',
          description: text.includes('water') || text.includes('cauvery')
            ? 'Surface and groundwater overexploitation, inter-state river water disputes (Cauvery/Sardar Sarovar), and flood/drought dynamics.'
            : 'Applied systems, modern real-world deployments, and ecological context.',
        },
        {
          id: 'c-5',
          label: 'Electrochemical & Energy Systems',
          type: 'review',
          description: text.includes('fuel cell') || text.includes('hydrogen')
            ? 'Reverse electrolysis in H2/O2 fuel cells (Sir William Grove 1839), thermodynamic efficiency (83%), and polarization losses.'
            : 'High-yield active recall mastery and critical examination revision priorities.',
        },
      ];

      return {
        nodes,
        edges: [
          { from: 'c-1', to: 'c-2' },
          { from: 'c-2', to: 'c-3' },
          { from: 'c-2', to: 'c-4' },
          { from: 'c-3', to: 'c-5' },
          { from: 'c-4', to: 'c-5' },
        ],
      };
    }

    // All Resources Cross-Syllabus Hierarchy
    const nodes = availableResources.slice(0, 6).map((res, idx) => {
      const types = ['prerequisite', 'core', 'advanced', 'core', 'review', 'advanced'];
      const cleanDesc = getCleanDescription(
        res.preview || res.description || res.text,
        `Academic module covering core syllabus themes in ${res.title}.`
      );
      return {
        id: String(res.id || idx + 1),
        label: (res.title || `Resource ${idx + 1}`).replace(/\.[^/.]+$/, ''),
        type: types[idx % types.length],
        description: cleanDesc,
      };
    });

    const edges = [];
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.push({ from: nodes[i].id, to: nodes[i + 1].id });
    }
    if (nodes.length > 2) {
      edges.push({ from: nodes[0].id, to: nodes[nodes.length - 1].id });
    }

    return { nodes, edges };
  }, [availableResources, currentResource, selectedResourceId]);

  // Dynamic Flashcards & MCQ quiz pool based strictly on Resource Hub contents & syllabus data pool
  const activeQuizData = useMemo(() => {
    if (!availableResources || availableResources.length === 0) {
      return { flashcards: [], mcqs: [] };
    }

    const targetList = currentResource ? [currentResource] : availableResources;
    const allText = targetList.map((r) => (r.text || r.preview || '')).join(' ').toLowerCase();

    // 1. Intelligent Topic Filtering from comprehensive pool
    const matchedFlashcards = [];
    const matchedMcqs = [];

    const hasSolar = allText.includes('solar') || allText.includes('photovoltaic') || allText.includes('renewable');
    const hasForestLand = allText.includes('forest') || allText.includes('soil') || allText.includes('land') || allText.includes('degradation');
    const hasWater = allText.includes('water') || allText.includes('cauvery') || allText.includes('dam') || allText.includes('river');
    const hasFuelCells = allText.includes('fuel cell') || allText.includes('hydrogen') || allText.includes('electrolysis') || allText.includes('anode');
    const hasCaseStudies = allText.includes('chipko') || allText.includes('appiko') || allText.includes('sardar sarovar') || allText.includes('movement');

    comprehensiveFlashcardsPool.forEach((card) => {
      const cat = card.category;
      if (
        (hasSolar && cat.includes('Solar')) ||
        (hasForestLand && cat.includes('Forest')) ||
        (hasWater && cat.includes('Water')) ||
        (hasFuelCells && cat.includes('Fuel')) ||
        (hasCaseStudies && cat.includes('Case')) ||
        (!hasSolar && !hasForestLand && !hasWater && !hasFuelCells)
      ) {
        matchedFlashcards.push(card);
      }
    });

    comprehensiveMcqsPool.forEach((mcq) => {
      const cat = mcq.category;
      if (
        (hasSolar && cat.includes('Solar')) ||
        (hasForestLand && cat.includes('Forest')) ||
        (hasWater && cat.includes('Water')) ||
        (hasFuelCells && cat.includes('Fuel')) ||
        (hasCaseStudies && cat.includes('Case')) ||
        (!hasSolar && !hasForestLand && !hasWater && !hasFuelCells)
      ) {
        matchedMcqs.push(mcq);
      }
    });

    // Fallback to complete pool if no specific keywords matched
    const finalFlashcards = matchedFlashcards.length > 0 ? matchedFlashcards : comprehensiveFlashcardsPool;
    const finalMcqs = matchedMcqs.length > 0 ? matchedMcqs : comprehensiveMcqsPool;

    return { flashcards: finalFlashcards, mcqs: finalMcqs };
  }, [availableResources, currentResource]);

  // Dynamic Exam Sprint Schedule customized based on actual syllabus modules
  const activeSchedule = useMemo(() => {
    if (!availableResources || availableResources.length === 0) {
      return [];
    }

    const defaultCurriculum = [
      {
        day: 'Sprint Day 1',
        title: 'Natural Resources Classification & Renewable vs Non-Renewable Limits',
        duration: '45 mins',
        topics: [
          'Differentiate organic vs inorganic renewable resources',
          'Review geological timescale depletion for fossil & mineral reserves',
          'Complete active recall drill on resource taxonomy',
        ],
      },
      {
        day: 'Sprint Day 2',
        title: 'Land Resources, Soil Degradation & Conservation Tillage',
        duration: '60 mins',
        topics: [
          'Analyze 56% national land degradation causes: water logging and salinization',
          'Examine geological vs accelerated soil erosion mechanisms',
          'Master soil conservation: contour ploughing, mulching, and terrace farming',
        ],
      },
      {
        day: 'Sprint Day 3',
        title: 'Forest Resources, Deforestation & Tribal Livelihoods',
        duration: '50 mins',
        topics: [
          'Study global forest cover metrics: India 20.6% vs world continents',
          'Analyze commercial timber vs tribal non-timber forest economy',
          'Evaluate ecosystem services: CO2 absorption, hydrological regulation, and erosion mitigation',
        ],
      },
      {
        day: 'Sprint Day 4',
        title: 'Water Exploitation, River Disputes & National Solar Mission',
        duration: '60 mins',
        topics: [
          'Examine surface vs groundwater exploitation and drought vulnerabilities',
          'Review Cauvery inter-state conflict and Sardar Sarovar rehabilitation',
          'Evaluate JNNSM solar targets (100 GW) and decentralized microgrids',
        ],
      },
      {
        day: 'Sprint Day 5',
        title: 'Hydrogen Fuel Cells, Electrochemical Kinetics & Thermodynamics',
        duration: '75 mins',
        topics: [
          'Derive theoretical thermodynamic efficiency: (ΔG/ΔH) * 100 = 83%',
          'Write balanced redox equations: 2H2 -> 4H+ + 4e- and O2 + 4H+ + 4e- -> 2H2O',
          'Compare PEM, Solid Oxide, and Alkaline fuel cell electrolyte membranes',
        ],
      },
    ];

    if (currentResource && selectedResourceId !== 'all') {
      return defaultCurriculum;
    }

    return availableResources.slice(0, 5).map((r, idx) => {
      const cleanTitle = (r.title || `Resource ${idx + 1}`).replace(/\.[^/.]+$/, '');
      const sprintTopics = defaultCurriculum[idx % defaultCurriculum.length].topics;
      return {
        day: `Sprint Day ${idx + 1}`,
        title: `Study Sprint: ${cleanTitle}`,
        duration: `${45 + (idx * 15) % 45} mins`,
        topics: sprintTopics,
      };
    });
  }, [availableResources, currentResource, selectedResourceId]);

  const studyTools = [
    { id: 'all', label: 'All Study Tools', icon: <Layers size={15} /> },
    { id: 'flowcharts', label: 'Concept Flowcharts', icon: <GitFork size={15} /> },
    { id: 'flashcards', label: '3D Flip Flashcards', icon: <HelpCircle size={15} /> },
    { id: 'tasks', label: 'Sprint Tasks', icon: <CheckSquare size={15} /> },
    { id: 'notes', label: 'Obsidian Notes', icon: <StickyNote size={15} /> },
    { id: 'schedule', label: 'Sprint Schedule', icon: <Calendar size={15} /> },
  ];

  const activeScopeTitle = currentResource ? currentResource.title : 'All Resources (Default)';

  // If nothing is present in Resource Hub, render clean empty state
  if (!availableResources || availableResources.length === 0) {
    return (
      <div className={`p-5 rounded-3xl border shadow-sm text-center transition-colors ${
        isDark ? 'bg-neutral-950/70 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <div
          className="rounded-2xl p-4 text-white d-inline-flex align-items-center justify-content-center shadow-sm mb-3"
          style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
        >
          <GraduationCap size={36} />
        </div>
        <h4 className="fw-bold mb-2">No Study Resources in Resource Hub</h4>
        <p className="text-muted small mx-auto mb-4" style={{ maxWidth: '520px' }}>
          Study Mode generates interactive concept flowcharts, 3D active recall flashcards, and personalized revision schedules directly from your uploaded materials. All previous data has been wiped. Upload or add a document in Resource Hub to activate Study Mode.
        </p>
        <div className="d-flex justify-content-center gap-3 flex-wrap">
          {onOpenResources && (
            <button
              type="button"
              onClick={onOpenResources}
              className="btn btn-primary rounded-pill px-4 py-2 fw-semibold d-inline-flex align-items-center gap-2 shadow-sm"
            >
              <BookOpen size={16} />
              <span>Go to Resource Hub & Add Resources</span>
            </button>
          )}
          {onOpenResearch && (
            <button
              type="button"
              onClick={onOpenResearch}
              className="btn btn-outline-secondary rounded-pill px-4 py-2 fw-medium d-inline-flex align-items-center gap-2"
            >
              <Sparkles size={16} />
              <span>Deep Research</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-3xl border shadow-sm transition-colors ${
      isDark ? 'bg-neutral-950/70 border-neutral-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
    }`}>
      {/* Header Banner */}
      <div className="d-flex justify-content-between align-items-center mb-4 pb-3 border-bottom flex-wrap gap-3">
        <div className="d-flex align-items-center gap-3">
          <div
            className="rounded-2xl p-3 text-white d-flex align-items-center justify-content-center shadow-sm"
            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
          >
            <GraduationCap size={26} />
          </div>
          <div>
            <div className="d-flex align-items-center gap-2">
              <h4 className="fw-bold mb-0">Study Mode Dashboard</h4>
              <span className="badge bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-pill small">
                Cognitive Study Engine
              </span>
            </div>
            <p className="small text-muted mb-0">
              Interactive Concept Flowcharts, 3D Active Recall Flashcards, Sprint Tasks, Obsidian Vault Sync & Calendars.
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <div className="d-flex align-items-center gap-2 flex-wrap">
          {onOpenResearch && (
            <button
              type="button"
              onClick={onOpenResearch}
              className="btn btn-sm btn-outline-primary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Deep Research</span>
            </button>
          )}
          {onOpenResources && (
            <button
              type="button"
              onClick={onOpenResources}
              className="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5"
            >
              <BookOpen size={14} />
              <span>Sources Hub</span>
            </button>
          )}
        </div>
      </div>

      {/* RESOURCE SELECTION & CUSTOMIZATION SECTION */}
      <div className={`p-3.5 rounded-2xl border mb-4 transition-all shadow-sm ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50/90 border-slate-200'
      }`}>
        <div className="d-flex justify-content-between align-items-center mb-2 flex-wrap gap-2">
          <div className="d-flex align-items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDark ? 'bg-indigo-950/60 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}>
              <SlidersHorizontal size={16} />
            </div>
            <span className="fw-bold small text-uppercase tracking-wider">
              Study Resource Scope & Customizer
            </span>
            <span className={`badge rounded-pill small px-2.5 py-1 ${
              selectedResourceId === 'all'
                ? isDark ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                : isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {selectedResourceId === 'all' ? '🌐 All Resources (Default)' : `Filtered: ${activeScopeTitle}`}
            </span>
          </div>

          {selectedResourceId !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedResourceId('all')}
              className="btn btn-sm btn-link p-0 text-decoration-none small d-flex align-items-center gap-1 text-primary fw-medium"
            >
              <RotateCcw size={13} />
              Reset to All Resources (Default)
            </button>
          )}
        </div>

        <p className="small text-muted mb-3">
          Select a specific resource below to dynamically tailor your <strong>Concept Flowchart</strong>, <strong>3D Flashcards & Quiz</strong>, and <strong>Sprint Schedule</strong>. Selecting <strong>All Resources (Default)</strong> aggregates all topics across your full syllabus.
        </p>

        {/* Resource Selection Buttons / Chips */}
        <div className="d-flex gap-2 overflow-auto pb-1 flex-wrap align-items-center">
          {/* Default Option: All Resources */}
          <button
            type="button"
            onClick={() => setSelectedResourceId('all')}
            className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-2 transition-all ${
              selectedResourceId === 'all'
                ? 'btn-primary text-white shadow-sm'
                : isDark
                ? 'btn-dark border-neutral-700 text-slate-300 hover:bg-neutral-800'
                : 'btn-light border text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Globe size={14} />
            <span>All Resources (Default)</span>
            {selectedResourceId === 'all' && <Check size={14} className="ms-1" />}
          </button>

          {/* Individual Resources / Presets */}
          {availableResources.map((res) => {
            const isSelected = String(res.id) === String(selectedResourceId);
            const displayTitle = res.title || res.filename || 'Untitled Resource';
            return (
              <button
                key={res.id}
                type="button"
                onClick={() => setSelectedResourceId(res.id)}
                className={`btn btn-sm rounded-pill px-3 py-1.5 fw-medium d-flex align-items-center gap-1.5 transition-all text-truncate ${
                  isSelected
                    ? 'btn-success text-white shadow-sm'
                    : isDark
                    ? 'btn-dark border-neutral-700 text-slate-300 hover:bg-neutral-800'
                    : 'btn-light border text-slate-700 hover:bg-slate-200'
                }`}
                style={{ maxWidth: '320px' }}
                title={displayTitle}
              >
                <FileText size={13} />
                <span className="text-truncate">{displayTitle}</span>
                {isSelected && <Check size={14} className="ms-1 flex-shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sub-navigation Tool Switcher */}
      <div className="d-flex gap-2 overflow-auto pb-2 mb-4">
        {studyTools.map((tool) => (
          <button
            key={tool.id}
            type="button"
            onClick={() => setActiveStudyTool(tool.id)}
            className={`btn btn-sm rounded-pill px-3.5 py-1.5 fw-semibold d-flex align-items-center gap-1.5 flex-shrink-0 transition-all ${
              activeStudyTool === tool.id
                ? 'btn-primary text-white shadow-sm'
                : isDark
                ? 'btn-dark border-neutral-800 text-slate-300 hover:bg-neutral-800'
                : 'btn-light border text-slate-700 hover:bg-slate-100'
            }`}
          >
            {tool.icon}
            <span>{tool.label}</span>
          </button>
        ))}
      </div>

      {/* VIEW: All Tools Grid Overview */}
      {activeStudyTool === 'all' && (
        <div className="d-flex flex-column gap-4">
          {/* Quick Metrics & Feature Highlights */}
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <div
                onClick={() => setActiveStudyTool('flowcharts')}
                className={`p-3.5 rounded-2xl border cursor-pointer h-100 transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-900/60 border-slate-800 hover:border-indigo-500/50' : 'bg-slate-50 border-slate-200 hover:border-indigo-400'
                }`}
              >
                <div className="d-flex align-items-center gap-2 mb-2 text-indigo-400">
                  <GitFork size={18} />
                  <span className="fw-bold small text-uppercase tracking-wider">Visual Hierarchy</span>
                </div>
                <h6 className="fw-bold mb-1">Concept Flowcharts & Mind Maps</h6>
                <p className="small text-muted mb-2">
                  Hierarchical dependency graphs customized to <strong>{activeScopeTitle}</strong>.
                </p>
                <span className="small text-primary fw-medium d-inline-flex align-items-center gap-1">
                  Open Flowchart <ArrowRight size={13} />
                </span>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                onClick={() => setActiveStudyTool('flashcards')}
                className={`p-3.5 rounded-2xl border cursor-pointer h-100 transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-900/60 border-slate-800 hover:border-amber-500/50' : 'bg-slate-50 border-slate-200 hover:border-amber-400'
                }`}
              >
                <div className="d-flex align-items-center gap-2 mb-2 text-amber-400">
                  <HelpCircle size={18} />
                  <span className="fw-bold small text-uppercase tracking-wider">Active Recall</span>
                </div>
                <h6 className="fw-bold mb-1">3D Flip Flashcards & MCQs</h6>
                <p className="small text-muted mb-2">
                  Up to 50 active recall cards & quiz questions (Default: 5, user-customizable) for <strong>{activeScopeTitle}</strong>.
                </p>
                <span className="small text-primary fw-medium d-inline-flex align-items-center gap-1">
                  Open Flashcards & Quiz <ArrowRight size={13} />
                </span>
              </div>
            </div>

            <div className="col-12 col-md-4">
              <div
                onClick={() => setActiveStudyTool('notes')}
                className={`p-3.5 rounded-2xl border cursor-pointer h-100 transition-all hover:scale-[1.01] ${
                  isDark ? 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/50' : 'bg-slate-50 border-slate-200 hover:border-emerald-400'
                }`}
              >
                <div className="d-flex align-items-center gap-2 mb-2 text-emerald-400">
                  <StickyNote size={18} />
                  <span className="fw-bold small text-uppercase tracking-wider">Obsidian Vault</span>
                </div>
                <h6 className="fw-bold mb-1">Notes Hub & Markdown Sync</h6>
                <p className="small text-muted mb-2">
                  Auto-formatted Markdown export with YAML frontmatter, synced directly to your study vault.
                </p>
                <span className="small text-primary fw-medium d-inline-flex align-items-center gap-1">
                  Open Notes Hub <ArrowRight size={13} />
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Concept Flowchart */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-uppercase small tracking-wider text-muted mb-0">
                1. Concept Flowchart & Dependencies ({activeScopeTitle})
              </h6>
              <button
                type="button"
                onClick={() => setActiveStudyTool('flowcharts')}
                className="btn btn-link btn-sm p-0 text-decoration-none"
              >
                Full Screen View →
              </button>
            </div>
            <FlowchartView data={activeFlowchartData} isDark={isDark} />
          </div>

          {/* Section 2: Active Recall Flashcards */}
          <div>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="fw-bold text-uppercase small tracking-wider text-muted mb-0">
                2. Active Recall Flashcards & Quiz ({activeScopeTitle})
              </h6>
              <button
                type="button"
                onClick={() => setActiveStudyTool('flashcards')}
                className="btn btn-link btn-sm p-0 text-decoration-none"
              >
                Full Screen View →
              </button>
            </div>
            <QuizFlashcards data={activeQuizData} isDark={isDark} isPaid={isPaid} isAdmin={isAdmin} />
          </div>

          {/* Section 3: Sprint Schedule & Calendar */}
          <div>
            <h6 className="fw-bold text-uppercase small tracking-wider text-muted mb-2">
              3. Exam Sprint Schedule ({activeScopeTitle})
            </h6>
            <StudySchedule schedule={activeSchedule} isDark={isDark} />
          </div>
        </div>
      )}

      {/* VIEW: Flowcharts */}
      {activeStudyTool === 'flowcharts' && (
        <div>
          <FlowchartView data={activeFlowchartData} isDark={isDark} />
        </div>
      )}

      {/* VIEW: Flashcards */}
      {activeStudyTool === 'flashcards' && (
        <div>
          <QuizFlashcards data={activeQuizData} isDark={isDark} isPaid={isPaid} isAdmin={isAdmin} />
        </div>
      )}

      {/* VIEW: Sprint Tasks */}
      {activeStudyTool === 'tasks' && (
        <div>
          <StandardTaskManager
            tasks={tasks}
            onSaveTask={onSaveTask}
            onDeleteTask={onDeleteTask}
            isDark={isDark}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
          />
        </div>
      )}

      {/* VIEW: Important Notes */}
      {activeStudyTool === 'notes' && (
        <div>
          <ImportantNotes
            notes={notes}
            onSaveNote={onSaveNote}
            onDeleteNote={onDeleteNote}
            onEditNote={onEditNote}
            isDark={isDark}
            isGuest={isGuest}
            onRequireAuth={onRequireAuth}
          />
        </div>
      )}

      {/* VIEW: Sprint Schedule */}
      {activeStudyTool === 'schedule' && (
        <div>
          <StudySchedule schedule={activeSchedule} isDark={isDark} />
        </div>
      )}
    </div>
  );
}
