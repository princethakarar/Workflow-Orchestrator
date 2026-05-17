import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud, FileText, Loader2, CheckCircle2, AlertCircle,
  ChevronDown, ChevronRight, Layers, Cpu, Users, GitMerge, Tag, Zap
} from 'lucide-react';
import api from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

// ── Priority badge ────────────────────────────────────────────────────────────
const PriorityBadge = ({ priority, isDark }) => {
  const p = (priority || '').toLowerCase();
  const cfg = isDark ? {
    high: { cls: 'bg-red-900/40 text-red-300 border-red-700/50', label: '🔴 High' },
    medium: { cls: 'bg-amber-900/40 text-amber-300 border-amber-700/50', label: '🟡 Medium' },
    low: { cls: 'bg-green-900/40 text-green-300 border-green-700/50', label: '🟢 Low' },
  } : {
    high: { cls: 'bg-red-100 text-red-700 border-red-200', label: '🔴 High' },
    medium: { cls: 'bg-amber-100 text-amber-700 border-amber-200', label: '🟡 Medium' },
    low: { cls: 'bg-green-100 text-green-700 border-green-200', label: '🟢 Low' },
  };
  const fallback = isDark
    ? { cls: 'bg-gray-700/50 text-gray-300 border-gray-600', label: priority || '—' }
    : { cls: 'bg-gray-100 text-gray-600 border-gray-200', label: priority || '—' };
  const { cls, label } = cfg[p] || fallback;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${cls}`}>
      {label}
    </span>
  );
};

// ── Complexity badge ──────────────────────────────────────────────────────────
const ComplexityBadge = ({ complexity, isDark }) => {
  const c = (complexity || '').toLowerCase();
  const cfg = isDark ? {
    high: 'bg-purple-900/40 text-purple-300',
    medium: 'bg-blue-900/40 text-blue-300',
    low: 'bg-teal-900/40 text-teal-300',
  } : {
    high: 'bg-purple-100 text-purple-700',
    medium: 'bg-blue-100 text-blue-700',
    low: 'bg-teal-100 text-teal-700',
  };
  const fallback = isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500';
  return complexity ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg[c] || fallback}`}>
      <Zap className="w-3 h-3" />{complexity}
    </span>
  ) : null;
};

// ── Role badge ────────────────────────────────────────────────────────────────
const RoleBadge = ({ role, isDark }) => {
  const cfg = isDark ? {
    Frontend: 'bg-indigo-900/40 text-indigo-300',
    Backend: 'bg-orange-900/40 text-orange-300',
    Fullstack: 'bg-cyan-900/40 text-cyan-300',
    DevOps: 'bg-slate-700/50 text-slate-300',
  } : {
    Frontend: 'bg-indigo-100 text-indigo-700',
    Backend: 'bg-orange-100 text-orange-700',
    Fullstack: 'bg-cyan-100 text-cyan-700',
    DevOps: 'bg-slate-100 text-slate-700',
  };
  const fallback = isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-500';
  return role ? (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg[role] || fallback}`}>
      <Users className="w-3 h-3" />{role}
    </span>
  ) : null;
};

// ── Single Task Card ──────────────────────────────────────────────────────────
const TaskRow = ({ task, index, teamContext, isDark }) => {
  const [open, setOpen] = useState(index < 2); // first 2 open by default

  const assignedUser = task.assignedTo && teamContext
    ? teamContext.find(u => u.id === task.assignedTo)
    : null;

  return (
    <div className={`border rounded-lg overflow-hidden shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-start gap-3 p-4 transition-colors text-left ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}`}
      >
        <span className={`mt-0.5 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {open ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className={`font-semibold text-sm ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{task.task}</span>
            <PriorityBadge priority={task.priority} isDark={isDark} />
            <ComplexityBadge complexity={task.estimated_complexity} isDark={isDark} />
            <RoleBadge role={task.suggested_role} isDark={isDark} />
          </div>
          {task.description && (
            <p className={`text-xs line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{task.description}</p>
          )}
        </div>
      </button>

      {/* Expanded body */}
      {open && (
        <div className={`px-4 pb-4 border-t space-y-3 ${isDark ? 'bg-gray-800/60 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
          {/* Subtasks */}
          {Array.isArray(task.subtasks) && task.subtasks.length > 0 && (
            <div className="pt-3">
              <p className={`text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <Cpu className="w-3 h-3" /> Subtasks ({task.subtasks.length})
              </p>
              <ul className="space-y-1.5">
                {task.subtasks.map((s, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className={`mt-1 w-4 h-4 rounded-full border-2 flex-shrink-0 ${isDark ? 'border-indigo-500' : 'border-indigo-300'}`} />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Dependencies */}
          {Array.isArray(task.dependencies) && task.dependencies.length > 0 && (
            <div>
              <p className={`text-xs font-semibold uppercase tracking-wide mb-1 flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <GitMerge className="w-3 h-3" /> Depends on
              </p>
              <div className="flex flex-wrap gap-1.5">
                {task.dependencies.map((dep, i) => (
                  <span key={i} className={`px-2 py-0.5 border rounded text-xs ${isDark ? 'bg-indigo-900/30 text-indigo-300 border-indigo-700/50' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Assigned user */}
          {assignedUser && (
            <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <Users className={`w-3 h-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <span>Assigned to <strong>{assignedUser.name}</strong> ({assignedUser.specialization})</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Module Panel ──────────────────────────────────────────────────────────────
const ModulePanel = ({ mod, teamContext, isDark }) => {
  const [open, setOpen] = useState(true);
  const taskCount = mod.tasks?.length || 0;

  return (
    <div className={`border rounded-xl overflow-hidden shadow-sm ${isDark ? 'border-indigo-500/30' : 'border-indigo-200'}`}>
      {/* Module header */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-full flex items-center gap-3 px-5 py-4 bg-gradient-to-r transition-colors text-left ${
          isDark
            ? 'from-indigo-950/60 to-gray-800 hover:from-indigo-900/60'
            : 'from-indigo-50 to-white hover:from-indigo-100'
        }`}
      >
        <Layers className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <span className={`font-bold text-base ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>{mod.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isDark ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
              {taskCount} task{taskCount !== 1 ? 's' : ''}
            </span>
          </div>
          {mod.module_description && (
            <p className={`text-xs mt-0.5 ${isDark ? 'text-indigo-400/80' : 'text-indigo-500'}`}>{mod.module_description}</p>
          )}
        </div>
        {open ? <ChevronDown className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-400'}`} /> : <ChevronRight className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-400'}`} />}
      </button>

      {/* Tasks */}
      {open && (
        <div className={`p-4 space-y-3 ${isDark ? 'bg-gray-800/50' : 'bg-white'}`}>
          {Array.isArray(mod.tasks) && mod.tasks.length > 0
            ? mod.tasks.map((task, i) => (
              <TaskRow key={task.task || i} task={task} index={i} teamContext={teamContext} isDark={isDark} />
            ))
            : <p className={`text-sm italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No tasks in this module.</p>
          }
        </div>
      )}
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const AiPdfUpload = () => {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const promptRef = useRef(null);
  const [file, setFile] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('create_new');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [parsedData, setParsedData] = useState(null);

  // Auto-focus prompt field on mount
  useEffect(() => {
    if (promptRef.current) promptRef.current.focus();
  }, []);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/api/projects');
        setProjects(res.data.data || res.data || []);
      } catch (err) {
        console.error('Failed to fetch projects', err);
      }
    };
    fetchProjects();
  }, []);

  // ── Parse response whenever result changes ─────────────────────────────────
  useEffect(() => {
    if (!result) { setParsedData(null); return; }

    // Backend returns `data` as already-parsed JSON
    if (result.data && typeof result.data === 'object' && result.data.modules) {
      setParsedData(result.data);
      return;
    }

    // Fallback: try parsing the raw AI response string
    const raw = result.aiResponse;
    if (!raw) { setParsedData(null); return; }
    try {
      let text = raw;
      if (text.includes('```json')) text = text.split('```json')[1].split('```')[0];
      else if (text.includes('```')) text = text.split('```')[1].split('```')[0];
      setParsedData(JSON.parse(text.trim()));
    } catch { setParsedData(null); }
  }, [result]);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f); setError(null);
    } else {
      setFile(null); setError('Please select a valid PDF file.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) { setError('Please select a PDF file to upload.'); return; }

    setIsLoading(true); setError(null); setResult(null); setSaveSuccess(false);

    const formData = new FormData();
    formData.append('file', file);
    if (prompt) formData.append('prompt', prompt);
    if (selectedProjectId) formData.append('projectId', selectedProjectId);

    try {
      const response = await api.post('/api/ai/process-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Flatten modules → tasks for the bulk save endpoint ────────────────────
  const flattenModulesToTasks = (data) => {
    if (!data?.modules) return [];
    const flat = [];
    let globalIndex = 1;

    for (const mod of data.modules) {
      for (const t of (mod.tasks || [])) {
        flat.push({
          id: globalIndex++,
          title: t.task,
          description: [
            t.description || '',
            mod.name ? `Module: ${mod.name}` : '',
            t.suggested_role ? `Suggested role: ${t.suggested_role}` : '',
            t.estimated_complexity ? `Complexity: ${t.estimated_complexity}` : '',
          ].filter(Boolean).join('\n'),
          priority: (t.priority || 'medium').toLowerCase(),
          assignedTo: t.assignedTo && t.assignedTo !== 'unspecified' ? t.assignedTo : undefined,
          // subtasks: map string steps → { title } objects the schema understands
          subtasks: Array.isArray(t.subtasks)
            ? t.subtasks.map(s => ({ title: s }))
            : [],
          // dependencies resolved by name → numeric id in bulkCreateTasks on backend
          dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
        });
      }
    }
    return flat;
  };

  const handleSaveAll = async () => {
    if (!selectedProjectId) {
      setError("Please select a project from the dropdown before saving.");
      return;
    }

    setIsSaving(true); setError(null); setSaveSuccess(false);

    try {
      const data = parsedData;
      if (!data) throw new Error('Could not parse the AI response. Please try again.');

      let targetProjectId = selectedProjectId;

      // Create new project if requested
      if (selectedProjectId === 'create_new') {
        let userId = user?.id || user?._id;
        if (!userId && user?.user) userId = user.user.id || user.user._id;
        if (!userId) {
          const stored = localStorage.getItem('user');
          if (stored) { const p = JSON.parse(stored); userId = p._id || p.id; }
        }
        if (!userId) throw new Error('Could not resolve your user ID. Please log out and back in.');

        const newProjectRes = await api.post('/api/projects', {
          name: data.project_name || 'AI Generated Project',
          description: data.project_summary || 'Generated from PDF documentation',
          managerId: userId,
        });
        const newProject = newProjectRes.data.data || newProjectRes.data;
        targetProjectId = newProject._id || newProject.id;
        setProjects(prev => [newProject, ...prev]);
        setSelectedProjectId(targetProjectId);
      }

      const tasks = flattenModulesToTasks(data);
      if (tasks.length === 0) throw new Error('No tasks found in the AI response.');

      await api.post(`/api/projects/${targetProjectId}/tasks/bulk`, { tasks });

      setSaveSuccess(true);
      setResult(null);
      setParsedData(null);
      setFile(null);
      setPrompt('');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save tasks.');
    } finally {
      setIsSaving(false);
    }
  };

  // Count total tasks across modules
  const totalTaskCount = parsedData?.modules?.reduce((acc, m) => acc + (m.tasks?.length || 0), 0) || 0;
  const moduleCount = parsedData?.modules?.length || 0;

  return (
    <div style={{
      maxWidth: '48rem', margin: '0 auto', padding: '1.5rem',
      background: 'var(--bg-card)', borderRadius: '0.75rem',
      boxShadow: 'var(--shadow-hover)',
      border: '1px solid var(--border)',
      transition: 'all 0.3s ease',
    }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>AI Task Generator</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Upload a document — the AI will plan modules, tasks, subtasks & dependencies.</p>
      </div>

      <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* File Upload */}
        <div style={{
          border: '2px dashed var(--border-indigo)', borderRadius: '0.5rem', padding: '2rem',
          background: 'var(--bg-blue-subtle)', position: 'relative', cursor: 'pointer',
          transition: 'background 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-blue-subtle)'}
        >
          <input type="file" accept=".pdf" onChange={handleFileChange}
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', pointerEvents: 'none' }}>
            {file ? (
              <>
                <FileText style={{ width: 48, height: 48, color: 'var(--text-indigo)' }} />
                <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{file.name}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
              </>
            ) : (
              <>
                <UploadCloud style={{ width: 48, height: 48, color: 'var(--text-indigo)' }} />
                <span style={{ color: 'var(--text-indigo)', fontWeight: 500 }}>Click to upload or drag and drop</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF up to 10MB</span>
              </>
            )}
          </div>
        </div>

        {/* Project Selector — hidden, default is create_new */}
        <input type="hidden" value={selectedProjectId} />

        {/* Focus Prompt — hidden */}
        <input type="hidden" value={prompt} />

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', borderRadius: '0.5rem', background: 'var(--bg-red-subtle)', border: '1px solid var(--border-red)' }}>
            <AlertCircle style={{ width: 20, height: 20, color: 'var(--text-red)', flexShrink: 0 }} />
            <span style={{ fontSize: '0.875rem', color: 'var(--text-red)' }}>{error}</span>
          </div>
        )}

        {/* Submit */}
        <button type="submit" disabled={isLoading || !file} style={{
          width: '100%', padding: '0.75rem 1.5rem', borderRadius: '0.5rem', border: 'none',
          background: (isLoading || !file) ? 'var(--bg-muted)' : 'linear-gradient(135deg, #6366f1 0%, #7c3aed 100%)',
          color: '#fff', fontWeight: 500, fontSize: '1rem', cursor: (isLoading || !file) ? 'not-allowed' : 'pointer',
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
          transition: 'background 0.2s', opacity: (isLoading || !file) ? 0.6 : 1,
          boxShadow: (isLoading || !file) ? 'none' : '0 4px 12px rgba(99, 102, 241, 0.35)'
        }}
        >
          {isLoading ? (<><Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /><span>Analyzing Document…</span></>) : (<span>Generate Execution Plan</span>)}
        </button>
      </form>

      {/* Save success */}
      {saveSuccess && (
        <div style={{ marginTop: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', borderRadius: '0.5rem', background: 'var(--bg-emerald-subtle)', border: '1px solid var(--border-emerald)' }}>
          <CheckCircle2 style={{ width: 24, height: 24, color: 'var(--text-emerald)', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 600, color: 'var(--text-emerald)' }}>Tasks saved successfully!</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>All modules and tasks have been added to the project.</p>
          </div>
        </div>
      )}

      {/* Results */}
      {result && parsedData && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary bar */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle2 style={{ width: 20, height: 20, color: 'var(--text-emerald)' }} />
                <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>Execution Plan Ready</h3>
              </div>
              {parsedData.project_name && (
                <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-indigo)', marginTop: '0.25rem' }}>{parsedData.project_name}</h4>
              )}
              {parsedData.project_summary && (
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem', maxWidth: '36rem' }}>{parsedData.project_summary}</p>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-muted)', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{moduleCount}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modules</p>
              </div>
              <div style={{ textAlign: 'center', padding: '0.5rem 1rem', background: 'var(--bg-muted)', borderRadius: '0.5rem' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>{totalTaskCount}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Tasks</p>
              </div>
            </div>
          </div>

          {/* RAG meta */}
          {result.ragMeta && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-page)', padding: '0.5rem 0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
              <Tag style={{ width: 12, height: 12 }} />
              RAG: retrieved {result.ragMeta.retrievedChunks} of {result.ragMeta.totalChunks} chunks
              {result.ragMeta.query && <> · query: <em>"{result.ragMeta.query.slice(0, 60)}"</em></>}
            </div>
          )}

          {/* Modules */}
          {Array.isArray(parsedData.modules) && parsedData.modules.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {parsedData.modules.map((mod, i) => (
                <ModulePanel key={mod.name || i} mod={mod} teamContext={result.teamContext} isDark={isDark} />
              ))}
            </div>
          ) : (
            <div style={{ background: 'var(--bg-muted)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--border)', maxHeight: '400px', overflowY: 'auto' }}>
              <pre style={{ fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result.aiResponse || JSON.stringify(result.data, null, 2)}</pre>
            </div>
          )}

          {/* Save button */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border)', paddingTop: '1.5rem' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
              {totalTaskCount} tasks across {moduleCount} modules will be saved
            </p>
            <button onClick={handleSaveAll} disabled={isSaving || !selectedProjectId}
              style={{
                padding: '0.625rem 1.5rem', borderRadius: '0.5rem', border: 'none',
                background: (isSaving || !selectedProjectId) ? 'var(--bg-muted)' : '#16a34a',
                color: '#fff', fontWeight: 500, cursor: (isSaving || !selectedProjectId) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '0.5rem',
                opacity: (isSaving || !selectedProjectId) ? 0.6 : 1, transition: 'background 0.2s',
                boxShadow: (isSaving || !selectedProjectId) ? 'none' : '0 4px 12px rgba(22, 163, 74, 0.25)'
              }}
              title={!selectedProjectId ? 'Select a project first' : ''}
            >
              {isSaving ? (<><Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /><span>Saving…</span></>) : (<><CheckCircle2 style={{ width: 20, height: 20 }} /><span>Save to Project</span></>)}
            </button>
          </div>

          {/* Text snippet */}
          {(result.extractedTextSnippet || result.ragMeta) && (
            <details style={{ fontSize: '0.875rem', color: 'var(--text-muted)', cursor: 'pointer' }}>
              <summary style={{ transition: 'color 0.2s' }}>View extraction details</summary>
              <div style={{ marginTop: '0.5rem', padding: '1rem', background: 'var(--bg-muted)', borderRadius: '0.375rem', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '0.75rem', overflowX: 'auto', whiteSpace: 'pre-wrap', color: 'var(--text-primary)' }}>
                {result.extractedTextSnippet || `Retrieved ${result.ragMeta?.retrievedChunks || result.chunks_retrieved || '?'} chunks from document`}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Fallback when response exists but couldn't be parsed as modules */}
      {result && !parsedData && (result.aiResponse || result.data) && (
        <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <AlertCircle style={{ width: 20, height: 20, color: 'var(--text-amber)' }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Received raw response (could not parse as modules)</p>
          </div>
          <div style={{ background: 'var(--bg-muted)', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid var(--border)', maxHeight: '400px', overflowY: 'auto' }}>
            <pre style={{ fontSize: '0.75rem', color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}>{result.aiResponse || JSON.stringify(result.data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default AiPdfUpload;
